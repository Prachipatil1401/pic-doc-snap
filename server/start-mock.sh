#!/usr/bin/env bash
# Start the camera server in mock mode (for Raspberry Pi / Linux)
set -euo pipefail

SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
cd "$SCRIPT_DIR"

export MOCK_MODE=true
export PORT=${PORT:-3001}

echo "Starting camera server in MOCK_MODE on port $PORT..."
node camera-server.js
