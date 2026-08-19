#!/bin/bash
set -euo pipefail

# LIBERTAMEDIA production deployment hook for cPanel / Passenger.
DEPLOYPATH="${DEPLOYPATH:-/home/libp7469/libertamedia}"
BACKUP_ROOT="${BACKUP_ROOT:-/home/libp7469/deploy_backups}"
BACKUP_DIR="$BACKUP_ROOT/$(date +%Y%m%d_%H%M%S)"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
fail() { log "ERROR: $*"; exit 1; }

log "Starting LIBERTAMEDIA production deployment"
[ -d "$DEPLOYPATH" ] || fail "Deployment path does not exist: $DEPLOYPATH"
[ -f "$DEPLOYPATH/.env" ] || fail "Production .env is missing. Create it manually in cPanel; never copy .env.example into .env."

set -a
# shellcheck disable=SC1091
source "$DEPLOYPATH/.env"
set +a

[ "${NODE_ENV:-}" = "production" ] || fail "NODE_ENV must be production"
[ "${DATABASE_TYPE:-}" = "mysql" ] || fail "DATABASE_TYPE must be mysql for production"
[ -n "${DB_HOST:-}" ] || fail "DB_HOST is missing"
[ -n "${DB_USER:-}" ] || fail "DB_USER is missing"
[ -n "${DB_PASSWORD:-}" ] || fail "DB_PASSWORD is missing"
[ -n "${DB_NAME:-}" ] || fail "DB_NAME is missing"
[ -n "${ADMIN_EMAIL:-}" ] || fail "ADMIN_EMAIL is missing"
[ -n "${UPLOAD_DIR:-}" ] || fail "UPLOAD_DIR is missing"

[ -f "$DEPLOYPATH/scripts/preflight.sh" ] || fail "Production preflight script is missing"
chmod +x "$DEPLOYPATH/scripts/preflight.sh"
"$DEPLOYPATH/scripts/preflight.sh" || fail "Production environment preflight failed"

# cPanel/CloudLinux deployment hooks may not inherit the Node.js Selector PATH.
# Prefer an already configured runtime, then fall back to the Alt-NodeJS runtime
# used by this account's Passenger application.
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  for node_bin in /opt/alt/alt-nodejs*/root/usr/bin; do
    if [ -x "$node_bin/node" ] && [ -x "$node_bin/npm" ]; then
      export PATH="$node_bin:$PATH"
      break
    fi
  done
fi

command -v node >/dev/null 2>&1 || fail "Node.js runtime not found in cPanel deployment environment"
command -v npm >/dev/null 2>&1 || fail "npm runtime not found in cPanel deployment environment"
log "Node runtime: $(node -v)"
log "npm runtime: $(npm -v)"

mkdir -p "$BACKUP_ROOT" "$BACKUP_DIR" "$UPLOAD_DIR"
case "$UPLOAD_DIR" in
  "$DEPLOYPATH"/*) fail "UPLOAD_DIR must be outside the Passenger application root to prevent direct filesystem exposure" ;;
esac
chmod 750 "$UPLOAD_DIR"

tar --exclude='node_modules' --exclude='tmp' --exclude='dist/uploads' -czf "$BACKUP_DIR/libertamedia.tgz" -C "$DEPLOYPATH" . || fail "Pre-deploy backup failed"

cd "$DEPLOYPATH"
# Dependency resolution uses the current production package manifest.
npm install --no-audit --no-fund
npm rebuild sharp

[ -f "$DEPLOYPATH/dist/server.cjs" ] || fail "dist/server.cjs is missing; deploy a successful production build first"
[ -f "$DEPLOYPATH/dist/index.html" ] || fail "dist/index.html is missing; deploy a successful production build first"
[ -f "$DEPLOYPATH/app.cjs" ] || fail "app.cjs is missing; Passenger cannot start the application"

grep -q 'PassengerStartupFile app.cjs' "$DEPLOYPATH/.htaccess" || fail ".htaccess is not configured for app.cjs"

# Regenerate SEO feeds from the current MySQL state before Passenger restart.
npm run generate:feeds || fail "SEO feed generation failed"

mkdir -p "$DEPLOYPATH/tmp"
touch "$DEPLOYPATH/tmp/restart.txt"
log "LIBERTAMEDIA production deployment completed"
