#!/bin/bash

# Database Migration Script for Docker Deployment
# This script should be run after the container starts to ensure database is properly migrated

echo "🚀 Starting database migration process..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until npx prisma db pull > /dev/null 2>&1; do
  echo "Database not ready, waiting 5 seconds..."
  sleep 5
done

echo "✅ Database connection established"

# Generate Prisma client (in case it's not generated)
echo "🔄 Generating Prisma client..."
npx prisma generate

# Deploy database migrations
echo "📊 Deploying database migrations..."
npx prisma migrate deploy

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
    
    # Optional: Seed the database if needed
    # echo "🌱 Seeding database..."
    # npx prisma db seed
    
    echo "🎉 Database setup completed!"
else
    echo "❌ Database migration failed!"
    exit 1
fi
