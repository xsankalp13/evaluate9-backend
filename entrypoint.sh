#!/bin/sh
set -e

echo "🛠️  Migrating Database..."
npx prisma db push

echo "🚀 Starting Server..."
exec "$@"