#!/bin/bash
# Quick deployment script for Shanthi Online Gold

set -e

echo "🚀 Shanthi Online Gold - Quick Deployment Script"
echo "================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.staging exists
if [ ! -f "backend/.env.staging" ]; then
    echo -e "${RED}❌ Error: backend/.env.staging file not found!${NC}"
    echo "Please create the .env.staging file with your configuration."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: Docker is not installed!${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Error: Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

# Parse command line arguments
COMMAND=${1:-"deploy"}

case $COMMAND in
    deploy|build)
        echo -e "${GREEN}📦 Building Docker images...${NC}"
        docker-compose build --no-cache
        
        echo -e "${GREEN}🚀 Starting containers...${NC}"
        docker-compose up -d
        
        echo -e "${GREEN}⏳ Waiting for services to start...${NC}"
        sleep 5
        
        echo -e "${GREEN}🔍 Checking container status...${NC}"
        docker-compose ps
        
        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo ""
        echo "Services are running at:"
        echo "  - Frontend: http://localhost:3000"
        echo "  - Backend API: http://localhost:9000"
        echo ""
        echo "To view logs, run: docker-compose logs -f"
        ;;
        
    start)
        echo -e "${GREEN}🚀 Starting containers...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✅ Containers started!${NC}"
        docker-compose ps
        ;;
        
    stop)
        echo -e "${YELLOW}⏸️  Stopping containers...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Containers stopped!${NC}"
        ;;
        
    restart)
        echo -e "${YELLOW}🔄 Restarting containers...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ Containers restarted!${NC}"
        docker-compose ps
        ;;
        
    logs)
        docker-compose logs -f
        ;;
        
    status)
        echo -e "${GREEN}📊 Container Status:${NC}"
        docker-compose ps
        echo ""
        echo -e "${GREEN}🔍 Health Checks:${NC}"
        echo "Backend Health:"
        curl -f http://localhost:9000/healthz 2>/dev/null && echo " ✅ OK" || echo " ❌ Failed"
        echo "Frontend:"
        curl -f http://localhost:3000 2>/dev/null > /dev/null && echo " ✅ OK" || echo " ❌ Failed"
        ;;
        
    clean)
        echo -e "${YELLOW}🧹 Cleaning up Docker resources...${NC}"
        docker-compose down -v
        docker system prune -f
        echo -e "${GREEN}✅ Cleanup complete!${NC}"
        ;;
        
    update)
        echo -e "${GREEN}🔄 Updating application...${NC}"
        git pull origin main
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        echo -e "${GREEN}✅ Update complete!${NC}"
        ;;
        
    shell)
        echo -e "${GREEN}🐚 Opening shell in container...${NC}"
        docker-compose exec app sh
        ;;
        
    *)
        echo "Usage: $0 {deploy|build|start|stop|restart|logs|status|clean|update|shell}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Build and deploy the application (default)"
        echo "  build    - Same as deploy"
        echo "  start    - Start existing containers"
        echo "  stop     - Stop running containers"
        echo "  restart  - Restart containers"
        echo "  logs     - View container logs (Ctrl+C to exit)"
        echo "  status   - Check container and service status"
        echo "  clean    - Stop containers and clean up resources"
        echo "  update   - Pull latest code and rebuild"
        echo "  shell    - Open shell in the container"
        exit 1
        ;;
esac
