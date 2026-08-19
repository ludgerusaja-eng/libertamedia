#!/bin/bash
set -euo pipefail

BASE_URL="${APP_URL:-https://libertamedia.com}"
BASE_URL="${BASE_URL%/}"

check() {
  local path="$1"
  local expected="${2:-200}"
  local status
  status="$(curl -k -L -sS -o /tmp/liberta-smoke-body -w '%{http_code}' "$BASE_URL$path")"
  if [ "$status" != "$expected" ]; then
    echo "[HTTP SMOKE] FAIL $path expected=$expected got=$status"
    cat /tmp/liberta-smoke-body
    exit 1
  fi
  echo "[HTTP SMOKE] OK $path ($status)"
}

check "/api/health" 200
check "/" 200
check "/api/articles" 200
check "/robots.txt" 200
check "/sitemap.xml" 200

rm -f /tmp/liberta-smoke-body
echo "[HTTP SMOKE] All checks passed for $BASE_URL"
