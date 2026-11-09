#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck disable=SC1091
. "${SCRIPT_DIR}/common.sh"

require_commands curl "$NODE_BIN" systemctl
validate_config

http_is_ready() {
  local url="$1"
  curl --fail --silent --show-error --location --connect-timeout 3 --max-time 8 "$url" >/dev/null
}

api_is_ready() {
  local response status database
  response="$(curl --fail --silent --show-error --location --connect-timeout 3 --max-time 8 "$GACH_API_HEALTH_URL")" || return 1
  IFS=$'\t' read -r status database <<< "$(printf '%s' "$response" | "$NODE_BIN" -e '
const fs = require("node:fs");
let payload;
try {
  payload = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
  process.exit(1);
}
process.stdout.write(`${payload.status ?? ""}\t${payload.database ?? ""}`);
')" || return 1
  [[ "$status" == ok && "$database" == ok ]]
}

check_service() {
  local service="$1"
  systemctl_action is-active --quiet "$service"
}

wait_for() {
  local label="$1"
  shift
  local attempt
  for ((attempt = 1; attempt <= GACH_HEALTH_RETRIES; attempt += 1)); do
    if "$@"; then
      return 0
    fi
    sleep "$GACH_HEALTH_INTERVAL"
  done
  die "${label}失败，已重试 ${GACH_HEALTH_RETRIES} 次"
}

mode="${1:-all}"
case "$mode" in
  api)
    log "检查 API 服务状态"
    wait_for "API systemd 服务检查" check_service "$GACH_API_SERVICE"
    log "检查 API 健康端点"
    wait_for "API 健康检查" api_is_ready
    ;;
  all)
    log "检查 API 服务状态"
    wait_for "API systemd 服务检查" check_service "$GACH_API_SERVICE"
    log "检查 API 健康端点"
    wait_for "API 健康检查" api_is_ready
    log "检查 Web 服务状态"
    wait_for "Web systemd 服务检查" check_service "$GACH_WEB_SERVICE"
    log "检查 Web 健康端点"
    wait_for "Web 健康检查" http_is_ready "$GACH_WEB_HEALTH_URL"
    ;;
  *)
    die "用法: $0 [api|all]"
    ;;
esac
log "健康检查通过"
