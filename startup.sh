#!/bin/bash

# Navigate to the server directory
cd /home/site/wwwroot/server

# Generate Prisma client for Linux environment
echo "Generating Prisma client..."
npx prisma generate

# Sync the database schema
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# Start the application server
echo "Starting backend server..."
node server.js
