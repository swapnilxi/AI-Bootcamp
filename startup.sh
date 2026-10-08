#!/usr/bin/env zsh
# ─────────────────────────────────────────────────────────────
#  AI Bootcamp – Dev Startup Script
#  Usage: ./startup.sh [options]
#
#  Options:
#    -k, --kill, --kill-port   Force kill process occupying port without prompting
#    --no-kill                 Do not kill process if port is in use
#    -p, --port <number>       Specify port (default: 3006 or $PORT)
#    -h, --help                Show help message
# ─────────────────────────────────────────────────────────────

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Parse CLI options
KILL_PORT=""
CHOSEN_PORT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -k|--kill|--kill-port|-f|--force)
      KILL_PORT="yes"
      shift
      ;;
    --no-kill)
      KILL_PORT="no"
      shift
      ;;
    -p|--port)
      CHOSEN_PORT="$2"
      shift 2
      ;;
    -h|--help)
      echo "AI Bootcamp – Startup Script"
      echo "Usage: ./startup.sh [options]"
      echo ""
      echo "Options:"
      echo "  -k, --kill, --kill-port   Force kill process occupying port without prompting"
      echo "  --no-kill                 Do not kill process if port is in use"
      echo "  -p, --port <number>       Specify port to run on (default: 3006 or \$PORT)"
      echo "  -h, --help                Show this help message"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

if [ -n "$CHOSEN_PORT" ]; then
  PORT="$CHOSEN_PORT"
else
  PORT="${PORT:-3006}"
fi

echo ""
echo "✨  AI Bootcamp – Starting Dev Environment"
echo "────────────────────────────────────────────"

# 1. Install dependencies if node_modules is missing or package.json changed
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "📦  Installing dependencies…"
  npm install
else
  echo "✅  Dependencies up to date"
fi

# 2. Generate Prisma client if schema changed
if [ -f "prisma/schema.prisma" ]; then
  echo "🗄️   Generating Prisma client…"
  npx prisma generate >/dev/null
fi

# 3. Push DB schema (safe – will not reset existing data)
if [ -f "prisma/schema.prisma" ]; then
  echo "🗄️   Syncing database schema…"
  npx prisma db push --skip-generate 2>/dev/null || true
fi

# 4. Helper functions to detect and free port
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
      echo "   Sending termination signal (SIGTERM) to PID $pid..."
      kill -15 "$pid" 2>/dev/null || true
    fi
  done
  sleep 0.5
  for pid in $(echo "$pids"); do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "   Sending force kill (SIGKILL) to PID $pid..."
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
}

# 5. Check if port is in use and offer option to kill
EXISTING_PIDS="$(get_port_pids "$PORT")"
if [ -n "$EXISTING_PIDS" ]; then
  echo ""
  echo "⚠️   Port $PORT is currently in use:"
  lsof -i tcp:"$PORT" 2>/dev/null || lsof -i :"$PORT" 2>/dev/null || true
  echo ""

  SHOULD_KILL=""
  if [ "$KILL_PORT" = "yes" ]; then
    SHOULD_KILL="yes"
  elif [ "$KILL_PORT" = "no" ]; then
    SHOULD_KILL="no"
  elif [ -t 0 ] || [ -c /dev/tty ]; then
    # Interactive prompt
    PROMPT_TTY="/dev/tty"
    [ -t 0 ] && PROMPT_TTY="/dev/stdin"
    
    printf "❓  Kill process(es) on port %s to free it? [Y/n]: " "$PORT" > "$PROMPT_TTY"
    read -r response < "$PROMPT_TTY"
    case "$response" in
      [nN]|[nN][oO])
        SHOULD_KILL="no"
        ;;
      *)
        SHOULD_KILL="yes"
        ;;
    esac
  else
    # Non-interactive fallback: auto-kill so scripted calls don't crash with EADDRINUSE
    SHOULD_KILL="yes"
  fi

  if [ "$SHOULD_KILL" = "yes" ]; then
    echo "🔪  Freeing port $PORT..."
    kill_pids "$EXISTING_PIDS"
    sleep 1

    REMAINING="$(get_port_pids "$PORT")"
    if [ -n "$REMAINING" ]; then
      echo "⚠️   Still occupied after initial kill, applying forceful termination..."
      for r_pid in $(echo "$REMAINING"); do
        kill -9 "$r_pid" 2>/dev/null || true
      done
      sleep 1
    fi

    FINAL_CHECK="$(get_port_pids "$PORT")"
    if [ -n "$FINAL_CHECK" ]; then
      echo "❌  Could not free port $PORT (PIDs: $(echo $FINAL_CHECK | tr '\n' ' '))."
      echo "    Try running: kill -9 $(echo $FINAL_CHECK | tr '\n' ' ')"
      exit 1
    else
      echo "✅  Port $PORT freed successfully."
    fi
  else
    if [ -t 0 ] || [ -c /dev/tty ]; then
      PROMPT_TTY="/dev/tty"
      [ -t 0 ] && PROMPT_TTY="/dev/stdin"
      printf "👉  Enter an alternate port to use [press Enter to cancel]: " > "$PROMPT_TTY"
      read -r NEW_PORT < "$PROMPT_TTY"
      if [ -n "$NEW_PORT" ]; then
        PORT="$NEW_PORT"
        echo "Switched to port $PORT."
      else
        echo "Aborting startup. Run './startup.sh --kill' or use another port with: PORT=3007 ./startup.sh"
        exit 1
      fi
    else
      echo "❌  Port $PORT is occupied and kill was declined. Aborting."
      exit 1
    fi
  fi
fi

export NEXT_DIST_DIR="${NEXT_DIST_DIR:-.next-dev}"

echo ""
echo "🚀  Starting Next.js on http://localhost:$PORT  (build dir: $NEXT_DIST_DIR)"
echo "────────────────────────────────────────────"
echo ""

exec npm run dev -- -p "$PORT"
