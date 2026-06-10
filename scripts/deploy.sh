#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${MTPAY_DOMAIN:-mtpay.ai}"
HOST="${MTPAY_HOST:-ubuntu@3.1.201.228}"
KEY="${MTPAY_KEY:-/Users/powermac/627/xsina2025/developing/yang/2026job/mt-dapp/MtTalk/iworkplus.pem}"
REMOTE_ROOT="${MTPAY_REMOTE_ROOT:-/var/www/${DOMAIN}}"
API_DIR="${MTPAY_API_DIR:-/opt/mtpay-api}"
API_PORT="${MTPAY_API_PORT:-5174}"
RELEASE="$(date +%Y%m%d%H%M%S)"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "$HOST")
RSYNC_SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new"

cd "$ROOT_DIR"
npm run build:app

"${SSH[@]}" "sudo install -d -o ubuntu -g ubuntu '$REMOTE_ROOT/releases/$RELEASE' '$API_DIR'"
rsync -az --delete -e "$RSYNC_SSH" "$ROOT_DIR/dist/" "$HOST:$REMOTE_ROOT/releases/$RELEASE/"
rsync -az -e "$RSYNC_SSH" "$ROOT_DIR/server/mtpay-api.mjs" "$HOST:$API_DIR/mtpay-api.mjs"

if [[ -f "$ROOT_DIR/.env" ]]; then
  tmp_env="$(mktemp)"
  {
    echo "HOST=127.0.0.1"
    echo "PORT=$API_PORT"
    grep -E '^(PRICE_API_BASE_URL|PRICE_API_KEY|aveapiKey|supermtToken|VITE_MT_TOKEN_ADDRESS)=' "$ROOT_DIR/.env" || true
  } > "$tmp_env"
  scp -q -i "$KEY" -o StrictHostKeyChecking=accept-new "$tmp_env" "$HOST:/tmp/mtpay-api.env"
  rm -f "$tmp_env"
  "${SSH[@]}" "sudo install -m 600 -o root -g root /tmp/mtpay-api.env /etc/mtpay-api.env && rm -f /tmp/mtpay-api.env"
fi

"${SSH[@]}" "sudo ln -sfn '$REMOTE_ROOT/releases/$RELEASE' '$REMOTE_ROOT/current'"
"${SSH[@]}" "sudo tee /etc/systemd/system/mtpay-api.service >/dev/null <<'SERVICE'
[Unit]
Description=MTPAY price API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$API_DIR
EnvironmentFile=/etc/mtpay-api.env
ExecStart=/usr/bin/node $API_DIR/mtpay-api.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE
sudo systemctl daemon-reload
sudo systemctl enable --now mtpay-api.service
sudo systemctl restart mtpay-api.service"

"${SSH[@]}" "if ! sudo grep -q 'BEGIN MTPAY' /etc/caddy/Caddyfile; then sudo tee -a /etc/caddy/Caddyfile >/dev/null <<'CADDY'

# BEGIN MTPAY
http://mtpay.ai, https://mtpay.ai, http://www.mtpay.ai, https://www.mtpay.ai {
	encode zstd gzip
	root * /var/www/mtpay.ai/current

	header {
		Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\"
		X-Content-Type-Options \"nosniff\"
		X-Frame-Options \"DENY\"
		Referrer-Policy \"no-referrer-when-downgrade\"
	}

	@api path /api/mt-price /health
	handle @api {
		reverse_proxy 127.0.0.1:5174
	}

	@assets path /assets/* /icons/*
	header @assets Cache-Control \"public, max-age=31536000, immutable\"
	header /index.html Cache-Control \"no-cache\"

	handle {
		try_files {path} /index.html
		file_server
	}
}
# END MTPAY
CADDY
else
	sudo sed -i 's#@api path /api/ave/mt-price /health#@api path /api/mt-price /api/ave/mt-price /health#' /etc/caddy/Caddyfile
fi
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy"

"${SSH[@]}" "curl -fsS http://127.0.0.1:$API_PORT/health >/dev/null"

echo "Deployed https://$DOMAIN release $RELEASE"
