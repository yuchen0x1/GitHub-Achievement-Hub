# 服务器自动更新部署

这套部署包让服务器主动轮询 GitHub Release，不需要在服务器上开放 webhook 端口。发布新的正式 SemVer 标签后，服务器会在独立目录中拉取、安装依赖、构建 API/Web、原子切换 `current`、依次重启服务并执行健康检查；新版本失败时自动恢复旧版本。

## 更新规则

- 只处理正式 GitHub Release，`draft` 和 `prerelease` 会被拒绝。
- 只接受 `vX.Y.Z` 标签，例如 `v1.2.3`；不要让服务器跟踪 `main`。
- 每个版本目录名包含标签和提交短哈希，例如 `v1.2.3-0123456789ab`。
- 生产环境变量位于 `/etc/github-achievement-hub/`，不会被复制进 Release 目录。
- 更新器默认不执行数据库迁移。由于当前仓库没有可部署的 Prisma migration 基线，只有在已补齐并审查向前兼容 migration 后，才应设置 `GACH_RUN_MIGRATIONS=true`。
- 每次 API 重启后先检查 `/api/v1/health` 且要求 `status=ok`、`database=ok`，再重启 Web 并检查 `/healthz`。

## 服务器要求

- Ubuntu/Debian 或其他带 systemd 的 Linux 发行版；
- Node.js 24（最低版本遵循根目录 `package.json` 的 Node 引擎要求）；
- npm、Git、curl、flock、systemd；
- 生产 PostgreSQL；
- 运行服务的 Linux 用户 `gach`；
- 服务器能够访问 GitHub API 和仓库 Git URL；
- 首次部署前 PostgreSQL 已创建且可连接，数据库结构和初始资料需先通过已审查的 migration/初始化流程准备好。

不建议用 root 运行 Node 服务。下面的路径约定使用：

```text
/srv/github-achievement-hub/
├── current -> releases/v1.2.3-0123456789ab
├── previous -> releases/v1.2.2-fedcba987654
├── releases/
├── shared/npm-cache/
├── state/
└── lock/update.lock
```

## 首次安装

以下操作需要管理员权限。先创建用户和目录，并让 `gach` 拥有整个部署根目录：

```bash
sudo useradd --system --home /srv/github-achievement-hub --shell /usr/sbin/nologin gach
sudo install -d -o gach -g gach /srv/github-achievement-hub
sudo install -d -o gach -g gach /etc/github-achievement-hub
```

把项目源码复制到 `/srv/github-achievement-hub/source` 或克隆到临时目录后，将本目录中的 `deploy/` 复制到目标环境。更新器只依赖部署脚本本身，不使用 `source` 作为运行版本。先按下面的环境文件和 systemd 小节完成权限、配置和 unit 安装，再执行首次部署。

## 环境文件

从 [`env.example`](./env.example)、[`web.env.example`](./web.env.example) 和 [`updater.env.example`](./updater.env.example) 复制模板，填写实际值：

```bash
sudo install -o root -g gach -m 0640 deploy/env.example /etc/github-achievement-hub/api.env
sudo install -o root -g gach -m 0640 deploy/web.env.example /etc/github-achievement-hub/web.env
sudo install -o root -g gach -m 0640 deploy/updater.env.example /etc/github-achievement-hub/updater.env
sudoedit /etc/github-achievement-hub/api.env
sudoedit /etc/github-achievement-hub/web.env
sudoedit /etc/github-achievement-hub/updater.env
```

至少需要在 `api.env` 设置：

```dotenv
NODE_ENV=production
DB_PROVIDER=postgres
DATABASE_URL=postgresql://user:password@127.0.0.1:5432/github_achievement_hub
PORT=4000
API_PREFIX=/api/v1
WEB_ORIGIN=https://example.com
SITE_URL=https://example.com
JWT_SECRET=生成一个独立的随机值
REFRESH_TOKEN_SECRET=生成另一个独立的随机值
TOKEN_ENCRYPTION_KEY=64位十六进制密钥
ADMIN_PASSWORD=独立的管理员密码
```

`web.env` 用于 Next.js 运行时，运行期代理地址由 updater 的 `GACH_API_INTERNAL_URL` 烘焙进 Next.js rewrite；构建期页面数据请求单独使用 updater 的 `GACH_BUILD_API_INTERNAL_URL`（默认为临时构建 API），避免临时端口被写入运行产物：

```dotenv
PORT=3000
HOSTNAME=127.0.0.1
```

updater 的内部地址区分如下：

```dotenv
GACH_API_INTERNAL_URL=http://127.0.0.1:4000/api/v1       # Next.js 运行期 /api/v1 rewrite
GACH_BUILD_API_INTERNAL_URL=http://127.0.0.1:4100/api/v1 # 仅用于构建期服务端数据读取
GACH_BUILD_API_PORT=4100
```

如果仓库是私有仓库，在 `updater.env` 设置只读 GitHub fine-grained token；公开仓库可以留空：

