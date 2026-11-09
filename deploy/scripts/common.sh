#!/usr/bin/env bash

set -u

UPDATER_ENV_FILE="${UPDATER_ENV_FILE:-/etc/github-achievement-hub/updater.env}"
if [[ -r "$UPDATER_ENV_FILE" ]]; then
  # The updater environment is an administrator-owned systemd EnvironmentFile.
  # shellcheck disable=SC1090
  . "$UPDATER_ENV_FILE"
fi

GACH_REPOSITORY="${GACH_REPOSITORY:-yuchen0x1/GitHub-Achievement-Hub}"
GACH_DEPLOY_ROOT="${GACH_DEPLOY_ROOT:-/srv/github-achievement-hub}"
GACH_RELEASE_KEEP="${GACH_RELEASE_KEEP:-3}"
GACH_GIT_URL="${GACH_GIT_URL:-https://github.com/${GACH_REPOSITORY}.git}"
GACH_GITHUB_API_URL="${GACH_GITHUB_API_URL:-https://api.github.com}"
GACH_NPM_CACHE="${GACH_NPM_CACHE:-${GACH_DEPLOY_ROOT}/shared/npm-cache}"
GACH_API_ENV_FILE="${GACH_API_ENV_FILE:-/etc/github-achievement-hub/api.env}"
GACH_API_INTERNAL_URL="${GACH_API_INTERNAL_URL:-http://127.0.0.1:4000/api/v1}"
GACH_API_HEALTH_URL="${GACH_API_HEALTH_URL:-http://127.0.0.1:4000/api/v1/health}"
GACH_BUILD_API_PORT="${GACH_BUILD_API_PORT:-4100}"
GACH_BUILD_API_INTERNAL_URL="${GACH_BUILD_API_INTERNAL_URL:-http://127.0.0.1:${GACH_BUILD_API_PORT}/api/v1}"
GACH_BUILD_API_HEALTH_URL="${GACH_BUILD_API_HEALTH_URL:-http://127.0.0.1:${GACH_BUILD_API_PORT}/api/v1/health}"
GACH_WEB_HEALTH_URL="${GACH_WEB_HEALTH_URL:-http://127.0.0.1:3000/healthz}"
GACH_API_SERVICE="${GACH_API_SERVICE:-gach-api.service}"
GACH_WEB_SERVICE="${GACH_WEB_SERVICE:-gach-web.service}"
GACH_HEALTH_RETRIES="${GACH_HEALTH_RETRIES:-30}"
GACH_HEALTH_INTERVAL="${GACH_HEALTH_INTERVAL:-2}"
GACH_RUN_MIGRATIONS="${GACH_RUN_MIGRATIONS:-false}"
GACH_GITHUB_TOKEN="${GACH_GITHUB_TOKEN:-}"
GACH_GIT_SSH_COMMAND="${GACH_GIT_SSH_COMMAND:-}"
NODE_BIN="${GACH_NODE_BIN:-node}"
NPM_BIN="${GACH_NPM_BIN:-npm}"

if [[ -n "$GACH_GIT_SSH_COMMAND" ]]; then
  export GIT_SSH_COMMAND="$GACH_GIT_SSH_COMMAND"
