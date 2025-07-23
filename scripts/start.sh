#!/bin/sh

# Startup script for the Next.js application
# This script runs database migrations before starting the application

echo "🚀 Starting MAPOS Customer Services Manager..."

# Wait for database to be available
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if npx prisma db pull > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    
    echo "Database not ready, waiting... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 1))
done

if [ $counter -eq $timeout ]; then
    echo "❌ Database connection timeout. Exiting..."
    exit 1
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ Database migration failed. Exiting..."
    exit 1
fi

echo "✅ Database migrations completed successfully"

# Start the Next.js application
echo "🎉 Starting the application..."
exec "$@"
