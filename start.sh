#!/bin/bash

# Polymarket Terminal v2 Startup Script
echo "🚀 Starting Polymarket Terminal v2..."

# Check if Python and Node.js are installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Backend
echo "🔧 Starting FastAPI backend..."
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8002 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Next.js frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Polymarket Terminal v2 is starting up!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8002"
echo "📚 API Docs: http://localhost:8002/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait 