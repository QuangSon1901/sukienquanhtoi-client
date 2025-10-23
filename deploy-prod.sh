#!/bin/bash

echo "🚀 Deploying to Production..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop development containers
echo "🛑 Stopping development containers..."
docker-compose down

# Build production images
echo "🔨 Building production images..."
docker-compose --profile production build

# Start production containers
echo "🚀 Starting production containers..."
docker-compose --profile production up -d

# Wait for containers
echo "⏳ Waiting for containers to be ready..."
sleep 5

# Check status
echo ""
echo "📊 Container Status:"
docker-compose --profile production ps

echo ""
echo -e "${GREEN}✨ Production deployment complete!${NC}"
echo ""
echo "🌐 Application URL: http://localhost"
echo ""
echo "📝 Useful commands:"
echo "  docker-compose --profile production logs -f    # View logs"
echo "  docker-compose --profile production down       # Stop production"
echo "  docker-compose --profile production restart    # Restart"
echo ""