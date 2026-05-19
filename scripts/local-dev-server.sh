#!/usr/bin/env bash
# Start static local server for the art gallery site (idempotent).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${ZRP_LOCAL_PORT:-8765}"
PIDFILE="$ROOT/.local-server.pid"
LOG="$ROOT/.local-server.log"

is_listening() {
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
}

http_ok() {
  curl -fsS -o /dev/null -m 3 "http://127.0.0.1:${PORT}/" 2>/dev/null
}

if is_listening && http_ok; then
  exit 0
fi

if [[ -f "$PIDFILE" ]]; then
  oldpid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "${oldpid:-}" ]] && kill -0 "$oldpid" 2>/dev/null; then
    kill "$oldpid" 2>/dev/null || true
    sleep 0.5
  fi
  rm -f "$PIDFILE"
fi

if is_listening; then
  pids="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "${pids:-}" ]]; then
    kill $pids 2>/dev/null || true
    sleep 0.5
  fi
fi

cd "$ROOT"
nohup python3 -m http.server "$PORT" >>"$LOG" 2>&1 &
echo $! >"$PIDFILE"

for _ in $(seq 1 20); do
  if http_ok; then
    echo "http://127.0.0.1:${PORT}/"
    exit 0
  fi
  sleep 0.25
done

echo "Server failed to start on port $PORT (see $LOG)" >&2
exit 1
