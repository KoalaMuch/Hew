#!/bin/sh
set -e

ENV_FILE="/app/apps/web/public/__env.js"

cat > "$ENV_FILE" <<EOF
window.__ENV = {
  API_URL: "${API_URL:-}"
};
EOF

exec node apps/web/server.js
