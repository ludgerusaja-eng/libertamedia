# LIBERTAMEDIA cPanel Cron Jobs

Production cron jobs should run from the deployed application directory.

## 1. Scheduled publishing

Run every minute:

```cron
* * * * * cd /home/libp7469/public_html && /usr/bin/npm run publish:scheduled >> /home/libp7469/cron_publish.log 2>&1
```

## 2. MySQL backup

Run daily at 02:30 server time:

```cron
30 2 * * * cd /home/libp7469/public_html && /bin/bash scripts/backup_mysql.sh >> /home/libp7469/cron_backup.log 2>&1
```

Recommended environment for the backup job:

```text
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
BACKUP_ROOT=/home/libp7469/mysql_backups/libertamedia
RETENTION_DAYS=14
```

Do not put production credentials into the repository. Configure them in cPanel's cron environment or source the protected `.env` file.

## 3. Feed refresh

Run hourly if the site uses an external crawler cadence that benefits from a fresh feed:

```cron
17 * * * * cd /home/libp7469/public_html && /usr/bin/npm run generate:feeds >> /home/libp7469/cron_feeds.log 2>&1
```

## Operational rule

After configuring cron, run each command manually once and confirm the exit code is `0`. Keep cron logs outside `public_html` where possible.
