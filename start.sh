#!/usr/bin/env bash
set -e

# ── InvestorAI — one-shot startup script ─────────────────────────────────────
# Installs backend deps, optionally rebuilds frontend, then starts FastAPI.
# The frontend SPA is served from backend/.. via FastAPI StaticFiles.
#
# Usage:
#   ./start.sh                  # start on 0.0.0.0:8000
#   PORT=9000 ./start.sh        # custom port
#   REBUILD=1 ./start.sh        # also rebuild the React frontend first

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$SCRIPT_DIR/backend"
FRONTEND="$SCRIPT_DIR/frontend"
PORT="${PORT:-8000}"

echo "==> Installing backend Python dependencies…"
pip install -r "$BACKEND/requirements.txt" --quiet

if [[ "${REBUILD:-0}" == "1" ]]; then
  echo "==> Building React frontend…"
  cd "$FRONTEND" && npm install --silent && npm run build
fi

echo ""
echo "==> Starting InvestorAI on http://0.0.0.0:$PORT"
echo "    API docs: http://0.0.0.0:$PORT/docs"
echo ""

cd "$BACKEND"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
