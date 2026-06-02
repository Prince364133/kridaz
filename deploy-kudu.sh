#!/bin/bash
echo "=== Kudu Custom Deployment Script ==="

# Kudu puts the deployment source in $DEPLOYMENT_SOURCE and target in $DEPLOYMENT_TARGET
# But for zip deploy, Kudu runs in the target directory (wwwroot) directly usually.
# Let's just run in current dir which is the app root.

echo "Installing pnpm..."
npm install -g pnpm

echo "Installing dependencies..."
pnpm install

echo "Installing sharp for Linux x64 explicitly..."
cd server
npm install --os=linux --cpu=x64 sharp

echo "Generating Prisma Client..."
npx prisma generate
cd ..

echo "Deployment build finished successfully!"
