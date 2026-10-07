#!/usr/bin/env zsh
# ─────────────────────────────────────────────────────────────
#  AI Bootcamp – Dev Startup Script
#  Usage: ./startup.sh
# ─────────────────────────────────────────────────────────────

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

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

# 4. Seed database only if DB is empty (seed script checks this internally)
# Uncomment if you want auto-seed on startup:
# echo "🌱  Seeding database…"
# npx prisma db seed 2>/dev/null || true

# 5. Start the Next.js dev server
#
# Two dev servers sharing one build directory corrupt each other's chunks, which
# surfaces as ChunkLoadError and 500s on every API route. So: free the port
# first, and compile into our own directory (.gitignore already covers .next-*).
PORT="${PORT:-3006}"
EXISTING_PID="$(lsof -ti :"$PORT" 2>/dev/null || true)"
if [ -n "$EXISTING_PID" ]; then
  echo "⚠️   Port $PORT is held by PID $EXISTING_PID — stopping it first…"
  kill -9 $EXISTING_PID 2>/dev/null || true
  sleep 1
fi

export NEXT_DIST_DIR="${NEXT_DIST_DIR:-.next-dev}"

echo ""
echo "🚀  Starting Next.js on http://localhost:$PORT  (build dir: $NEXT_DIST_DIR)"
echo "────────────────────────────────────────────"
echo ""

exec npm run dev -- -p "$PORT"
