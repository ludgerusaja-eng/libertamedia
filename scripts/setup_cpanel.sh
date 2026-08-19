#!/bin/bash
set -euo pipefail

# LIBERTAMEDIA production deployment hook for cPanel / Passenger.
# Keep this hook lightweight: cPanel shared hosting already provides the
# configured Node.js virtual environment. Do NOT run npm install/rebuild on
# every Git deployment because that can exhaust CloudLinux process limits.
DEPLOYPATH="${DEPLOYPATH:-/home/libp7469/libertamedia}"
BACKUP_ROOT="${BACKUP_ROOT:-/home/libp7469/deploy_backups}"
BACKUP_DIR="$BACKUP_ROOT/$(date +%Y%m%d_%H%M%S)"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
fail() { log "ERROR: $*"; exit 1; }

log "Starting LIBERTAMEDIA production deployment"
[ -d "$DEPLOYPATH" ] || fail "Deployment path does not exist: $DEPLOYPATH"
[ -f "$DEPLOYPATH/.env" ] || fail "Production .env is missing at $DEPLOYPATH/.env"

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
# Prefer the configured Alt-NodeJS runtime used by this account's Passenger app.
if ! command -v node >/dev/null 2>&1; then
  for node_bin in /opt/alt/alt-nodejs*/root/usr/bin; do
    if [ -x "$node_bin/node" ]; then
      export PATH="$node_bin:$PATH"
      break
    fi
  done
fi

command -v node >/dev/null 2>&1 || fail "Node.js runtime not found in cPanel deployment environment"
log "Node runtime: $(node -v)"

mkdir -p "$BACKUP_ROOT" "$BACKUP_DIR" "$UPLOAD_DIR"
case "$UPLOAD_DIR" in
  "$DEPLOYPATH"/*) fail "UPLOAD_DIR must be outside the application root" ;;
esac
chmod 750 "$UPLOAD_DIR"

tar --exclude='node_modules' --exclude='tmp' --exclude='dist/uploads' -czf "$BACKUP_DIR/app.tgz" -C "$DEPLOYPATH" . || fail "Pre-deploy backup failed"

# Dependencies are managed by the cPanel Node.js virtual environment.
# Avoid npm install/npm rebuild here; they are expensive and can hit the
# CloudLinux NPROC limit on shared hosting.
[ -f "$DEPLOYPATH/dist/server.cjs" ] || fail "dist/server.cjs is missing"
[ -f "$DEPLOYPATH/dist/index.html" ] || fail "dist/index.html is missing"
[ -f "$DEPLOYPATH/app.cjs" ] || fail "app.cjs is missing"
[ -f "$DEPLOYPATH/.htaccess" ] || fail ".htaccess is missing"
grep -q 'PassengerStartupFile app.cjs' "$DEPLOYPATH/.htaccess" || fail ".htaccess is not configured for app.cjs"

mkdir -p "$DEPLOYPATH/tmp"
touch "$DEPLOYPATH/tmp/restart.txt"
log "LIBERTAMEDIA production deployment completed"
