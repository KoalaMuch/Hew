# Deployment Files Created

I've created all the necessary files to deploy Hew to your Vultr VPS. Here's what was added:

## 📁 New Files

1. **`docker-compose.prod.yml`** - Production Docker Compose configuration
   - Includes all services: PostgreSQL, Redis, API, Web, Worker
   - Health checks and restart policies
   - Internal networking for security

2. **`.env.production.example`** - Production environment template
   - Copy this to `.env.production` and fill in your values

3. **`deploy.sh`** - Automated deployment script
   - Builds Docker images
   - Runs database migrations
   - Starts all services
   - Checks health status

4. **`setup-vps.sh`** - VPS initial setup script
   - Installs Docker, Docker Compose, Caddy, Node.js, pnpm
   - Configures firewall
   - Sets up the environment

5. **`Caddyfile`** - Reverse proxy configuration
   - Auto-HTTPS with Let's Encrypt
   - Routes traffic to web and API services

6. **`DEPLOYMENT.md`** - Comprehensive deployment guide
   - Step-by-step instructions
   - Troubleshooting tips
   - Security checklist
   - Backup procedures

7. **`QUICK_DEPLOY.md`** - Quick start guide
   - Fast 5-minute deployment
   - Essential commands only

## 🚀 Quick Start

### On Your VPS:

```bash
# 1. Run setup (one time)
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/hew/main/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh

# 2. Clone repo
mkdir -p /opt/hew && cd /opt/hew
git clone <your-repo-url> .

# 3. Configure environment
cp .env.production.example .env.production
nano .env.production  # Fill in your values

# 4. Configure Caddy
cp Caddyfile /etc/caddy/Caddyfile
nano /etc/caddy/Caddyfile  # Update domain
systemctl restart caddy

# 5. Deploy!
chmod +x deploy.sh
./deploy.sh
```

## 🔑 Required Environment Variables

Before deploying, make sure `.env.production` has:

- ✅ `POSTGRES_PASSWORD` - Strong password (generate with `openssl rand -base64 32`)
- ✅ `DATABASE_URL` - Full connection string with password
- ✅ `SESSION_SECRET` - Random secret (generate with `openssl rand -base64 32`)
- ✅ `FRONTEND_URL` - Your domain or VPS IP
- ✅ `OMISE_PUBLIC_KEY` - Production key from Omise dashboard
- ✅ `OMISE_SECRET_KEY` - Production secret from Omise dashboard

## 📝 Next Steps

1. **Push these files to your repository:**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push
   ```

2. **SSH into your Vultr VPS** and follow the Quick Start steps above

3. **Set up your domain DNS** (if you have one):
   - Add A record pointing to your VPS IP
   - Caddy will automatically get SSL certificate

4. **Test the deployment:**
   ```bash
   curl http://your-vps-ip/api/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

## 🔄 Updating

To update your deployment:

```bash
cd /opt/hew
git pull
./deploy.sh
```

## 📚 Documentation

- **Quick deploy**: See `QUICK_DEPLOY.md`
- **Full guide**: See `DEPLOYMENT.md`
- **Troubleshooting**: See `DEPLOYMENT.md` → Troubleshooting section

## ⚠️ Important Notes

1. **Security**: Never commit `.env.production` to git (it's in `.gitignore`)
2. **Backups**: Set up database backups (see `DEPLOYMENT.md`)
3. **Monitoring**: Consider setting up health monitoring (UptimeRobot, etc.)
4. **Domain**: If using a domain, wait for DNS propagation before expecting HTTPS

## 🆘 Need Help?

Check the logs:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

Or see `DEPLOYMENT.md` for detailed troubleshooting.
