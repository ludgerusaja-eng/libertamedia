#!/bin/bash
set -euo pipefail

: "${DB_HOST:?DB_HOST is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_NAME:?DB_NAME is required}"

BACKUP_ROOT="${BACKUP_ROOT:-$HOME/mysql_backups/libertamedia}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_ROOT"
chmod 700 "$BACKUP_ROOT"

OUT="$BACKUP_ROOT/libertamedia_${STAMP}.sql.gz"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "Starting MySQL backup"
MYSQL_PWD="$DB_PASSWORD" mysqldump \
  --host="$DB_HOST" \
  --port="${DB_PORT:-3306}" \
  --user="$DB_USER" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  "$DB_NAME" | gzip -9 > "$OUT"

chmod 600 "$OUT"
find "$BACKUP_ROOT" -type f -name 'libertamedia_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
log "Backup completed: $OUT"
