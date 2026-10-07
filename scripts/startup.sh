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

# Ensure node_modules exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Ensure Prisma client is generated
echo "Generating Prisma Client..."
npx prisma generate

PORT="${PORT:-3006}"
MODE="${1:-dev}"

# Automatically free port if occupied by a stale instance
EXISTING_PID=$(lsof -ti :${PORT} 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
  echo "Port ${PORT} is currently in use by PID ${EXISTING_PID}. Freeing port..."
  kill -9 $EXISTING_PID 2>/dev/null || true
  sleep 1
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
