#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REGISTRY="ghcr.io/koalamuch"
SERVICES=("hew-api" "hew-web" "hew-worker")

show_history() {
    if [ -f .deploy-history ]; then
        echo -e "${YELLOW}Recent deployments (newest first):${NC}"
        echo ""
        printf "  %-22s %-12s %s\n" "DATE" "SHA" "COMMIT MESSAGE"
        printf "  %-22s %-12s %s\n" "----" "---" "--------------"
        tail -20 .deploy-history | tac | while IFS= read -r line; do
            local dt sha msg
            dt=$(echo "$line" | awk '{print $1" "$2" "$3}')
            sha=$(echo "$line" | awk '{print $4}')
            msg=$(echo "$line" | cut -d' ' -f5-)
            printf "  %-22s %-12s %s\n" "$dt" "${sha:0:10}" "$msg"
        done
        echo ""
        echo -e "Current deploy: ${GREEN}$(cat .deployed-sha 2>/dev/null | head -c 10)${NC}"
        echo ""
        echo "Copy a SHA from above and run:"
        echo "  ./rollback.sh <sha>"
    else
        echo -e "${RED}No deployment history found.${NC}"
        echo "Deploy at least once with ./deploy.sh to start recording history."
    fi
}

show_help() {
    echo "Usage: ./rollback.sh [<git-sha>]"
    echo ""
    echo "Roll back production to a previously deployed version without"
    echo "reverting any code. Fix your code at your own pace, then push"
    echo "a new commit to deploy again."
    echo ""
    echo "  ./rollback.sh              # show deployment history"
    echo "  ./rollback.sh <sha>        # rollback to that SHA"
}

if [ -z "$1" ]; then
    show_help
    echo ""
    show_history
    exit 0
fi

TARGET_SHA="$1"
TAG="sha-${TARGET_SHA}"

echo -e "${YELLOW}🔄 Rolling back to SHA: ${TARGET_SHA}${NC}"

# Verify images exist for this SHA
for svc in "${SERVICES[@]}"; do
    echo -n "  Checking ${svc}:${TAG}... "
    if docker manifest inspect "${REGISTRY}/${svc}:${TAG}" > /dev/null 2>&1; then
        echo -e "${GREEN}found${NC}"
    else
        echo -e "${RED}NOT FOUND${NC}"
        echo -e "${RED}Image ${REGISTRY}/${svc}:${TAG} does not exist in the registry.${NC}"
        echo "Available local images:"
        docker images --format "  {{.Repository}}:{{.Tag}}" | grep "${svc}" || echo "  (none)"
        exit 1
    fi
done

# Pull the specific SHA-tagged images
echo -e "${YELLOW}📦 Pulling images for SHA ${TARGET_SHA}...${NC}"
for svc in "${SERVICES[@]}"; do
    docker pull "${REGISTRY}/${svc}:${TAG}"
    docker tag "${REGISTRY}/${svc}:${TAG}" "${REGISTRY}/${svc}:latest"
done

# Restart services with the rolled-back images (no migrations -- we're going backward)
echo -e "${YELLOW}🚀 Restarting services...${NC}"
docker compose -f docker-compose.prod.yml up -d api web worker

echo -e "${YELLOW}⏳ Waiting for services...${NC}"
sleep 10

if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Rollback to ${TARGET_SHA} successful!${NC}"
    echo ""
    echo "Services status:"
    docker compose -f docker-compose.prod.yml ps
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Fix the issue in your code"
    echo "  2. Push to main (CI will build new :latest images)"
    echo "  3. Run ./deploy.sh to deploy the fix"
else
    echo -e "${RED}❌ Rollback may have failed. Check logs:${NC}"
    docker compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi
