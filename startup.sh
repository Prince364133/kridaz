#!/bin/bash
set -x
echo "=== Kridaz Startup Script ==="
cd /home/site/wwwroot/server

echo "Pushing DB schema..."
npx --yes prisma db push --accept-data-loss

echo "Starting server..."
node server.js
