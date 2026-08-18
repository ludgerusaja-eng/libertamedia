#!/bin/bash
# ==============================================================================
# libertamedia.com — All-in-One Automated Setup & Deployment Hook for cPanel
# ==============================================================================

DEPLOYPATH="/home/libp7469/public_html"
BACKUP_DIR="/home/libp7469/deploy_backups/backup_latest"

echo "[$(date)] === STARTING AUTOMATED CPANEL SETUP & DEPLOYMENT ==="

# 1. Automated Rollback Backup of existing public_html
echo "[1/5] Creating automated pre-deploy backup..."
mkdir -p /home/libp7469/deploy_backups
cp -r "$DEPLOYPATH" "$BACKUP_DIR" 2>/dev/null || true

# 2. Automated Production .env Template Initialization (if not existing)
if [ ! -f "$DEPLOYPATH/.env" ]; then
    echo "[2/5] Initializing production .env from template..."
    cp "$DEPLOYPATH/.env.example" "$DEPLOYPATH/.env" 2>/dev/null || true
else
    echo "[2/5] Production .env file exists. Preserving configuration."
fi

# 3. Automated Permission Setup for Backup Script
echo "[3/5] Setting executable permissions on scripts/backup.sh..."
chmod +x "$DEPLOYPATH/scripts/backup.sh" 2>/dev/null || true

# 4. Automated Sharp Native Rebuild for Linux cPanel Architecture
echo "[4/5] Rebuilding Sharp native C++ binaries for cPanel Linux..."
cd "$DEPLOYPATH" && npm rebuild sharp 2>/dev/null || true

# 5. Automated Phusion Passenger Reload
echo "[5/5] Reloading Phusion Passenger Node.js process..."
mkdir -p "$DEPLOYPATH/tmp"
touch "$DEPLOYPATH/tmp/restart.txt"

echo "[$(date)] === AUTOMATED CPANEL SETUP & DEPLOYMENT COMPLETED SUCCESSFULLY ==="
