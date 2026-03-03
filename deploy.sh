#!/bin/bash
set -e

echo "🚀 Starting Hew deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production not found!${NC}"
    echo "Please copy .env.production.example to .env.production and fill in the values."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose.${NC}"
    exit 1
fi

ln -sf .env.production .env

echo -e "${YELLOW}📦 Pulling Docker images from GHCR...${NC}"
docker compose -f docker-compose.prod.yml pull

echo -e "${YELLOW}🔄 Running database migrations...${NC}"
# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Run migrations using the API container (which has Prisma CLI)
docker compose -f docker-compose.prod.yml up -d postgres redis
echo "Waiting for PostgreSQL to be healthy..."
sleep 10

docker compose -f docker-compose.prod.yml run --rm api sh -c \
  "cd /app/packages/db && npx prisma migrate deploy" || \
  echo "⚠️  Migration failed or already applied. Continuing..."

echo -e "${YELLOW}🚀 Starting services (zero-downtime: update one at a time with health gate)...${NC}"
# Update services sequentially - each waits for healthcheck before next (Docker Compose v2.20+)
if docker compose -f docker-compose.prod.yml up -d --no-deps --wait api 2>/dev/null; then
    docker compose -f docker-compose.prod.yml up -d --no-deps --wait web 2>/dev/null || docker compose -f docker-compose.prod.yml up -d web
    docker compose -f docker-compose.prod.yml up -d --no-deps --wait worker 2>/dev/null || docker compose -f docker-compose.prod.yml up -d worker
else
    # Fallback: standard up -d (older Docker Compose)
    docker compose -f docker-compose.prod.yml up -d
fi

# Ensure monitoring stack is running
docker compose -f docker-compose.prod.yml up -d prometheus loki tempo alloy grafana 2>/dev/null || true

# Record deployment history for rollback reference
DEPLOYED_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
echo "$DEPLOYED_SHA" > .deployed-sha
echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') ${DEPLOYED_SHA} $(git log -1 --format='%s' 2>/dev/null || echo '')" >> .deploy-history
echo -e "${GREEN}📌 Deployed SHA: ${DEPLOYED_SHA}${NC}"

echo -e "${YELLOW}⏳ Verifying API health...${NC}"
for i in $(seq 1 10); do
    if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}API health check passed${NC}"
        break
    fi
    echo "Attempt $i: waiting for API..."
    sleep 3
done

# Check if services are running
if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "Services status:"
    docker compose -f docker-compose.prod.yml ps
    echo ""
    echo "To view logs:"
    echo "  docker compose -f docker-compose.prod.yml logs -f"
    echo ""
    echo "To stop services:"
    echo "  docker compose -f docker-compose.prod.yml down"
else
    echo -e "${RED}❌ Some services failed to start. Check logs:${NC}"
    docker compose -f docker-compose.prod.yml logs
    exit 1
fi
