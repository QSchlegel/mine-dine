#!/bin/bash

# Start script for local development

set -e

echo "🚀 Starting Mine Dine locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start PostgreSQL if not running
if ! docker compose ps postgres 2>/dev/null | grep -q "Up" && ! docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
    echo "📦 Starting PostgreSQL..."
    docker compose up -d postgres 2>/dev/null || docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    until docker compose exec -T postgres pg_isready -U minedine > /dev/null 2>&1 || docker-compose exec -T postgres pg_isready -U minedine > /dev/null 2>&1; do
        sleep 2
    done
    echo "✅ PostgreSQL is ready!"
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found. Please run ./scripts/setup-local.sh first."
    exit 1
fi

# Start Next.js dev server
echo "🌐 Starting Next.js development server..."
npm run dev
