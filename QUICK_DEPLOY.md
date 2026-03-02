# Quick Deploy Guide - Vultr VPS

**Fastest way to get Hew running on your Vultr VPS**

## 🚀 Quick Start (5 minutes)

### 1. SSH into your VPS
```bash
ssh root@your-vps-ip
```

### 2. Run setup script
```bash
# Download and run setup
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/hew/main/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

Or if you've cloned the repo:
```bash
cd /opt/hew
chmod +x setup-vps.sh
./setup-vps.sh
```

### 3. Clone your repo
```bash
mkdir -p /opt/hew
cd /opt/hew
git clone <your-repo-url> .
```

### 4. Configure environment
```bash
# Copy template
cp .env.production.example .env.production

# Generate passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Edit .env.production
nano .env.production
```

**Minimum required changes:**
- Set `POSTGRES_PASSWORD` (use the generated one above)
- Update `DATABASE_URL` with the password
- Set `FRONTEND_URL` (your domain or `http://your-vps-ip`)
- Set `SESSION_SECRET` (use the generated one above)
- Add your Omise production keys

### 5. Configure Caddy
```bash
# Copy Caddyfile
cp Caddyfile /etc/caddy/Caddyfile

# Edit domain (or use IP if no domain)
nano /etc/caddy/Caddyfile

# Restart Caddy
systemctl restart caddy
```

### 6. Deploy!
```bash
chmod +x deploy.sh
./deploy.sh
```

### 7. Verify
```bash
# Check status
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Test API
curl http://localhost:3000/api/health
```

## ✅ Done!

Your app should now be accessible at:
- **With domain**: `https://yourdomain.com`
- **Without domain**: `http://your-vps-ip`

## 🔄 Updating

```bash
cd /opt/hew
git pull
./deploy.sh
```

## 📋 Common Issues

**Services won't start?**
```bash
docker compose -f docker-compose.prod.yml logs
```

**Database connection error?**
- Check `.env.production` has correct `DATABASE_URL`
- Ensure PostgreSQL container is running: `docker compose -f docker-compose.prod.yml ps`

**Caddy not working?**
```bash
systemctl status caddy
journalctl -u caddy -f
```

For detailed troubleshooting, see [DEPLOYMENT.md](./DEPLOYMENT.md)
