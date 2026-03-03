# Self-hosted Grafana Setup Guide

Complete guide to deploy the monitoring stack (Grafana, Prometheus, Loki, Tempo, Alloy) on your VPS with Cloudflare DNS, including owner-only Grafana access and public-but-restricted telemetry ingestion.

## Prerequisites

- VPS running Ubuntu/Debian with Docker and Docker Compose installed
- Domain `rubhew.com` managed via Cloudflare
- Caddy installed on VPS (`sudo apt install caddy`)
- The production compose file and monitoring configs from this repo

## Architecture overview

```
Browser (rubhew.com)
  │  POST /collect
  ▼
telemetry.rubhew.com  ──►  Caddy  ──►  Alloy :12347 (faro.receiver)
                                             │
                                     ┌───────┴───────┐
                                     ▼               ▼
                                   Loki           Tempo
                                     │               │
                                     ▼               ▼
                              grafana.rubhew.com  ◄──┘
                                (Grafana UI)
                                     │
                                     ▼
                                Prometheus
```

## Step 1: Cloudflare DNS records

In Cloudflare dashboard for `rubhew.com`, add two A records pointing to your VPS IP:

| Type | Name        | Content       | Proxy status |
|------|-------------|---------------|--------------|
| A    | `grafana`   | `<VPS_IP>`    | Proxied      |
| A    | `telemetry` | `<VPS_IP>`    | Proxied      |

### SSL/TLS settings

1. Go to **SSL/TLS > Overview** and set mode to **Full (strict)**.
2. Go to **SSL/TLS > Edge Certificates** and enable **Always Use HTTPS**.

## Step 2: Deploy the monitoring stack

Copy the repo files to your VPS, then bring up all services:

```bash
cd /path/to/hew
docker compose -f docker-compose.prod.yml up -d
```

Verify all monitoring containers are running:

```bash
docker compose -f docker-compose.prod.yml ps | grep -E 'grafana|prometheus|loki|tempo|alloy'
```

All five should show `running`.

## Step 3: Install the Caddyfile

Copy the `Caddyfile` from this repo to the Caddy config location and restart:

```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
sudo systemctl status caddy
```

Caddy auto-obtains TLS certificates. With Cloudflare proxy enabled, Caddy uses
Cloudflare's origin certificates. No extra cert config needed.

### What the Caddyfile does

- `grafana.rubhew.com` proxies to Grafana on `localhost:3002`.
- `telemetry.rubhew.com` only accepts `POST`/`OPTIONS` to `/collect*` and proxies to Alloy on `localhost:12347`. Everything else returns 404.

## Step 4: Set production environment variables

In your `.env.production` file on the VPS, set:

```env
FARO_URL=https://telemetry.rubhew.com/collect
GRAFANA_ADMIN_PASSWORD=<choose-a-strong-password>
```

Then redeploy the web container so the entrypoint regenerates `__env.js`:

```bash
docker compose -f docker-compose.prod.yml up -d web
```

## Step 5: Owner-only access for Grafana (Cloudflare Zero Trust)

This ensures only you can reach `grafana.rubhew.com`.

### Option A: Cloudflare Access (recommended)

1. Go to [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/).
2. Navigate to **Access > Applications > Add an application**.
3. Choose **Self-hosted**.
4. Set:
   - **Application name**: `Grafana`
   - **Subdomain**: `grafana` / **Domain**: `rubhew.com`
5. Create an **Access Policy**:
   - **Policy name**: `Owner only`
   - **Action**: Allow
   - **Include rule**: Emails — `<your-email@example.com>`
6. Save. Cloudflare will now show a login gate before any request reaches Grafana.

### Option B: IP allowlist via Caddy (simpler, less flexible)

If you have a static IP, add a remote IP matcher to the Grafana block in `Caddyfile`:

```caddyfile
grafana.rubhew.com {
    @blocked not remote_ip <YOUR_IP>
    respond @blocked "Forbidden" 403
    reverse_proxy localhost:3002
}
```

### Grafana internal auth

Regardless of the above, Grafana itself requires login. Change the default password:

1. Open `https://grafana.rubhew.com`.
2. Log in with `admin` / `<GRAFANA_ADMIN_PASSWORD>`.
3. Go to **Administration > Users** and update your profile.

## Step 6: Telemetry endpoint hardening

The telemetry endpoint is already restricted by the Caddyfile (POST/OPTIONS only),
and Alloy's CORS is locked to your app origins:

```
cors_allowed_origins = ["https://rubhew.com", "https://www.rubhew.com"]
```

### Cloudflare rate limiting (recommended)

1. In Cloudflare dashboard, go to **Security > WAF > Rate limiting rules**.
2. Create a rule:
   - **Rule name**: `Telemetry rate limit`
   - **When incoming requests match**: Hostname equals `telemetry.rubhew.com`
   - **Rate**: 100 requests per 10 seconds per IP
   - **Action**: Block for 60 seconds
3. Deploy.

## Step 7: Verify end-to-end

### 7.1 Check Grafana UI

```bash
curl -sI https://grafana.rubhew.com/api/health
# Expect: 200 OK (or Cloudflare Access redirect if policy is active)
```

Open `https://grafana.rubhew.com` in your browser, log in.

### 7.2 Check telemetry endpoint

```bash
# Should return 2xx
curl -s -o /dev/null -w '%{http_code}' \
  -X POST https://telemetry.rubhew.com/collect \
  -H 'Content-Type: application/json' \
  -d '{}'

# GET should return 404
curl -s -o /dev/null -w '%{http_code}' https://telemetry.rubhew.com/collect
```

### 7.3 Check datasources in Grafana

1. Go to **Connections > Data sources** in Grafana.
2. All three (Prometheus, Loki, Tempo) should show green "Data source is working".

### 7.4 Check frontend telemetry flow

1. Open `https://rubhew.com` in your browser.
2. Open DevTools > Network tab, filter for `collect`.
3. You should see POST requests to `https://telemetry.rubhew.com/collect` returning 2xx.
4. In Grafana, go to **Explore > Loki**, run query:
   ```
   {service_name="hew-web"}
   ```
5. You should see frontend log entries.

### 7.5 Verify ports are not exposed

From another machine (not the VPS):

```bash
# These should all fail/timeout
curl -s --connect-timeout 3 http://<VPS_IP>:3002
curl -s --connect-timeout 3 http://<VPS_IP>:12347
curl -s --connect-timeout 3 http://<VPS_IP>:9090
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Grafana unreachable | DNS not propagated | Wait or check Cloudflare DNS records |
| Grafana shows "Bad Gateway" | Container not running | `docker compose -f docker-compose.prod.yml up -d grafana` |
| No frontend telemetry | `FARO_URL` empty | Check `.env.production` has `FARO_URL` set, redeploy `web` |
| CORS errors in browser | Alloy CORS mismatch | Verify `cors_allowed_origins` in `monitoring/alloy/config.alloy` |
| Datasource errors in Grafana | Internal network issue | Check containers are on same Docker network (`hew_network`) |
| Loki/Tempo empty | Alloy not receiving | Check Alloy logs: `docker compose -f docker-compose.prod.yml logs alloy` |
| Cloudflare Access blocks you | Policy misconfigured | Check email in Access policy matches your login |
