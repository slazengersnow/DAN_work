#!/bin/bash
# restart.sh - Restart both frontend and backend servers

echo "===== Stopping running servers ====="
pkill -f "node.*server.js" || true
pkill -f "react-scripts start" || true

sleep 2

echo "===== Starting backend server ====="
cd "$(dirname "$0")/backend"
node server.js &
BACKEND_PID=$!

echo "Backend server started with PID: $BACKEND_PID"
sleep 3

echo "===== Starting frontend server ====="
cd "$(dirname "$0")/frontend"
npm start &
FRONTEND_PID=$!

echo "Frontend server started with PID: $FRONTEND_PID"
echo "Both servers are now running. Press Ctrl+C to stop them."

wait