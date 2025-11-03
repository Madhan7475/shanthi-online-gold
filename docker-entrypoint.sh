#!/bin/sh
set -e

echo "🚀 Starting Shanthi Online Gold Application..."
echo "📝 Using environment file: $ENV_FILE"

# Start backend
cd /app/backend
echo "🔧 Starting backend server on port 9000..."
ENV_FILE=$ENV_FILE node server.js &
BACKEND_PID=$!

# Start a simple static server for frontend using npx serve
cd /app/frontend/dist
echo "🎨 Starting frontend static server on port 3000..."
npx serve -s . -l 3000 -n &
FRONTEND_PID=$!

# Function to handle shutdown
shutdown() {
  echo "⏸️  Shutting down gracefully..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait
  exit 0
}

# Trap SIGTERM and SIGINT
trap shutdown SIGTERM SIGINT

# Wait for both processes
echo "✅ Application started successfully!"
echo "   - Backend API: http://localhost:9000"
echo "   - Frontend: http://localhost:3000"

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
