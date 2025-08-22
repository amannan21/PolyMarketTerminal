# Polymarket Terminal v2

Real-time Polymarket terminal built with FastAPI and Next.js, featuring event search, filtering, chat analysis, and AI trading implementation



### 🔍 Event Discovery
- **Real-time Search**: Search through all active Polymarket events
- **Category Filtering**: Filter events by category (Politics, Sports, Crypto, etc.)
- **Trending Events**: View high-volume trending events
- **Market Details**: See individual markets within each event

### 🤖 AI Chat Analysis
- **Interactive Chat**: Chat interface for analyzing specific events
- **Context-Aware**: AI understands event context and market data
- **Real-time Responses**: Get instant analysis and insights

### 📊 Data Visualization
- **Volume Tracking**: Real-time volume data for all markets
- **Probability Display**: Current probability percentages
- **Market Counts**: Number of markets per event
- **End Dates**: Event resolution timelines

## 🏗️ Architecture

```
polymarket-terminal-v2/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main API application
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/
│   │   └── app/           # Next.js app router
│   └── package.json       # Node.js dependencies
├── start.sh               # Startup script
└── README.md              # This file
```

## 🛠️ Tech Stack

### Backend (FastAPI)
- **FastAPI**: Modern, fast web framework
- **Pydantic**: Data validation and serialization
- **Requests**: HTTP client for Polymarket API
- **CORS**: Cross-origin resource sharing
- **Async/Await**: High-performance async operations

### Frontend (Next.js)
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **Axios**: HTTP client for API calls
- **Headless UI**: Accessible UI components

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### 1. Clone and Setup
```bash
git clone <repository-url>
cd polymarket-terminal-v2
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8002
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8002
- **API Docs**: http://localhost:8002/docs

### 5. Quick Start Script
```bash
./start.sh
```

## 📚 API Endpoints

### Core Endpoints
- `GET /api/events` - Get all events with optional filtering
- `GET /api/events/{event_id}` - Get specific event details
- `GET /api/categories` - Get available categories
- `GET /api/trending` - Get trending events
- `POST /api/chat` - Chat analysis for events

### Query Parameters
- `limit`: Number of events to return (1-100)
- `category`: Filter by event category
- `search`: Search events by title/description

## 🎨 UI Features

### Main Interface
- **Search Bar**: Real-time event search
- **Category Filter**: Dropdown for category selection
- **Event Cards**: Clean, informative event display
- **Market Preview**: Show first 3 markets per event
- **Analyze Button**: Opens chat interface

### Chat Interface
- **Modal Design**: Clean, focused chat experience
- **Message History**: Scrollable conversation
- **Loading States**: Visual feedback during analysis
- **Event Context**: AI aware of event details

### Responsive Design
- **Mobile-First**: Works on all device sizes
- **Desktop Optimized**: Full-featured desktop experience
- **Touch Friendly**: Optimized for touch interactions

## 🔧 Development

### Backend Development
```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
python -m uvicorn main:app --reload

# Test endpoints
curl http://localhost:8002/api/events
```

### Frontend Development
```bash
cd frontend
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🚀 Deployment

### Backend Deployment
```bash
# Using Gunicorn
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# Using Docker
docker build -t polymarket-backend .
docker run -p 8002:8002 polymarket-backend
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Start production server
npm start

```

### Planned Features
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Analytics**: Charts and data visualization
- **User Accounts**: Personal portfolios and preferences
- **Notifications**: Price alerts and event updates



