#!/bin/bash
set -euo pipefail

fail() { echo "[LAUNCH GATE] FAIL: $*" >&2; exit 1; }
ok() { echo "[LAUNCH GATE] PASS: $*"; }

[ -f package.json ] || fail "package.json missing"
[ -f server.production.ts ] || fail "server.production.ts missing"
[ -f app.js ] || fail "app.js missing"
[ -f cpanel_mysql_setup.sql ] || fail "MySQL schema missing"
[ -f scripts/preflight.sh ] || fail "preflight missing"
[ -f scripts/production_smoke_test.ts ] || fail "database smoke test missing"
[ -f scripts/http_smoke_test.sh ] || fail "HTTP smoke test missing"
ok "Production runtime files exist"

if grep -RInE 'libertamedia2026|admin123|local-admin-token-' --exclude-dir=.git --exclude='*.md' --exclude='*.example' .; then
  fail "Unsafe fallback credential found"
fi
ok "No known legacy fallback credentials"

if grep -RInE 'ADMIN_PASSWORD|JWT_SECRET' server.production.ts app.js src scripts --exclude='*.md' 2>/dev/null; then
  fail "Legacy runtime credential dependency found"
fi
ok "Production runtime does not depend on legacy password/JWT env vars"

if grep -nE 'readDatabase\(|writeDatabase\(' server.production.ts >/dev/null; then
  fail "Production server still uses legacy storage adapter API"
fi
ok "Production server is not using legacy JSON storage API"

if grep -nE 'ADMIN_SESSIONS|LOGIN_ATTEMPTS' server.production.ts >/dev/null; then
  fail "In-memory authentication state remains in production server"
fi
ok "No in-memory auth state in production server"

if grep -nE 'DATABASE_TYPE.*json|JsonStorageAdapter' server.production.ts >/dev/null; then
  fail "JSON storage fallback detected in production runtime"
fi
ok "No JSON storage fallback in production runtime"

echo "[LAUNCH GATE] Static production gate passed."
