#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/deploy/clipverse-frontend"
WEB_ROOT="/var/www/clipverse"

cd "$APP_DIR"
git pull --ff-only origin main
npm ci
npm run build
sudo rsync -a --delete dist/ "$WEB_ROOT/"
echo "Deploy complete: $(git rev-parse --short HEAD)"