```dotenv
GACH_REPOSITORY=yuchen0x1/GitHub-Achievement-Hub
GACH_DEPLOY_ROOT=/srv/github-achievement-hub
GACH_API_INTERNAL_URL=http://127.0.0.1:4000/api/v1
GACH_BUILD_API_PORT=4100
GACH_BUILD_API_INTERNAL_URL=http://127.0.0.1:4100/api/v1
GACH_RUN_MIGRATIONS=false
GACH_RELEASE_KEEP=3
GACH_GITHUB_TOKEN=
```

生产环境不要设置 `DB_AUTO_PUSH=true` 或 `DB_AUTO_SEED=true`。不要把真实 env 文件提交到 Git。

## 安装 systemd

把 unit 文件安装到 `/etc/systemd/system/`，把 sudo 规则安装到 `/etc/sudoers.d/`：

```bash
sudo install -o root -g root -m 0644 deploy/systemd/gach-api.service /etc/systemd/system/gach-api.service
sudo install -o root -g root -m 0644 deploy/systemd/gach-web.service /etc/systemd/system/gach-web.service
sudo install -o root -g root -m 0644 deploy/systemd/gach-updater.service /etc/systemd/system/gach-updater.service
sudo install -o root -g root -m 0644 deploy/systemd/gach-updater.timer /etc/systemd/system/gach-updater.timer
sudo install -o root -g root -m 0440 deploy/systemd/gach-updater.sudoers /etc/sudoers.d/gach-updater
sudo visudo -cf /etc/sudoers.d/gach-updater
sudo systemctl daemon-reload
```

安装 unit 后先执行首次部署，首次部署会从最新正式 Release 构建并创建 `current`：

```bash
sudo -u gach /srv/github-achievement-hub/source/deploy/scripts/deploy-release.sh
```

首次部署成功后启用 API、Web 服务和自动更新 timer：

```bash
sudo systemctl enable --now gach-api.service gach-web.service gach-updater.timer
```

脚本所在路径为 `current/deploy/scripts/`，因此更新后 systemd updater 会自动使用新版本脚本。更新器需要重启 API/Web，sudo 规则只允许两个固定 service 的 `restart` 和 `is-active` 操作，不允许执行任意 root 命令。

检查运行状态：

```bash
systemctl status gach-api.service gach-web.service gach-updater.timer
systemctl list-timers gach-updater.timer
journalctl -u gach-updater.service -n 100 --no-pager
```

## 手动检查、更新和回滚

```bash
/srv/github-achievement-hub/current/deploy/scripts/check-release.sh
/srv/github-achievement-hub/current/deploy/scripts/deploy-release.sh
/srv/github-achievement-hub/current/deploy/scripts/health-check.sh
/srv/github-achievement-hub/current/deploy/scripts/rollback.sh
/srv/github-achievement-hub/current/deploy/scripts/prune-releases.sh
```

如果 updater 运行用户不是 root，必须保留 `gach-updater.sudoers`；不要用 `sudo systemctl` 执行未审查的远程脚本。

## 发布新版本

本仓库的 Release 流程由 [`release.yml`](../.github/workflows/release.yml) 驱动。发布前创建并推送符合规则的标签：

```bash
git tag v1.1.0
git push origin v1.1.0
```

GitHub Actions 会执行依赖安装、lint、API 单元测试和生产构建，成功后创建正式 GitHub Release。服务器 timer 默认约每 15 分钟检查一次，另加随机延迟以避免多个实例同时请求 GitHub API。

标签一旦发布，不要移动同名标签覆盖已部署提交。需要修复时创建新的 patch 版本。

## 数据库迁移

当前仓库没有 `apps/api/prisma/migrations/` 基线，因此默认 `GACH_RUN_MIGRATIONS=false`。首次部署前必须用受控方式准备 PostgreSQL 的表结构和种子数据；不要在生产环境用 `prisma db push` 替代 migration。

补齐 migration 后，先在备份数据库和预发布环境验证，再将配置改为：

```dotenv
GACH_RUN_MIGRATIONS=true
```

迁移必须遵守 expand-contract：先新增可兼容结构，再发布同时兼容新旧结构的应用，最后在后续版本清理旧结构。破坏性迁移不应与需要旧字段的应用版本放在同一次自动更新中。

## 故障处理

- 构建失败：不会切换 `current`，临时构建目录会被清理。
- API 或 Web 健康检查失败：自动恢复更新前的 `current`，并重启两个服务。
- 首次部署失败：不会留下未验证的 `current`。
- 清理旧版本失败：不会影响已经通过健康检查的当前版本，可稍后手动运行 prune 脚本。
- 详细日志：`journalctl -u gach-updater.service`、`journalctl -u gach-api.service`、`journalctl -u gach-web.service`。

保留的 Release 数量由 `GACH_RELEASE_KEEP` 控制，脚本始终尽量保留 current 和 previous；默认值 3 表示在有 previous 时再保留一个历史版本。
