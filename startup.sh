#!/bin/bash
set -x
echo "=== Kridaz Startup Script ==="
cd /home/site/wwwroot

echo "Pushing DB schema..."
./node_modules/.bin/prisma db push --accept-data-loss

echo "Starting server..."
node server.js
