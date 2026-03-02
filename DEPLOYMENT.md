# Deployment Guide for Vultr VPS

Deploy Hew (หิ้ว) to a Vultr VPS running **Ubuntu 24.04 LTS**.

**VPS:** Your Vultr VPS IP (find it in Vultr dashboard)
**Domain:** rubhew.com (Cloudflare DNS)
**SSH User:** linuxuser

---

## Step 1: SSH into your VPS

```bash
ssh -i ~/.ssh/hew_ed25519 linuxuser@<YOUR_VPS_IP>
```

If this is your first time connecting, type `yes` when asked about the host fingerprint.

If it asks for a password, first copy your SSH key:

```bash
ssh-copy-id -i ~/.ssh/hew_ed25519.pub linuxuser@<YOUR_VPS_IP>
```

Use the password from Vultr dashboard (Server > Overview).

---

## Step 2: Install Docker

Run these commands on the VPS:

```bash
sudo apt-get update && sudo apt-get upgrade -y

curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

sudo apt-get install -y docker-compose-plugin git

sudo usermod -aG docker linuxuser
```

**Log out and back in** for the docker group change to take effect:

```bash
exit
```

```bash
ssh -i ~/.ssh/hew_ed25519 linuxuser@<YOUR_VPS_IP>
```

Verify Docker works:

```bash
docker --version
docker compose version
```

---

## Step 3: Install Caddy (Reverse Proxy with auto-HTTPS)

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

---

## Step 4: Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

---

## Step 5: Clone the Repository

```bash
sudo mkdir -p /opt/hew
sudo chown linuxuser:linuxuser /opt/hew
cd /opt/hew
git clone https://github.com/KoalaMuch/Hew.git .
```

---

## Step 6: Configure Environment Variables

```bash
cd /opt/hew
cp .env.production.example .env.production
```

Generate passwords (use `hex` to avoid special characters that break URLs):

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Edit the file:

```bash
nano .env.production
```

Replace the entire content with (no comments, no blank lines):

```
POSTGRES_USER=hew_prod
POSTGRES_PASSWORD=<first hex password>
POSTGRES_DB=hew_prod
DATABASE_URL=postgresql://hew_prod:<first hex password>@postgres:5432/hew_prod
REDIS_URL=redis://redis:6379
FRONTEND_URL=https://rubhew.com
PORT=3000
NODE_ENV=production
OMISE_PUBLIC_KEY=pkey_test_xxx
OMISE_SECRET_KEY=skey_test_xxx
SESSION_SECRET=<second hex password>
```

Make sure the password in `POSTGRES_PASSWORD` and `DATABASE_URL` are **exactly the same**.

---

## Step 7: Configure Caddy

Replace the default Caddyfile with the Hew config:

```bash
sudo nano /etc/caddy/Caddyfile
```

Delete all existing content and paste:

```caddyfile
rubhew.com {
    reverse_proxy localhost:3001
}

www.rubhew.com {
    redir https://rubhew.com{uri} permanent
}

api.rubhew.com {
    reverse_proxy localhost:3000
}
```

Enable and restart Caddy:

```bash
sudo systemctl enable caddy
sudo systemctl restart caddy
```

---

## Step 8: Deploy

```bash
cd /opt/hew
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Build Docker images (API, Web, Worker)
2. Run database migrations
3. Start all services (PostgreSQL, Redis, API, Web, Worker)

First build may take 5-10 minutes.

---

## Step 9: Verify Deployment

```bash
# Check all services are running
docker compose -f docker-compose.prod.yml ps

# Check API
curl http://localhost:3000/api/health

# Check Web
curl http://localhost:3001

# Check Caddy
sudo systemctl status caddy

# Check HTTPS (from your local machine, not the VPS)
curl https://rubhew.com
curl https://api.rubhew.com/api/health
```

---

## Step 10: DNS Setup (Cloudflare)

In your Cloudflare dashboard for rubhew.com:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `<YOUR_VPS_IP>` | DNS only (grey cloud) |
| A | `api` | `<YOUR_VPS_IP>` | DNS only (grey cloud) |
| A | `www` | `<YOUR_VPS_IP>` | DNS only (grey cloud) |

**Important:** Set proxy to "DNS only" (grey cloud) so Caddy handles SSL, not Cloudflare. If you want Cloudflare proxy (orange cloud), set SSL/TLS mode to "Full (strict)" in Cloudflare.

---

## Updating the Application

```bash
cd /opt/hew
git pull
./deploy.sh
```

---

## Useful Commands

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View logs for a specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f worker

# Restart a service
docker compose -f docker-compose.prod.yml restart api

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Access database
docker compose -f docker-compose.prod.yml exec postgres psql -U hew_prod -d hew_prod

# Run migrations manually
docker compose -f docker-compose.prod.yml run --rm api sh -c "cd /app/packages/db && npx prisma migrate deploy"
```

---

## Troubleshooting

### Services won't start

```bash
docker compose -f docker-compose.prod.yml logs
sudo netstat -tulpn | grep -E '3000|3001|5432|6379'
```

### Database connection errors

- Verify `POSTGRES_PASSWORD` in `.env.production` matches what's in `DATABASE_URL`
- Check PostgreSQL is healthy: `docker compose -f docker-compose.prod.yml ps postgres`

### Caddy not working / SSL issues

```bash
sudo systemctl status caddy
sudo journalctl -u caddy -f
sudo caddy validate --config /etc/caddy/Caddyfile
```

- Ensure DNS A records point to VPS IP
- Ensure firewall allows ports 80 and 443
- If using Cloudflare proxy (orange cloud), set SSL mode to "Full (strict)"

### Containers can't be reached by Caddy

- Port mappings are already configured in `docker-compose.prod.yml`
- API binds to `127.0.0.1:3000`, Web binds to `127.0.0.1:3001`
- Verify with: `curl http://localhost:3000/api/health`

---

## Database Backups

Create a backup script:

```bash
cat > /opt/hew/backup-db.sh << 'SCRIPT'
#!/bin/bash
BACKUP_DIR="/opt/hew/backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
docker compose -f /opt/hew/docker-compose.prod.yml exec -T postgres pg_dump -U hew_prod hew_prod | gzip > "$BACKUP_DIR/hew_backup_$DATE.sql.gz"
find "$BACKUP_DIR" -name "hew_backup_*.sql.gz" -mtime +30 -delete
SCRIPT
chmod +x /opt/hew/backup-db.sh
```

Add to cron (runs daily at 2 AM):

```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/hew/backup-db.sh") | crontab -
```

---

## Security Checklist

- [ ] Strong database password (generated with `openssl rand -hex 32`)
- [ ] Strong session secret (different from database password)
- [ ] `.env.production` has no comments (clean key=value format)
- [ ] Firewall enabled (only ports 22, 80, 443)
- [ ] Docker ports bound to 127.0.0.1 (not public)
- [ ] HTTPS enabled via Caddy
- [ ] Database and Redis not exposed to internet
- [ ] Regular backups configured

---

## Cost Estimate

| Item | Cost |
|---|---|
| Vultr VPS (2GB RAM, 1 vCPU) | ~$12/mo |
| Domain (rubhew.com via Cloudflare) | ~$10/year |
| SSL Certificate | Free (Caddy + Let's Encrypt) |
| **Total** | **~$13/mo** |
