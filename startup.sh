#!/bin/bash
echo "=== Kridaz Startup Script ==="
cd /home/site/wwwroot

npm install -g pnpm
pnpm install

cd server
npx prisma generate
npx prisma db push --accept-data-loss
node server.js
