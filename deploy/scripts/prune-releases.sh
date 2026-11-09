#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck disable=SC1091
. "${SCRIPT_DIR}/common.sh"

require_commands find readlink
validate_config
ensure_layout

if [[ "${GACH_SKIP_LOCK:-false}" != true ]]; then
  require_commands flock
  exec 9>"$LOCK_FILE"
  flock -n 9 || die "已有另一个更新任务正在运行"
fi

current_release="$(resolve_link "$CURRENT_LINK" || true)"
previous_release="$(resolve_link "$PREVIOUS_LINK" || true)"
mapfile -t releases < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -regextype posix-extended -regex '.*/v[0-9]+\.[0-9]+\.[0-9]+-[0-9a-fA-F]{12}' -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)

protected=0
[[ -n "$current_release" ]] && ((protected += 1))
[[ -n "$previous_release" && "$previous_release" != "$current_release" ]] && ((protected += 1))
keep_history=$((GACH_RELEASE_KEEP - protected))
((keep_history < 0)) && keep_history=0
kept=0
for release_dir in "${releases[@]}"; do
  if [[ "$release_dir" == "$current_release" || "$release_dir" == "$previous_release" ]]; then
    continue
  fi
  if (( kept < keep_history )); then
    ((kept += 1))
    continue
  fi
  release_path_is_safe "$release_dir" || continue
  log "清理旧 Release: $release_dir"
  rm -rf -- "$release_dir"
done
