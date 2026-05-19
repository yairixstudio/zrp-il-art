#!/usr/bin/env bash
# Watchdog: ensure local dev server is up (used by launchd every 5 minutes).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${ZRP_LOCAL_PORT:-8765}"
LOG="$ROOT/.local-server-watchdog.log"

{
  echo "=== $(date '+%Y-%m-%d %H:%M:%S %z') ==="
  "$ROOT/scripts/local-dev-server.sh" || echo "restart failed"
} >>"$LOG" 2>&1
