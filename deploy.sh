#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/deploy/clipverse-frontend"
WEB_ROOT="/var/www/clipverse"

cd "$APP_DIR"
git pull --ff-only origin main
npm ci
# VITE_API_URL must be non-empty at build time to flip the app into real-API mode; '/' keeps requests relative so Nginx proxies /app-api and /api same-origin
VITE_API_URL=/ npm run build
sudo rsync -a --delete dist/ "$WEB_ROOT/"
echo "Deploy complete: $(git rev-parse --short HEAD)"
