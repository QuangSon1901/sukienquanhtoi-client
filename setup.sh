#!/bin/bash

echo "🚀 Setting up Next.js Event Map Application..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p docker/app
mkdir -p docker/app-prod
mkdir -p docker/nginx
mkdir -p data
mkdir -p public

# Create .env.local if not exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=/api

# Environment
NODE_ENV=development

# Port
PORT=3000
EOF
fi

# Check if events.json exists
if [ ! -f data/events.json ]; then
    echo -e "${YELLOW}⚠️  Warning: data/events.json not found!${NC}"
    echo "Creating sample events.json..."
    cat > data/events.json << 'EOF'
{
  "collected_at": "2025-01-01 00:00:00",
  "total_events": 0,
  "events": []
}
EOF
    echo -e "${YELLOW}Please copy your real events.json to data/ directory${NC}"
fi

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build containers
echo "🔨 Building Docker containers..."
docker-compose build

# Start containers in development mode
echo "🚀 Starting containers in development mode..."
docker-compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 5

# Check container status
echo ""
echo "📊 Container Status:"
docker-compose ps

# Install dependencies inside container
echo ""
echo "📦 Installing dependencies..."
docker-compose exec -T app npm install

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "📝 Available commands:"
echo "  Development:"
echo "    docker-compose up -d              # Start development server"
echo "    docker-compose logs -f app        # View logs"
echo "    docker-compose exec app npm run dev  # Run dev inside container"
echo ""
echo "  Production:"
echo "    docker-compose --profile production up -d  # Start production"
echo ""
echo "  Other:"
echo "    docker-compose down               # Stop all containers"
echo "    docker-compose restart            # Restart containers"
echo ""
echo "🌐 Application URLs:"
echo "  Development: http://localhost:3000"
echo "  Production:  http://localhost (port 80)"
echo ""
echo "💡 Next steps:"
echo "  1. Copy your events.json to data/ directory (if not done)"
echo "  2. Visit http://localhost:3000"
echo "  3. Check logs: docker-compose logs -f app"
echo ""