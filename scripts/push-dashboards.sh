#!/bin/bash
set -e

# Push Grafana dashboards via HTTP API
# Usage: ./scripts/push-dashboards.sh [GRAFANA_URL] [TOKEN]
#
# On the VPS (bypasses Cloudflare):
#   ./scripts/push-dashboards.sh http://localhost:3002 glsa_xxxxx
#
# Or with admin credentials:
#   ./scripts/push-dashboards.sh http://localhost:3002 admin:password

GRAFANA_URL="${1:-http://localhost:3002}"
AUTH="${2:-}"
DASHBOARD_DIR="$(cd "$(dirname "$0")/../monitoring/grafana/provisioning/dashboards/json" && pwd)"
FOLDER_UID="hew"
FOLDER_TITLE="Hew"

if [ -z "$AUTH" ]; then
  echo "Usage: $0 <grafana-url> <token-or-user:pass>"
  echo ""
  echo "Examples:"
  echo "  $0 http://localhost:3002 glsa_xxxx          # service account token"
  echo "  $0 http://localhost:3002 admin:MyPassword    # basic auth"
  exit 1
fi

if [[ "$AUTH" == *":"* ]]; then
  AUTH_HEADER="-u $AUTH"
else
  AUTH_HEADER="-H \"Authorization: Bearer $AUTH\""
fi

call() {
  local method="$1" path="$2" data="$3"
  if [[ "$AUTH" == *":"* ]]; then
    if [ -n "$data" ]; then
      curl -sS -X "$method" "${GRAFANA_URL}${path}" -u "$AUTH" -H "Content-Type: application/json" -d "$data"
    else
      curl -sS -X "$method" "${GRAFANA_URL}${path}" -u "$AUTH" -H "Content-Type: application/json"
    fi
  else
    if [ -n "$data" ]; then
      curl -sS -X "$method" "${GRAFANA_URL}${path}" -H "Authorization: Bearer $AUTH" -H "Content-Type: application/json" -d "$data"
    else
      curl -sS -X "$method" "${GRAFANA_URL}${path}" -H "Authorization: Bearer $AUTH" -H "Content-Type: application/json"
    fi
  fi
}

echo "==> Testing connection to ${GRAFANA_URL}..."
HEALTH=$(call GET "/api/health" "")
echo "    Health: $HEALTH"

echo ""
echo "==> Creating folder '${FOLDER_TITLE}'..."
FOLDER_RESULT=$(call POST "/api/folders" "{\"uid\":\"${FOLDER_UID}\",\"title\":\"${FOLDER_TITLE}\"}" 2>&1 || true)
echo "    $FOLDER_RESULT"

echo ""
echo "==> Pushing dashboards from ${DASHBOARD_DIR}..."

for f in "${DASHBOARD_DIR}"/*.json; do
  BASENAME=$(basename "$f")
  echo ""
  echo "--- ${BASENAME}"

  DASHBOARD_JSON=$(cat "$f")
  PAYLOAD=$(cat <<EOFPAYLOAD
{
  "dashboard": ${DASHBOARD_JSON},
  "folderUid": "${FOLDER_UID}",
  "overwrite": true,
  "message": "Pushed by push-dashboards.sh"
}
EOFPAYLOAD
)
  RESULT=$(call POST "/api/dashboards/db" "$PAYLOAD" 2>&1)
  STATUS=$(echo "$RESULT" | grep -o '"status":"[^"]*"' | head -1 || echo "")
  URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 || echo "")

  if echo "$RESULT" | grep -q '"status":"success"'; then
    echo "    OK: $URL"
  else
    echo "    Result: $RESULT"
  fi
done

echo ""
echo "==> Done! Open ${GRAFANA_URL}/dashboards to see your dashboards."
