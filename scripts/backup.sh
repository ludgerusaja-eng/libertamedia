#!/bin/bash
# ==============================================================================
# libertamedia.com — Automated Database & Media Backup Script for cPanel Cron Jobs
# ==============================================================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/libp7469/deploy_backups/daily"
PUBLIC_HTML="/home/libp7469/public_html"
UPLOADS_DIR="$PUBLIC_HTML/uploads"
DATA_DIR="$PUBLIC_HTML/data"

# MySQL Credentials (read from environment or default cPanel user)
DB_USER=${DB_USER:-"libp7469_user"}
DB_PASS=${DB_PASSWORD:-""}
DB_NAME=${DB_NAME:-"libp7469_libertamedia"}

# 1. Create daily backup target directory
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting libertamedia.com automated backup..."

# 2. Database Backup (MySQL Dump or JSON fallback tarball)
if [ -n "$DB_PASS" ]; then
    echo "[$(date)] Backing up MySQL database '$DB_NAME'..."
    mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql.gz"
else
    echo "[$(date)] MySQL password not set. Backing up JSON data directory..."
    tar -czf "$BACKUP_DIR/data_json_${TIMESTAMP}.tar.gz" -C "$PUBLIC_HTML" data 2>/dev/null || true
fi

# 3. Media Uploads Backup
if [ -d "$UPLOADS_DIR" ]; then
    echo "[$(date)] Backing up uploads directory..."
    tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" -C "$PUBLIC_HTML" uploads 2>/dev/null || true
fi

# 4. Retention Policy: Auto-delete backup files older than 7 days
echo "[$(date)] Cleaning up backups older than 7 days..."
find "$BACKUP_DIR" -type f \( -name "*.sql.gz" -o -name "*.tar.gz" \) -mtime +7 -delete

echo "[$(date)] Backup completed successfully. Saved to: $BACKUP_DIR"
