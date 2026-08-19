#!/bin/bash
set -euo pipefail

# LIBERTAMEDIA production deployment hook for cPanel / Passenger.
DEPLOYPATH="/home/libp7469/public_html"
BACKUP_ROOT="/home/libp7469/deploy_backups"
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
[ -n "${DB_PASSWORD:-}" ] || fail "DB_PASSWORD is missing"
[ -n "${ADMIN_PASSWORD:-}" ] || fail "ADMIN_PASSWORD is missing"
[ -n "${JWT_SECRET:-}" ] || fail "JWT_SECRET is missing"

[ -f "$DEPLOYPATH/scripts/preflight.sh" ] || fail "Production preflight script is missing"
chmod +x "$DEPLOYPATH/scripts/preflight.sh"
"$DEPLOYPATH/scripts/preflight.sh" || fail "Production environment preflight failed"

mkdir -p "$BACKUP_ROOT"

if [ -d "$DEPLOYPATH" ]; then
  mkdir -p "$BACKUP_DIR"
  tar --exclude='node_modules' --exclude='tmp' -czf "$BACKUP_DIR/public_html.tgz" -C "$DEPLOYPATH" . || fail "Pre-deploy backup failed"
fi

cd "$DEPLOYPATH"
npm ci --omit=dev
npm rebuild sharp

[ -f "$DEPLOYPATH/dist/server.cjs" ] || fail "dist/server.cjs is missing; deploy a successful production build first"
[ -f "$DEPLOYPATH/dist/index.html" ] || fail "dist/index.html is missing; deploy a successful production build first"

mkdir -p "$DEPLOYPATH/tmp"
touch "$DEPLOYPATH/tmp/restart.txt"

log "LIBERTAMEDIA production deployment completed"