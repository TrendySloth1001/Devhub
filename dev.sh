#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/.venv"

echo "[dev] Root: $ROOT_DIR"

if ! command -v python3 >/dev/null 2>&1; then
  echo "[dev] python3 not found" >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "[dev] npm not found" >&2
  exit 1
fi

# Python venv
if [ ! -d "$VENV_DIR" ]; then
  echo "[dev] Creating virtualenv..."
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
echo "[dev] Using Python: $(python -V)"

echo "[dev] Installing backend deps..."
pip install --quiet -r "$ROOT_DIR/server/requirements.txt" pydantic-settings python-multipart itsdangerous >/dev/null

# Frontend deps
if [ ! -d "$ROOT_DIR/client/node_modules" ]; then
  echo "[dev] Installing frontend deps..."
  (cd "$ROOT_DIR/client" && npm i)
fi

# Trap to cleanup
PIDS=()
cleanup() {
  echo "\n[dev] Shutting down..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  wait || true
}
trap cleanup INT TERM EXIT

echo "[dev] Starting backend on http://localhost:8000 ..."
"$VENV_DIR/bin/uvicorn" server.app.main:get_app --host 0.0.0.0 --port 8000 --reload --factory &
PIDS+=("$!")

echo "[dev] Starting frontend on http://localhost:5173 ..."
(cd "$ROOT_DIR/client" && npm run dev -- --host) &
PIDS+=("$!")

echo "[dev] Both servers started. Press Ctrl+C to stop."
wait -n || true


