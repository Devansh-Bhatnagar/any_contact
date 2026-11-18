#!/usr/bin/env bash
# Starts PostgreSQL (already installed on the VPS, e.g. 18.4 LTS) and ensures the
# app's role + database exist. Safe to re-run: it never drops the database, so
# existing data is always preserved.
#
# Usage:
#   DB_PASSWORD='a-strong-password' ./setup-db.sh
#
# Optional overrides:
#   DB_NAME (default: add_phone_number)
#   DB_USER (default: app_phone_number)
#   DB_PORT (default: 5432)

set -euo pipefail

DB_NAME="${DB_NAME:-add_phone_number}"
DB_USER="${DB_USER:-app_phone_number}"
DB_PORT="${DB_PORT:-5432}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [[ -z "$DB_PASSWORD" ]]; then
  echo "Error: DB_PASSWORD is required." >&2
  echo "Example: DB_PASSWORD='a-strong-password' $0" >&2
  exit 1
fi

echo "==> Starting PostgreSQL service"
started=false
if command -v systemctl >/dev/null 2>&1; then
  for svc in postgresql postgresql@18-main postgresql-18; do
    if systemctl list-unit-files 2>/dev/null | grep -q "^${svc}\.service"; then
      sudo systemctl enable --now "$svc"
      echo "    started $svc"
      started=true
      break
    fi
  done
fi
if [[ "$started" == false ]]; then
  echo "    no matching systemd unit found, falling back to 'service postgresql start'"
  sudo service postgresql start
fi

echo "==> Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if sudo -u postgres pg_isready -p "$DB_PORT" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
sudo -u postgres pg_isready -p "$DB_PORT"

echo "==> Ensuring role '$DB_USER' exists"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
"

echo "==> Ensuring database '$DB_NAME' exists (existing data is left untouched)"
if [[ "$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'")" != "1" ]]; then
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
  echo "    created $DB_NAME"
else
  echo "    already exists, skipped"
fi

echo "==> Granting privileges on '$DB_NAME' to '$DB_USER'"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"

cat <<EOF

Done. PostgreSQL is running and the database is ready.

Set this in server/.env:
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public"

Then apply the schema with:
cd server && npx prisma migrate deploy
EOF
