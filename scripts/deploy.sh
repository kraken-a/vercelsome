#!/usr/bin/env bash
# Forced command for the GitHub Actions deploy key (see authorized_keys on bxl-webapps1).
# Whatever the SSH client requests, sshd runs only this script.
set -euo pipefail

APP_DIR="/opt/oaksome-web/oaksome-web"
cd "$APP_DIR"

git fetch origin main
git reset --hard origin/main

docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker image prune -f
