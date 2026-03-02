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
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Install Docker Compose plugin and Git
sudo apt-get install -y docker-compose-plugin git

# Add your user to docker group (avoids needing sudo for docker)
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
nano .env.production
```

Fill in these values:

```bash
# Generate a strong database password
openssl rand -base64 32
```

Update `.env.production`:

| Variable | What to set |
|---|---|
| `POSTGRES_PASSWORD` | Paste the generated password |
| `DATABASE_URL` | Replace `CHANGE_ME_STRONG_PASSWORD` with the same password |
| `FRONTEND_URL` | `https://rubhew.com` |
| `SESSION_SECRET` | Run `openssl rand -base64 32` again, use a different value |
| `OMISE_PUBLIC_KEY` | Your key from https://dashboard.omise.co (use test keys for now) |
| `OMISE_SECRET_KEY` | Your key from https://dashboard.omise.co (use test keys for now) |

Leave `REDIS_URL`, `PORT`, and `NODE_ENV` as their defaults.

---

## Step 7: Configure Caddy

Caddy runs on the host and proxies requests to Docker containers. Since the containers expose ports on localhost, we need to use `localhost:PORT` instead of Docker service names.

```bash
sudo nano /etc/caddy/Caddyfile
```

Paste this content:

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

Restart Caddy:

```bash
sudo systemctl enable caddy
sudo systemctl restart caddy
```

---

## Step 8: Expose Docker Ports

The `docker-compose.prod.yml` doesn't expose ports to the host by default. We need to add port mappings so Caddy can reach the containers.

```bash
cd /opt/hew
nano docker-compose.prod.yml
```

Add `ports` to the `api` and `web` services:

Under the `api` service, add:
```yaml
    ports:
      - "127.0.0.1:3000:3000"
```

Under the `web` service, add:
```yaml
    ports:
      - "127.0.0.1:3001:3001"
```

These bind to `127.0.0.1` only, so the ports are not exposed to the internet directly — only Caddy can reach them.

---

## Step 9: Deploy

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

## Step 10: Verify Deployment

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

## Step 11: DNS Setup (Cloudflare)

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

- Make sure `ports` are added in `docker-compose.prod.yml` (see Step 8)
- Ports should bind to `127.0.0.1` not `0.0.0.0`

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

- [ ] Strong database password (generated randomly)
- [ ] Strong session secret (generated randomly)
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
