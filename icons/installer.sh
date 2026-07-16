#!/usr/bin/env bash
set -euo pipefail

PANEL_URL="${VYRON_PANEL_URL:-https://api.vyronpanel.com}"
INSTALL_DIR="${VYRON_INSTALL_DIR:-/opt/vyron-panel}"
PANEL_PORT="${VYRON_PANEL_PORT:-4170}"
MACHINE_ID="${VYRON_MACHINE_ID:-}"

if [[ -z "${MACHINE_ID}" ]]; then
  if [[ -f /etc/machine-id ]]; then
    MACHINE_ID="$(tr -d '\r\n' < /etc/machine-id)"
  else
    MACHINE_ID="$(hostname 2>/dev/null || echo unknown-machine)"
  fi
fi

DOWNLOAD_QUERY="?machine=${MACHINE_ID}"

if [[ "${EUID}" -ne 0 ]]; then
  if command -v sudo >/dev/null 2>&1; then
    echo "Re-running installer with sudo..."
    if [[ -r "/proc/$$/fd/255" ]]; then
      exec sudo -E /usr/bin/env bash /proc/$$/fd/255 "$@"
    fi

    echo "Could not re-open the installer script stream automatically."
    echo "Run: curl -fsSL ${PANEL_URL}/download/installer | sudo bash"
    exit 1
  fi

  echo "This installer needs root. Run it with sudo or install sudo first."
  exit 1
fi

ensure_package() {
  local cmd="$1"
  local pkg="$2"

  if command -v "$cmd" >/dev/null 2>&1; then
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y "$pkg"
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y "$pkg"
  elif command -v yum >/dev/null 2>&1; then
    yum install -y "$pkg"
  else
    echo "$cmd is required but no supported package manager was found."
    exit 1
  fi
}

ensure_package curl curl

ensure_nodejs() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y nodejs npm
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y nodejs npm
  elif command -v yum >/dev/null 2>&1; then
    yum install -y nodejs npm
  else
    echo "Node.js is required but could not be installed automatically."
    exit 1
  fi

  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "Node.js installation was attempted, but node or npm is still missing."
    exit 1
  fi
}

ensure_nodejs

mkdir -p "$INSTALL_DIR"
mkdir -p /etc/vyron

echo "Installing xvfb for Forge server support..."
ensure_package Xvfb xvfb

manifest_file="$(mktemp)"
curl -fsSL "$PANEL_URL/download/webpanel-files.txt${DOWNLOAD_QUERY}" -o "$manifest_file"

while IFS= read -r rel_path; do
  rel_path="${rel_path%$'\r'}"
  [[ -z "$rel_path" ]] && continue

  target_path="$INSTALL_DIR/$rel_path"
  mkdir -p "$(dirname "$target_path")"
  curl -fsSL "$PANEL_URL/download/webpanel/file/$rel_path${DOWNLOAD_QUERY}" -o "$target_path"
done < "$manifest_file"

rm -f "$manifest_file"

mkdir -p "$INSTALL_DIR/data" "$INSTALL_DIR/instances" "$INSTALL_DIR/download"

cd "$INSTALL_DIR"
if [[ -f package-lock.json ]]; then
  npm ci --omit=dev || npm install --omit=dev
else
  npm install --omit=dev
fi

cat > /etc/vyron/panel.env <<EOF
PORT=${PANEL_PORT}
EOF

cat > /etc/systemd/system/vyron-panel.service <<'EOF'
[Unit]
Description=Vyron Webpanel
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=-/etc/vyron/panel.env
WorkingDirectory=/opt/vyron-panel
ExecStart=/usr/bin/env node /opt/vyron-panel/server.js
Restart=always
RestartSec=4

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable vyron-panel.service
systemctl restart vyron-panel.service

primary_ip=""
if command -v hostname >/dev/null 2>&1; then
  primary_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi

host_name="$(hostname -f 2>/dev/null || hostname || true)"

echo "Vyron webpanel installed and started on this server."
echo "Panel source host: ${PANEL_URL}"
echo "Local panel port: ${PANEL_PORT}"
echo "Open Panel: http://localhost:${PANEL_PORT}"
if [[ -n "${host_name}" ]]; then
  echo "Open Panel: http://${host_name}:${PANEL_PORT}"
fi
if [[ -n "${primary_ip}" ]]; then
  echo "Open Panel: http://${primary_ip}:${PANEL_PORT}"
fi
