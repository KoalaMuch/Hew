#!/bin/bash
set -e

echo "🔧 Setting up VPS for Hew deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose plugin
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Docker Compose...${NC}"
    apt-get install -y docker-compose-plugin
fi

# Install Caddy (reverse proxy with auto-HTTPS)
if ! command -v caddy &> /dev/null; then
    echo -e "${YELLOW}🌐 Installing Caddy...${NC}"
    apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update
    apt-get install -y caddy
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}📥 Installing Git...${NC}"
    apt-get install -y git
fi

# Install Node.js and pnpm (needed for migrations)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}📦 Installing pnpm...${NC}"
    npm install -g pnpm@9.15.0
fi

# Configure firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi

# Create app directory
APP_DIR="/opt/hew"
if [ ! -d "$APP_DIR" ]; then
    echo -e "${YELLOW}📁 Creating app directory...${NC}"
    mkdir -p "$APP_DIR"
fi

echo -e "${GREEN}✅ VPS setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Clone your repository:"
echo "   cd $APP_DIR"
echo "   git clone <your-repo-url> ."
echo ""
echo "2. Copy and configure environment:"
echo "   cp .env.production.example .env.production"
echo "   nano .env.production  # Edit with your values"
echo ""
echo "3. Run deployment:"
echo "   chmod +x deploy.sh"
echo "   ./deploy.sh"
