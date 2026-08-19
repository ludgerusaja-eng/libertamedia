#!/bin/bash
set -euo pipefail

required_vars=(NODE_ENV DATABASE_TYPE DB_HOST DB_USER DB_PASSWORD DB_NAME ADMIN_EMAIL)
for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "[PRODUCTION PREFLIGHT] Missing required environment variable: $var" >&2
    exit 1
  fi
done

[ "$NODE_ENV" = "production" ] || { echo "[PRODUCTION PREFLIGHT] NODE_ENV must be production." >&2; exit 1; }
[ "$DATABASE_TYPE" = "mysql" ] || { echo "[PRODUCTION PREFLIGHT] DATABASE_TYPE must be mysql." >&2; exit 1; }

if ! [[ "$ADMIN_EMAIL" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]]; then
  echo "[PRODUCTION PREFLIGHT] ADMIN_EMAIL is invalid." >&2
  exit 1
fi

# Authentication is backed by the MySQL users table. Passwords are never
# stored in the deployment environment and are seeded with scripts/seed_admin.ts.
echo "[PRODUCTION PREFLIGHT] Environment validation passed."
