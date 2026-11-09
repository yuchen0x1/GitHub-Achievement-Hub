#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck disable=SC1091
. "${SCRIPT_DIR}/common.sh"

require_commands systemctl readlink
validate_config
ensure_layout

current_release="$(resolve_link "$CURRENT_LINK" || true)"
previous_release="$(resolve_link "$PREVIOUS_LINK" || true)"
[[ -n "$current_release" && -d "$current_release" ]] || die "没有有效的 current Release"
release_path_is_safe "$current_release" || die "current Release 路径不安全"
[[ -n "$previous_release" && -d "$previous_release" ]] || die "没有可回滚的 previous Release"
release_path_is_safe "$previous_release" || die "previous Release 路径不安全"
[[ "$previous_release" != "$current_release" ]] || die "previous Release 与 current Release 相同"
valid_release_artifacts "$previous_release" || die "previous Release 产物不完整"

exec 9>"$LOCK_FILE"
flock -n 9 || die "已有另一个更新任务正在运行"

restore_after_failure() {
  local exit_code=$?
  trap - ERR
  set +e
  log "回滚后的健康检查失败，恢复原 current Release"
  atomic_link "$current_release" "$CURRENT_LINK"
  atomic_link "$previous_release" "$PREVIOUS_LINK"
  systemctl_action restart "$GACH_API_SERVICE"
  systemctl_action restart "$GACH_WEB_SERVICE"
  exit "$exit_code"
}
trap restore_after_failure ERR

log "切换到旧版本: $previous_release"
atomic_link "$current_release" "$PREVIOUS_LINK"
atomic_link "$previous_release" "$CURRENT_LINK"
systemctl_action restart "$GACH_API_SERVICE"
"${SCRIPT_DIR}/health-check.sh" api
systemctl_action restart "$GACH_WEB_SERVICE"
"${SCRIPT_DIR}/health-check.sh" all
trap - ERR

read_release_metadata "$previous_release"
write_state deployed-version "$RELEASE_TAG"
write_state deployed-commit "$RELEASE_COMMIT"
write_state last-check "$(date -u '+%Y-%m-%dT%H:%M:%SZ') rollback $RELEASE_TAG $RELEASE_COMMIT"
log "回滚完成: $RELEASE_TAG ($RELEASE_COMMIT)"
