#!/bin/bash
set -x
echo "=== Kridaz Startup Script ==="
cd /home/site/wwwroot

# Determine the correct node_modules path
# Azure may extract tar.gz node_modules to /node_modules instead of ./node_modules
if [ -d "/node_modules" ] && [ ! -d "./node_modules" ]; then
  echo "Detected node_modules at /node_modules, creating symlink..."
  ln -sf /node_modules ./node_modules
fi

echo "Generating Prisma client..."
npx prisma generate || echo "Warning: prisma generate failed, continuing..."

echo "Pushing DB schema..."
npx prisma db push --accept-data-loss || echo "Warning: prisma db push failed, continuing..."

echo "Starting server..."
node server.js
