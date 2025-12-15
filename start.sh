#!/bin/bash

echo "================================================"
echo "🏥 AI Maternal & Child Health Tracker"
echo "================================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Start database
echo "📦 Starting PostgreSQL database..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

echo "🗄️  Running database migrations..."
npm run db:push

echo "🌱 Seeding database..."
npm run seed 2>/dev/null || echo "⚠️  Seeding skipped (may already be seeded)"

cd ..

# Setup frontend
echo ""
echo "🎨 Setting up frontend..."

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo ""
echo "================================================"
echo "✅ Setup complete!"
echo "================================================"
echo ""
echo "🚀 To start the application:"
echo ""
echo "  1. Start Backend (in one terminal):"
echo "     cd backend && npm run dev"
echo ""
echo "  2. Start Frontend (in another terminal):"
echo "     npm run dev"
echo ""
echo "  3. Access the application:"
echo "     http://localhost:5173"
echo ""
echo "🔐 Demo Credentials:"
echo "     Email: demo@healthai.com"
echo "     Password: password123"
echo ""
echo "================================================"

