#!/usr/bin/env sh
set -e

cd "$(dirname "$0")"

APP_ENV="${APP_ENV:-production}"

if [ "$APP_ENV" = "local" ]; then
  HOST="${HOST:-127.0.0.1}"
  PORT="${PORT:-8002}"
else
  HOST="${HOST:-0.0.0.0}"
  PORT="${PORT:-8000}"
fi

alembic -c alembic.ini upgrade head
uvicorn app.main:app --host "$HOST" --port "$PORT"
