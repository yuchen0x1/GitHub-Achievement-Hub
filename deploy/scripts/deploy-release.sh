#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck disable=SC1091
. "${SCRIPT_DIR}/common.sh"

require_commands curl git "$NODE_BIN" "$NPM_BIN" flock systemctl readlink
validate_config
ensure_layout

exec 9>"$LOCK_FILE"
flock -n 9 || die "已有另一个更新任务正在运行"

old_current="$(resolve_link "$CURRENT_LINK" || true)"
old_previous="$(resolve_link "$PREVIOUS_LINK" || true)"
new_release_dir=''
new_release_created=false
switch_started=false
release_switched=false

rollback_after_failure() {
  local exit_code=$?
  trap - ERR
  set +e

  if [[ "$switch_started" == true ]]; then
    if [[ -n "$old_current" && -d "$old_current" ]]; then
      log "部署失败，恢复旧版本: $old_current"
      atomic_link "$old_current" "$CURRENT_LINK"
      if [[ -n "$old_previous" && -d "$old_previous" ]]; then
        atomic_link "$old_previous" "$PREVIOUS_LINK"
      else
        rm -f -- "$PREVIOUS_LINK"
      fi
      if [[ "$release_switched" == true ]]; then
        systemctl_action restart "$GACH_API_SERVICE"
        systemctl_action restart "$GACH_WEB_SERVICE"
      fi
    else
      log "首次部署失败，移除未验证的 current Release"
      rm -f -- "$CURRENT_LINK" "$PREVIOUS_LINK"
    fi
    write_state last-failure "$(date -u '+%Y-%m-%dT%H:%M:%SZ') ${new_release_dir:-unknown}"
  fi

  if [[ "$new_release_created" == true && -n "$new_release_dir" && -d "$new_release_dir" ]]; then
    rm -rf -- "$new_release_dir"
  fi

  exit "$exit_code"
}
trap rollback_after_failure ERR

IFS=$'\t' read -r tag commit release_url published_at <<< "$(latest_release)"
release_name="$(release_id "$tag" "$commit")"
new_release_dir="${RELEASES_DIR}/${release_name}"

if [[ -e "$new_release_dir" ]]; then
  valid_release_artifacts "$new_release_dir" || die "已存在但不完整的 Release 目录: $new_release_dir"
  read_release_metadata "$new_release_dir"
  [[ "${RELEASE_COMMIT,,}" == "$commit" ]] || die "Release 目录提交不匹配: $new_release_dir"
  log "复用已构建 Release: $release_name"
else
  build_dir="${RELEASES_DIR}/.${release_name}.building.${BASHPID}"
  rm -rf -- "$build_dir"
  mkdir -p -- "$build_dir"
  trap 'rm -rf -- "${build_dir:-}"' EXIT

  log "拉取 Release: ${tag} (${commit})"
  git clone --quiet --depth 1 --branch "$tag" --single-branch "$GACH_GIT_URL" "$build_dir/source"
  cloned_commit="$(git -C "$build_dir/source" rev-parse HEAD)"
  [[ "${cloned_commit,,}" == "$commit" ]] || die "拉取到的提交与 Release 标签不一致"

  log "安装依赖"
  (cd "$build_dir/source" && "$NPM_BIN" ci --cache "$GACH_NPM_CACHE" --prefer-offline --no-audit --no-fund)

  log "构建 API"
  (cd "$build_dir/source" && \
    "$NPM_BIN" run build -w @gach/shared && \
    "$NPM_BIN" run build:api)
  [[ -f "$build_dir/source/apps/api/dist/main.js" ]] || die "API 构建产物不存在"

  load_api_env
  if [[ "$GACH_RUN_MIGRATIONS" == true ]]; then
    log "执行 Prisma 向前兼容迁移"
    (cd "$build_dir/source/apps/api" && "$NPM_BIN" exec prisma migrate deploy)
  fi

  build_api_pid=''
  cleanup_build_api() {
    if [[ -n "$build_api_pid" ]] && kill -0 "$build_api_pid" 2>/dev/null; then
      kill "$build_api_pid" 2>/dev/null || true
      wait "$build_api_pid" 2>/dev/null || true
    fi
  }
  cleanup_build_process() {
    cleanup_build_api
    rm -rf -- "$build_dir"
  }
  trap cleanup_build_process EXIT
  log "启动构建用 API"
  (
    cd "$build_dir/source/apps/api"
    PORT="$GACH_BUILD_API_PORT" \
    API_PREFIX=/api/v1 \
    NODE_ENV=production \
    DB_PROVIDER=postgres \
    DB_AUTO_PUSH=false \
    DB_AUTO_SEED=false \
    "$NODE_BIN" dist/main.js
  ) >"$build_dir/api-build.log" 2>&1 &
  build_api_pid=$!
  wait_for_build_api() {
    local attempt
    for ((attempt = 1; attempt <= GACH_HEALTH_RETRIES; attempt += 1)); do
      if curl --fail --silent --show-error --max-time 5 "$GACH_BUILD_API_HEALTH_URL" >/dev/null; then
        return 0
      fi
      if ! kill -0 "$build_api_pid" 2>/dev/null; then
        cat "$build_dir/api-build.log" >&2
        return 1
      fi
      sleep "$GACH_HEALTH_INTERVAL"
    done
    cat "$build_dir/api-build.log" >&2
    return 1
  }
  wait_for_build_api || die "构建用 API 未能启动"

  log "构建 Web"
  (cd "$build_dir/source" && \
    API_INTERNAL_URL="$GACH_BUILD_API_INTERNAL_URL" \
    NEXT_PUBLIC_EXPORT_MODE=0 \
    "$NPM_BIN" run build:web)
  [[ -f "$build_dir/source/apps/web/.next/BUILD_ID" ]] || die "Web 构建产物不存在"
  cleanup_build_api

  printf 'tag=%s\ncommit=%s\nrelease_url=%s\npublished_at=%s\n' \
    "$tag" "$commit" "$release_url" "$published_at" > "$build_dir/source/.gach-release"
  mv -- "$build_dir/source" "$new_release_dir"
  new_release_created=true
  rm -rf -- "$build_dir"
  trap - EXIT
fi

if [[ "$old_current" == "$new_release_dir" ]]; then
  log "当前已经是最新 Release: $tag"
  write_state last-check "$(date -u '+%Y-%m-%dT%H:%M:%SZ') $tag $commit"
  exit 0
fi

switch_started=true
if [[ -n "$old_current" && -d "$old_current" ]]; then
  atomic_link "$old_current" "$PREVIOUS_LINK"
fi
atomic_link "$new_release_dir" "$CURRENT_LINK"
release_switched=true

log "重启 API 服务"
systemctl_action restart "$GACH_API_SERVICE"
"${SCRIPT_DIR}/health-check.sh" api

log "重启 Web 服务"
systemctl_action restart "$GACH_WEB_SERVICE"
"${SCRIPT_DIR}/health-check.sh" all

write_state deployed-version "$tag"
write_state deployed-commit "$commit"
write_state last-check "$(date -u '+%Y-%m-%dT%H:%M:%SZ') $tag $commit"
rm -f -- "${STATE_DIR}/last-failure"

if ! GACH_SKIP_LOCK=true "${SCRIPT_DIR}/prune-releases.sh"; then
  log "警告：旧 Release 清理失败，不影响本次已通过健康检查的部署"
fi
log "部署完成: $tag ($commit)"
