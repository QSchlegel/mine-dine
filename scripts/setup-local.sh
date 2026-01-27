#!/bin/bash

# Setup script for local development with Docker

set -e

echo "🚀 Setting up Mine Dine for local development..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start PostgreSQL in Docker
echo "📦 Starting PostgreSQL in Docker..."
docker compose up -d postgres 2>/dev/null || docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U minedine > /dev/null 2>&1 || docker-compose exec -T postgres pg_isready -U minedine > /dev/null 2>&1; do
    echo "   Still waiting..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit .env.local with your API keys before continuing!"
    echo "   At minimum, you need to set:"
    echo "   - NEXT_PUBLIC_UTXOS_PROJECT_ID"
    echo "   - STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    echo ""
    read -p "Press enter after you've updated .env.local..."
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "To stop PostgreSQL, run:"
echo "  docker-compose down"
echo ""
