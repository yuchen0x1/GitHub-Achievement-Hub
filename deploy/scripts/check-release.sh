#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck disable=SC1091
. "${SCRIPT_DIR}/common.sh"

require_commands curl git "$NODE_BIN" readlink
validate_config
ensure_layout

IFS=$'\t' read -r tag commit release_url published_at <<< "$(latest_release)"
release_name="$(release_id "$tag" "$commit")"

printf 'repository=%s\n' "$GACH_REPOSITORY"
printf 'tag=%s\n' "$tag"
printf 'commit=%s\n' "$commit"
printf 'release_url=%s\n' "$release_url"
printf 'published_at=%s\n' "$published_at"
printf 'release_name=%s\n' "$release_name"
printf 'deployed_release=%s\n' "$(resolve_link "$CURRENT_LINK" || true)"