fi
if [[ -n "$GACH_GITHUB_TOKEN" && "$GACH_GIT_URL" == https://github.com/* ]]; then
  export GIT_CONFIG_COUNT=1
  export GIT_CONFIG_KEY_0='http.https://github.com/.extraheader'
  export GIT_CONFIG_VALUE_0="Authorization: Bearer ${GACH_GITHUB_TOKEN}"
fi

RELEASES_DIR="${GACH_DEPLOY_ROOT}/releases"
CURRENT_LINK="${GACH_DEPLOY_ROOT}/current"
PREVIOUS_LINK="${GACH_DEPLOY_ROOT}/previous"
STATE_DIR="${GACH_DEPLOY_ROOT}/state"
LOCK_DIR="${GACH_DEPLOY_ROOT}/lock"
LOCK_FILE="${LOCK_DIR}/update.lock"

log() {
  printf '[%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" >&2
}

die() {
  log "ERROR: $*"
  exit 1
}

require_commands() {
  local command_name
  for command_name in "$@"; do
    if [[ "$command_name" == */* ]]; then
      [[ -x "$command_name" ]] || die "找不到可执行文件: $command_name"
    else
      command -v "$command_name" >/dev/null 2>&1 || die "找不到命令: $command_name"
    fi
  done
}

validate_config() {
  [[ "$GACH_REPOSITORY" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || die "GACH_REPOSITORY 格式无效"
  [[ "$GACH_DEPLOY_ROOT" == /* ]] || die "GACH_DEPLOY_ROOT 必须是绝对路径"
  [[ "$GACH_DEPLOY_ROOT" != *[[:space:]]* ]] || die "GACH_DEPLOY_ROOT 不能包含空白字符"
  [[ "$GACH_RELEASE_KEEP" =~ ^[2-9][0-9]*$ ]] || die "GACH_RELEASE_KEEP 必须是不小于 2 的整数"
  [[ "$GACH_HEALTH_RETRIES" =~ ^[1-9][0-9]*$ ]] || die "GACH_HEALTH_RETRIES 必须是正整数"
  [[ "$GACH_HEALTH_INTERVAL" =~ ^[1-9][0-9]*$ ]] || die "GACH_HEALTH_INTERVAL 必须是正整数"
  [[ "$GACH_BUILD_API_PORT" =~ ^[1-9][0-9]{2,4}$ ]] || die "GACH_BUILD_API_PORT 必须是有效端口"
  [[ "$GACH_RUN_MIGRATIONS" == true || "$GACH_RUN_MIGRATIONS" == false ]] || die "GACH_RUN_MIGRATIONS 只能是 true 或 false"
}

ensure_layout() {
  mkdir -p -- "$RELEASES_DIR" "$GACH_NPM_CACHE" "$STATE_DIR" "$LOCK_DIR"
}

github_curl() {
  local url="$1"
  local -a args=(
    --fail
    --silent
    --show-error
    --location
    --retry 2
    --connect-timeout 10
    --max-time 30
    -H 'Accept: application/vnd.github+json'
    -H 'X-GitHub-Api-Version: 2022-11-28'
  )

  if [[ -n "$GACH_GITHUB_TOKEN" ]]; then
    args+=(-H "Authorization: Bearer ${GACH_GITHUB_TOKEN}")
  fi

  curl "${args[@]}" "$url"
}

resolve_tag_commit() {
  local tag="$1"
  local refs resolved_sha sha ref

  refs="$(git ls-remote "$GACH_GIT_URL" "refs/tags/${tag}" "refs/tags/${tag}^{}")" || die "无法解析 Git 标签: $tag"
  resolved_sha=''
  while IFS=$' \t' read -r sha ref; do
    case "$ref" in
      "refs/tags/${tag}^{}")
        resolved_sha="$sha"
        ;;
      "refs/tags/${tag}")
        [[ -n "$resolved_sha" ]] || resolved_sha="$sha"
        ;;
    esac
  done <<< "$refs"

  [[ "$resolved_sha" =~ ^[0-9a-fA-F]{40}$ ]] || die "Git 标签没有解析到提交: $tag"
  printf '%s\n' "${resolved_sha,,}"
}

latest_release() {
  local release_json release_fields tag commit url published_at

  release_json="$(github_curl "${GACH_GITHUB_API_URL}/repos/${GACH_REPOSITORY}/releases/latest")" || die "无法读取 GitHub 最新 Release"
  release_fields="$(printf '%s' "$release_json" | "$NODE_BIN" -e '
const fs = require("node:fs");
let release;
try {
  release = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
  console.error("GitHub Release 响应不是有效 JSON");
  process.exit(1);
}
if (release.draft || release.prerelease) {
  console.error("最新 Release 不能是 draft 或 prerelease");
  process.exit(1);
}
if (typeof release.tag_name !== "string" || !/^v[0-9]+\.[0-9]+\.[0-9]+$/.test(release.tag_name)) {
  console.error("Release 标签必须符合 vX.Y.Z");
  process.exit(1);
}
if (typeof release.html_url !== "string" || typeof release.published_at !== "string") {
  console.error("GitHub Release 缺少必要字段");
  process.exit(1);
}
process.stdout.write([release.tag_name, release.html_url, release.published_at].join(String.fromCharCode(9)));
' )" || die "GitHub Release 数据校验失败"

  IFS=$'\t' read -r tag url published_at <<< "$release_fields"
  commit="$(resolve_tag_commit "$tag")"
  printf '%s\t%s\t%s\t%s\n' "$tag" "$commit" "$url" "$published_at"
}

release_id() {
  local tag="$1"
  local commit="$2"
  printf '%s-%s\n' "$tag" "${commit:0:12}"
}

resolve_link() {
  local link="$1"
  readlink -f -- "$link" 2>/dev/null
}

atomic_link() {
  local target="$1"
  local link="$2"
  local temporary_link="${link}.tmp.${BASHPID}"

  rm -f -- "$temporary_link"
  ln -s -- "$target" "$temporary_link"
  mv -Tf -- "$temporary_link" "$link"
}

write_state() {
  local key="$1"
  local value="$2"
  printf '%s\n' "$value" > "${STATE_DIR}/${key}"
}

read_release_metadata() {
  local release_dir="$1"
  local metadata_file="${release_dir}/.gach-release"
  local key value

  RELEASE_TAG=''
  RELEASE_COMMIT=''
  RELEASE_URL=''
  RELEASE_PUBLISHED_AT=''

  [[ -r "$metadata_file" ]] || return 1
  while IFS='=' read -r key value; do
    case "$key" in
      tag) RELEASE_TAG="$value" ;;
      commit) RELEASE_COMMIT="$value" ;;
      release_url) RELEASE_URL="$value" ;;
      published_at) RELEASE_PUBLISHED_AT="$value" ;;
    esac
  done < "$metadata_file"

  [[ "$RELEASE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || return 1
  [[ "$RELEASE_COMMIT" =~ ^[0-9a-fA-F]{40}$ ]] || return 1
  [[ -n "$RELEASE_URL" ]] || return 1
}

valid_release_artifacts() {
  local release_dir="$1"
  [[ -f "${release_dir}/apps/api/dist/main.js" ]] || return 1
  [[ -f "${release_dir}/apps/web/.next/BUILD_ID" ]] || return 1
  read_release_metadata "$release_dir"
}

release_path_is_safe() {
  local release_dir="$1"
  [[ "$release_dir" == "$RELEASES_DIR"/* ]] || return 1
  [[ "${release_dir##*/}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+-[0-9a-fA-F]{12}$ ]]
}

systemctl_action() {
  if [[ "${GACH_USE_SUDO:-false}" == true ]]; then
    /usr/bin/sudo -n /usr/bin/systemctl "$@"
  else
    systemctl "$@"
  fi
}

load_api_env() {
  [[ -r "$GACH_API_ENV_FILE" ]] || die "API 环境文件不可读: $GACH_API_ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  . "$GACH_API_ENV_FILE"
  set +a
}
