#!/bin/bash
set -euo pipefail

required_vars=(NODE_ENV DB_HOST DB_USER DB_PASSWORD DB_NAME ADMIN_PASSWORD JWT_SECRET)

for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "[PRODUCTION PREFLIGHT] Missing required environment variable: $var" >&2
    exit 1
  fi
done

if [ "${NODE_ENV}" != "production" ]; then
  echo "[PRODUCTION PREFLIGHT] NODE_ENV must be production for this preflight." >&2
  exit 1
fi

if [ "${ADMIN_PASSWORD}" = "libertamedia2026" ] || [ "${ADMIN_PASSWORD}" = "admin123" ]; then
  echo "[PRODUCTION PREFLIGHT] Refusing known/default admin password." >&2
  exit 1
fi

if [ "${JWT_SECRET}" = "change-this-to-a-long-random-secret" ] || [ "${JWT_SECRET}" = "" ]; then
  echo "[PRODUCTION PREFLIGHT] Refusing default/empty JWT_SECRET." >&2
  exit 1
fi

echo "[PRODUCTION PREFLIGHT] Environment validation passed."
