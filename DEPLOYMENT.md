# Deployment Guide for Vultr VPS

This guide walks you through deploying Hew (หิ้ว) to your Vultr VPS.

## Prerequisites

- Vultr VPS running Ubuntu 20.04+ or Debian 11+
- Domain name pointing to your VPS IP (optional but recommended)
- SSH access to your VPS
- GitHub repository with your code

## Step 1: Initial VPS Setup

### Option A: Automated Setup Script

1. **SSH into your VPS:**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Download and run the setup script:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/yourusername/hew/main/setup-vps.sh -o setup-vps.sh
   chmod +x setup-vps.sh
   ./setup-vps.sh
   ```

   Or if you've already cloned the repo:
   ```bash
   cd /opt/hew
   chmod +x setup-vps.sh
   ./setup-vps.sh
   ```

### Option B: Manual Setup

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
apt-get install -y docker-compose-plugin

# Install Caddy (reverse proxy)
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install -y caddy

# Install Node.js and pnpm (for migrations)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm@9.15.0

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Step 2: Clone Repository

```bash
# Create app directory
mkdir -p /opt/hew
cd /opt/hew

# Clone your repository
git clone <your-repo-url> .

# Or if you need to set up SSH keys first:
# ssh-keygen -t ed25519 -C "your_email@example.com"
# cat ~/.ssh/id_ed25519.pub  # Add this to GitHub
```

## Step 3: Configure Environment Variables

```bash
cd /opt/hew

# Copy the production environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required values to set:**

1. **Database Password:**
   ```bash
   # Generate a strong password
   openssl rand -base64 32
   ```
   Set `POSTGRES_PASSWORD` and update `DATABASE_URL` with this password.

2. **Domain:**
   - Set `FRONTEND_URL` to your domain (e.g., `https://hew.th`)
   - If you don't have a domain yet, use `http://your-vps-ip` temporarily

3. **Omise Keys:**
   - Get production keys from https://dashboard.omise.co
   - Set `OMISE_PUBLIC_KEY` and `OMISE_SECRET_KEY`

4. **Session Secret:**
   ```bash
   # Generate a random secret
   openssl rand -base64 32
   ```
   Set `SESSION_SECRET` with this value.

## Step 4: Configure Caddy (Reverse Proxy)

```bash
# Copy Caddyfile
cp Caddyfile /etc/caddy/Caddyfile

# Edit with your domain
nano /etc/caddy/Caddyfile
```

**Update the domain:**
- Replace `yourdomain.com` with your actual domain
- If no domain, comment out the domain blocks and uncomment the `:80` block

**Enable and start Caddy:**
```bash
systemctl enable caddy
systemctl restart caddy
```

## Step 5: Deploy Application

```bash
cd /opt/hew

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

This will:
1. Build Docker images
2. Run database migrations
3. Start all services (PostgreSQL, Redis, API, Web, Worker)

## Step 6: Verify Deployment

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Test API health endpoint
curl http://localhost:3000/api/health

# Test web app
curl http://localhost:3001
```

## Step 7: Set Up Domain DNS

If you have a domain:

1. **Add A record** pointing to your VPS IP:
   ```
   Type: A
   Name: @ (or yourdomain.com)
   Value: your-vps-ip
   TTL: 3600
   ```

2. **Optional: Add CNAME for API subdomain:**
   ```
   Type: CNAME
   Name: api
   Value: yourdomain.com
   TTL: 3600
   ```

3. **Wait for DNS propagation** (5-60 minutes)

4. **Caddy will automatically:**
   - Obtain SSL certificate via Let's Encrypt
   - Enable HTTPS
   - Redirect HTTP to HTTPS

## Updating the Application

```bash
cd /opt/hew

# Pull latest changes
git pull

# Rebuild and redeploy
./deploy.sh
```

## Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f worker

# Restart a service
docker compose -f docker-compose.prod.yml restart api

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start services
docker compose -f docker-compose.prod.yml up -d

# Access database
docker compose -f docker-compose.prod.yml exec postgres psql -U hew_prod -d hew_prod

# Run migrations manually
docker compose -f docker-compose.prod.yml run --rm api pnpm db:migrate:prod

# Run seed (only for initial setup)
docker compose -f docker-compose.prod.yml run --rm api pnpm db:seed
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check if ports are in use
netstat -tulpn | grep -E '3000|3001|5432|6379'
```

### Database connection errors
- Verify `DATABASE_URL` in `.env.production` matches docker-compose internal networking
- Check if PostgreSQL container is healthy: `docker compose -f docker-compose.prod.yml ps postgres`

### Caddy not working
```bash
# Check Caddy status
systemctl status caddy

# Check Caddy logs
journalctl -u caddy -f

# Test Caddyfile syntax
caddy validate --config /etc/caddy/Caddyfile
```

### SSL certificate issues
- Ensure domain DNS is pointing to VPS IP
- Check firewall allows ports 80 and 443
- Verify Caddyfile has correct domain name

## Security Checklist

- [ ] Changed default database password
- [ ] Set strong `SESSION_SECRET`
- [ ] Using production Omise keys (not test keys)
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] SSL/HTTPS enabled (automatic with Caddy)
- [ ] Database not exposed to public (only internal Docker network)
- [ ] Redis not exposed to public (only internal Docker network)
- [ ] Regular backups configured (see Backup section)

## Backups

### Database Backup Script

Create `/opt/hew/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/hew/backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U hew_prod hew_prod | gzip > "$BACKUP_DIR/hew_backup_$DATE.sql.gz"
# Keep only last 30 days
find "$BACKUP_DIR" -name "hew_backup_*.sql.gz" -mtime +30 -delete
```

Make it executable and add to cron:
```bash
chmod +x /opt/hew/backup-db.sh
crontab -e
# Add: 0 2 * * * /opt/hew/backup-db.sh
```

## Monitoring

### Health Checks

- API: `http://yourdomain.com/api/health`
- Web: `http://yourdomain.com`

### Set Up Monitoring (Optional)

- **Uptime monitoring**: UptimeRobot (free tier)
- **Error tracking**: Sentry (free tier)
- **Logs**: Use `docker compose logs` or set up Loki/Grafana

## Cost Estimate

- Vultr VPS (2GB RAM, 1 vCPU): ~$12/mo
- Domain: ~$1-2/mo
- **Total: ~$13-14/mo**

## Support

If you encounter issues:
1. Check logs: `docker compose -f docker-compose.prod.yml logs`
2. Verify environment variables: `cat .env.production`
3. Check service health: `docker compose -f docker-compose.prod.yml ps`
