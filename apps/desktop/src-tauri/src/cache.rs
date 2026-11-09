//! 本地缓存层。
//!
//! 目的：桌面端在 **API 不可达（离线 / 内网 / 服务未启动）** 时，仍能展示
//! 最近浏览过的勋章数据。
//!
//! 存储位置：`{app_data_dir}/achievement-cache.json`
//!   - Windows: `%APPDATA%\com.gach.hub\achievement-cache.json`
//!
//! 写入策略：先写临时文件再 `rename`，避免半截文件导致下次启动解析失败。

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

pub const CACHE_FILE: &str = "achievement-cache.json";

/// 单条缓存记录。`ttl_ms <= 0` 表示永不过期。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry {
    pub key: String,
    pub value: serde_json::Value,
    /// Unix 毫秒时间戳
    pub cached_at: i64,
    #[serde(default)]
    pub ttl_ms: i64,
}

impl CacheEntry {
    pub fn is_expired(&self, now_ms: i64) -> bool {
        self.ttl_ms > 0 && now_ms.saturating_sub(self.cached_at) > self.ttl_ms
    }
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct CacheFile {
    #[serde(default)]
    version: u32,
    #[serde(default)]
    entries: BTreeMap<String, CacheEntry>,
}

/// 全局写锁：Tauri 命令可能并发进入，避免交错写坏文件。
static WRITE_LOCK: Mutex<()> = Mutex::new(());

pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn cache_path(dir: &Path) -> PathBuf {
    dir.join(CACHE_FILE)
}

fn load(dir: &Path) -> CacheFile {
    let path = cache_path(dir);
    let Ok(text) = fs::read_to_string(&path) else {
        return CacheFile { version: 1, entries: BTreeMap::new() };
    };
    serde_json::from_str::<CacheFile>(&text).unwrap_or(CacheFile {
        version: 1,
        entries: BTreeMap::new(),
    })
}

fn save(dir: &Path, data: &CacheFile) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|e| format!("创建缓存目录失败: {e}"))?;
    let path = cache_path(dir);
    let tmp = path.with_extension("json.tmp");
    let text = serde_json::to_string_pretty(data).map_err(|e| format!("序列化缓存失败: {e}"))?;
    fs::write(&tmp, text).map_err(|e| format!("写入临时缓存失败: {e}"))?;
    // Windows 上 rename 到已存在的文件会失败，先删目标
    if path.exists() {
        let _ = fs::remove_file(&path);
    }
    fs::rename(&tmp, &path).map_err(|e| format!("提交缓存文件失败: {e}"))
}

/// 写入 / 覆盖一条缓存。
pub fn write(dir: &Path, key: &str, value: serde_json::Value, ttl_ms: i64) -> Result<CacheEntry, String> {
    let _guard = WRITE_LOCK.lock().map_err(|_| "缓存写锁污染".to_string())?;
    let mut data = load(dir);
    let entry = CacheEntry {
        key: key.to_string(),
        value,
        cached_at: now_ms(),
        ttl_ms,
    };
    data.entries.insert(key.to_string(), entry.clone());
    data.version = 1;
    save(dir, &data)?;
    Ok(entry)
}

/// 读取一条缓存（顺带做过期判断，过期返回 `None`）。
pub fn read(dir: &Path, key: &str) -> Option<CacheEntry> {
    let data = load(dir);
    let entry = data.entries.get(key)?.clone();
    if entry.is_expired(now_ms()) {
        return None;
    }
    Some(entry)
}

/// 列出全部（未过期的）缓存条目，按写入时间倒序。
pub fn list(dir: &Path) -> Vec<CacheEntry> {
    let now = now_ms();
    let data = load(dir);
    let mut items: Vec<CacheEntry> = data
        .entries
        .into_values()
        .filter(|e| !e.is_expired(now))
        .collect();
    items.sort_by(|a, b| b.cached_at.cmp(&a.cached_at));
    items
}

pub fn clear(dir: &Path) -> Result<(), String> {
    let _guard = WRITE_LOCK.lock().map_err(|_| "缓存写锁污染".to_string())?;
    let path = cache_path(dir);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("删除缓存失败: {e}"))?;
    }
    Ok(())
}

pub fn remove_key(dir: &Path, key: &str) -> Result<bool, String> {
    let _guard = WRITE_LOCK.lock().map_err(|_| "缓存写锁污染".to_string())?;
    let mut data = load(dir);
    let existed = data.entries.remove(key).is_some();
    if existed {
        save(dir, &data)?;
    }
    Ok(existed)
}
