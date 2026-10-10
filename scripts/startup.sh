#!/usr/bin/env bash
set -e

# Change directory to the repository root
cd "$(dirname "$0")/.."

echo "============================================="
echo "  THE AI BOOTCAMP — Application Startup     "
echo "============================================="

# Ensure environment variables file exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
  else
    echo "Creating default .env..."
    cat << 'EOF' > .env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3006"
NEXTAUTH_SECRET="super-secret-cosmic-key-change-in-production-min-32-chars-astrology-platform"
NEXT_PUBLIC_APP_URL="http://localhost:3006"
INITIAL_SUPER_ADMIN_EMAIL="superadmin@aibootcamp.dev"
INITIAL_SUPER_ADMIN_PASSWORD="CosmicMasterAdmin2026!"
INITIAL_SUPER_ADMIN_NAME="Celestial SuperAdmin"
EOF
  fi
fi

# Ensure packages are installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
elif ! npm ls --depth=0 >/dev/null 2>&1; then
  echo "Missing dependencies detected. Installing..."
  npm install
else
  echo "Dependencies already installed."
fi

# Ensure Prisma client is generated
echo "Generating Prisma Client..."
npx prisma generate

PORT="${PORT:-3006}"
MODE="dev"
KILL_PORT=""

for arg in "$@"; do
  case "$arg" in
    -k|--kill|--kill-port|-f|--force)
      KILL_PORT="yes"
      ;;
    --no-kill)
      KILL_PORT="no"
      ;;
    prod|start)
      MODE="prod"
      ;;
    dev)
      MODE="dev"
      ;;
  esac
done

get_port_pids() {
  local target_port="$1"
  local listen_pids
  listen_pids="$(lsof -ti tcp:"$target_port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$listen_pids" ]; then
    echo "$listen_pids"
  else
    lsof -ti :"$target_port" 2>/dev/null || true
  fi
}

kill_pids() {
  local pids="$1"
  for pid in $(echo "$pids"); do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Terminating PID $pid..."
      kill -15 "$pid" 2>/dev/null || true
    fi
  done
  sleep 0.5
  for pid in $(echo "$pids"); do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
}

EXISTING_PIDS="$(get_port_pids "$PORT")"
if [ -n "$EXISTING_PIDS" ]; then
  echo "⚠️  Port ${PORT} is currently in use:"
  lsof -i tcp:"${PORT}" 2>/dev/null || lsof -i :${PORT} 2>/dev/null || true

  SHOULD_KILL=""
  if [ "$KILL_PORT" = "yes" ]; then
    SHOULD_KILL="yes"
  elif [ "$KILL_PORT" = "no" ]; then
    SHOULD_KILL="no"
  elif [ -t 0 ] || [ -c /dev/tty ]; then
    PROMPT_TTY="/dev/tty"
    [ -t 0 ] && PROMPT_TTY="/dev/stdin"
    printf "❓  Kill process(es) on port %s to free it? [Y/n]: " "$PORT" > "$PROMPT_TTY"
    read -r response < "$PROMPT_TTY"
    case "$response" in
      [nN]|[nN][oO]) SHOULD_KILL="no" ;;
      *) SHOULD_KILL="yes" ;;
    esac
  else
    SHOULD_KILL="yes"
  fi

  if [ "$SHOULD_KILL" = "yes" ]; then
    echo "Freeing port ${PORT}..."
    kill_pids "$EXISTING_PIDS"
    sleep 1
  else
    echo "Port $PORT is occupied. Please free the port or pass PORT=<port>."
    exit 1
  fi
fi

if [ "$MODE" = "prod" ] || [ "$MODE" = "start" ]; then
  echo "Starting production server on port ${PORT}..."
  if [ ! -d ".next" ]; then
    echo "Building Next.js application..."
    npm run build
  fi
  exec npm run start -- -p "${PORT}"
else
  echo "Starting development server on http://localhost:${PORT} ..."
  exec npm run dev -- -p "${PORT}"
fi
