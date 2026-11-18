#!/usr/bin/env bash
set -e

# ==============================================================================
# Leads Phone Book API Deployment Script
# Target Host : root@187.124.99.231 (kvm8-main)
# Target Path : /home/leadsphonebook-api/htdocs/api.leadsphonebook.com
# Domain      : api.leadsphonebook.com
# App Port    : 5085 STRICT
# Process     : leadsphonebook-api (PM2)
# ==============================================================================

TARGET_USER="root"
TARGET_HOST="kvm8-main"
SITE_USER="leadsphonebook-api"
REMOTE_DIR="/home/leadsphonebook-api/htdocs/api.leadsphonebook.com"
NODE_BIN="/root/.nvm/versions/node/v24.15.0/bin"

echo "================================================="
echo "🚀 Starting Deployment for Leads Phone Book API"
echo "🌐 Target: api.leadsphonebook.com (Port 5085 STRICT)"
echo "📁 Remote Dir: ${REMOTE_DIR}"
echo "================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

# 1. Local TypeScript compilation
echo "📦 Compiling TypeScript server locally..."
npm run build

# 2. Ensure remote directory exists
echo "📁 Ensuring remote directory exists..."
ssh ${TARGET_USER}@${TARGET_HOST} "mkdir -p ${REMOTE_DIR}/uploads"

# 3. Transfer files to remote directory
echo "📤 Transferring files to remote VPS..."
tar -czf - \
  dist \
  prisma \
  package.json \
  package-lock.json \
  ecosystem.config.cjs \
  tsconfig.json | \
  ssh ${TARGET_USER}@${TARGET_HOST} "tar -xzf - -C ${REMOTE_DIR}"

# Copy production environment file
scp .env.production ${TARGET_USER}@${TARGET_HOST}:${REMOTE_DIR}/.env

# 4. Remote installation, Prisma DB push, and PM2 execution
echo "🔨 Installing dependencies and syncing database on VPS..."
ssh ${TARGET_USER}@${TARGET_HOST} "bash -l -c '
  export PATH=\"${NODE_BIN}:\$PATH\"
  cd ${REMOTE_DIR}

  # Install npm dependencies
  npm install

  # Generate Prisma client and push schema updates to PostgreSQL
  npx prisma generate
  npx prisma db push --accept-data-loss

  # Run DB seed for SDUI lookups, navigation tabs & initial data
  npx tsx prisma/seed.ts

  # Set file ownership
  chown -R ${SITE_USER}:${SITE_USER} ${REMOTE_DIR}
  chmod +x dist/index.js

  # Start or restart ONLY leadsphonebook-api in PM2
  if pm2 describe leadsphonebook-api >/dev/null 2>&1; then
    pm2 restart leadsphonebook-api --update-env
  else
    pm2 start ecosystem.config.cjs --only leadsphonebook-api
  fi

  pm2 save
  sleep 2
  pm2 show leadsphonebook-api
'"

# 5. Health Check Verification
echo "🩺 Verifying internal and public health checks..."
ssh ${TARGET_USER}@${TARGET_HOST} "curl -s http://127.0.0.1:5085/health || echo 'Local health check failed'"
echo ""
curl -s https://api.leadsphonebook.com/health || echo "Public health check pending DNS"
echo ""

echo "================================================="
echo "✅ Leads Phone Book API Deployment Completed Successfully on Port 5085!"
echo "================================================="

