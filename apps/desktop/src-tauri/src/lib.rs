//! GitHub Achievement Hub — 桌面端（Tauri v2）主逻辑。
//!
//! 职责边界：
//!   1. 承载 Web 端「静态导出」产物（`apps/desktop/dist`，由
//!      `scripts/prepare-dist.mjs` 从 `apps/web/out` 复制并注入运行期脚本）。
//!   2. 提供 **本地缓存命令**（`cache_*`），供注入脚本在离线时回读勋章数据。
//!   3. 提供 **API Base 配置命令**（`api_base_*`），解决静态导出后
//!      `/api/v1` 同源代理失效的问题。
//!
//! 配置优先级（高 → 低）：
//!   运行期配置文件 `config.json` → 环境变量 `GACH_API_BASE` →
//!   编译期常量 `GACH_API_BASE` → 内置默认值。

mod cache;

use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// 内置默认 API 地址（本地开发时 NestJS 的默认端口）。
const DEFAULT_API_BASE: &str = "http://localhost:4000/api/v1";
const CONFIG_FILE: &str = "config.json";

/// 编译期注入的默认值（构建时 `GACH_API_BASE=... npx tauri build` 可覆盖内置默认）。
const COMPILED_API_BASE: Option<&str> = option_env!("GACH_API_BASE");

#[derive(Debug, Default, Serialize, Deserialize)]
struct AppConfig {
    #[serde(default, rename = "apiBase")]
    api_base: Option<String>,
}

fn app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("无法定位应用数据目录: {e}"))
}

fn read_config(dir: &PathBuf) -> AppConfig {
    let path = dir.join(CONFIG_FILE);
    fs::read_to_string(path)
        .ok()
        .and_then(|t| serde_json::from_str::<AppConfig>(&t).ok())
        .unwrap_or_default()
}

fn write_config(dir: &PathBuf, cfg: &AppConfig) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|e| format!("创建配置目录失败: {e}"))?;
    let text = serde_json::to_string_pretty(cfg).map_err(|e| format!("序列化配置失败: {e}"))?;
    fs::write(dir.join(CONFIG_FILE), text).map_err(|e| format!("写入配置失败: {e}"))
}

/// 规范化用户输入的 base：去掉尾部斜杠，保证以 `/api/v1` 结尾的写法可用。
fn normalize_base(raw: &str) -> String {
    let trimmed = raw.trim().trim_end_matches('/');
    trimmed.to_string()
}

fn resolve_api_base(app: &AppHandle) -> String {
    if let Ok(dir) = app_data_dir(app) {
        if let Some(base) = read_config(&dir).api_base {
            if !base.trim().is_empty() {
                return normalize_base(&base);
            }
        }
    }
    if let Ok(base) = std::env::var("GACH_API_BASE") {
        if !base.trim().is_empty() {
            return normalize_base(&base);
        }
    }
    if let Some(base) = COMPILED_API_BASE {
        if !base.trim().is_empty() {
            return normalize_base(base);
        }
    }
    DEFAULT_API_BASE.to_string()
}

/* ------------------------------------------------------------ commands */

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    name: String,
    version: String,
    identifier: String,
    api_base: String,
    default_api_base: String,
    cache_dir: String,
    platform: String,
}

#[tauri::command]
fn app_info(app: AppHandle) -> Result<AppInfo, String> {
    let dir = app_data_dir(&app)?;
    let pkg = app.package_info();
    Ok(AppInfo {
        name: pkg.name.clone(),
        version: pkg.version.to_string(),
        identifier: app.config().identifier.clone(),
        api_base: resolve_api_base(&app),
        default_api_base: DEFAULT_API_BASE.to_string(),
        cache_dir: dir.to_string_lossy().to_string(),
        platform: std::env::consts::OS.to_string(),
    })
}

#[tauri::command]
fn api_base_get(app: AppHandle) -> Result<String, String> {
    Ok(resolve_api_base(&app))
}

#[tauri::command]
fn api_base_set(app: AppHandle, base: String) -> Result<String, String> {
    let dir = app_data_dir(&app)?;
    let normalized = normalize_base(&base);
    let mut cfg = read_config(&dir);
    cfg.api_base = if normalized.is_empty() {
        None
    } else {
        Some(normalized.clone())
    };
    write_config(&dir, &cfg)?;
    Ok(normalized)
}

#[tauri::command]
fn cache_write(
    app: AppHandle,
    key: String,
    value: serde_json::Value,
    ttl_ms: Option<i64>,
) -> Result<cache::CacheEntry, String> {
    let dir = app_data_dir(&app)?;
    cache::write(&dir, &key, value, ttl_ms.unwrap_or(0))
}

#[tauri::command]
fn cache_read(app: AppHandle, key: String) -> Result<Option<cache::CacheEntry>, String> {
    let dir = app_data_dir(&app)?;
    Ok(cache::read(&dir, &key))
}

#[tauri::command]
fn cache_list(app: AppHandle) -> Result<Vec<cache::CacheEntry>, String> {
    let dir = app_data_dir(&app)?;
    Ok(cache::list(&dir))
}

#[tauri::command]
fn cache_remove(app: AppHandle, key: String) -> Result<bool, String> {
    let dir = app_data_dir(&app)?;
    cache::remove_key(&dir, &key)
}

#[tauri::command]
fn cache_clear(app: AppHandle) -> Result<(), String> {
    let dir = app_data_dir(&app)?;
    cache::clear(&dir)
}

/* ---------------------------------------------------------------- run */

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        // 自动更新：固定公钥校验签名与版本，详见 docs/AUTO_UPDATE.md。
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            app_info,
            api_base_get,
            api_base_set,
            cache_write,
            cache_read,
            cache_list,
            cache_remove,
            cache_clear,
        ])
        .setup(|app| {
            if let Ok(dir) = app.path().app_data_dir() {
                let _ = fs::create_dir_all(&dir);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用失败");
}
