#!/bin/bash
echo "=== Kridaz Startup Script ==="
cd /home/site/wwwroot/server

echo "Pushing DB schema..."
npx prisma db push --accept-data-loss

echo "Starting server..."
node server.js
