#!/bin/bash
echo "=== Kridaz Startup Script ==="
cd /home/site/wwwroot

# Clean any weird symlinks Azure makes for node_modules
rm -rf node_modules

npm install -g pnpm
pnpm install
# Rebuild sharp for Linux
npm rebuild --prefix server sharp || true
pnpm rebuild sharp || true

cd server
npx prisma generate
npx prisma db push --accept-data-loss
node server.js
