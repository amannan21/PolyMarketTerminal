from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Polymarket Terminal API",
    description="A comprehensive API for Polymarket prediction markets with chat analysis",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Polymarket API base URL
GAMMA_BASE = "https://gamma-api.polymarket.com"

# Pydantic models
class Event(BaseModel):
    id: str
    title: str
    description: str
    slug: str
    endDate: str
    category: str
    markets: List[Dict[str, Any]]

class Market(BaseModel):
    id: str
    question: str
    description: str
    probability: float
    volume: float

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    event_id: str
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    response: str
    event_context: Dict[str, Any]

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Polymarket Terminal API v2", "status": "healthy"}

@app.get("/api/events")
async def get_events(
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all Polymarket events with optional filtering"""
    try:
        params = {
            "limit": limit,
            "active": True
        }
        
        if category:
            params["category"] = category
            
        response = requests.get(f"{GAMMA_BASE}/events", params=params, timeout=10)
        response.raise_for_status()
        events = response.json()
        
        # Filter by search term if provided
        if search:
            search_lower = search.lower()
            events = [
                event for event in events
                if search_lower in event.get("title", "").lower() or 
                   search_lower in event.get("description", "").lower()
            ]
        
        # Format events with markets
        formatted_events = []
        for event in events:
            markets = event.get("markets", [])
            formatted_markets = []
            
            for market in markets:
                formatted_markets.append({
                    "id": market.get("id"),
                    "question": market.get("question"),
                    "description": market.get("description"),
                    "probability": market.get("probability", 0),
                    "volume": market.get("volume", 0)
                })
            
            formatted_events.append({
                "id": event.get("id"),
                "title": event.get("title"),
                "description": event.get("description"),
                "slug": event.get("slug"),
                "endDate": event.get("endDate"),
                "category": event.get("category", "General"),
                "markets": formatted_markets
            })
        
        return formatted_events
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/events/{event_id}")
async def get_event_details(event_id: str):
    """Get detailed information about a specific event"""
    try:
        response = requests.get(f"{GAMMA_BASE}/events", params={"id": event_id}, timeout=10)
        response.raise_for_status()
        events = response.json()
        
        if not events:
            raise HTTPException(status_code=404, detail="Event not found")
        
        event = events[0]
        return event
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/categories")
async def get_categories():
    """Get available event categories"""
    try:
        response = requests.get(f"{GAMMA_BASE}/events", params={"limit": 100}, timeout=10)
        response.raise_for_status()
        events = response.json()
        
        categories = set()
        for event in events:
            category = event.get("category")
            if category:
                categories.add(category)
        
        return list(categories)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_analysis(request: ChatRequest):
    """Chat interface for event analysis"""
    try:
        # Get event details
        event_response = requests.get(f"{GAMMA_BASE}/events", params={"id": request.event_id}, timeout=10)
        event_response.raise_for_status()
        events = event_response.json()
        
        if not events:
            raise HTTPException(status_code=404, detail="Event not found")
        
        event = events[0]
        
        # Create event context for AI
        event_context = {
            "title": event.get("title"),
            "description": event.get("description"),
            "category": event.get("category"),
            "endDate": event.get("endDate"),
            "markets": []
        }
        
        for market in event.get("markets", []):
            event_context["markets"].append({
                "question": market.get("question"),
                "description": market.get("description"),
                "probability": market.get("probability"),
                "volume": market.get("volume")
            })
        
        # For now, return a mock AI response
        # In a real implementation, you would integrate with OpenAI or another AI service
        volumes = [float(m.get('volume', 0)) for m in event_context['markets'] if m.get('volume') is not None]
        total_volume = sum(volumes) if volumes else 0
        ai_response = f"I've analyzed the event '{event_context['title']}'. This event has {len(event_context['markets'])} markets with a total volume of ${total_volume:,.0f}. "
        
        if event_context['markets']:
            probabilities = [float(m.get('probability', 0)) for m in event_context['markets'] if m.get('probability') is not None]
            if probabilities:
                avg_probability = sum(probabilities) / len(probabilities)
                ai_response += f"The average probability across all markets is {avg_probability:.1%}. "
        
        ai_response += "What specific aspect of this event would you like me to analyze further?"
        
        return ChatResponse(
            response=ai_response,
            event_context=event_context
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trending")
async def get_trending_events(limit: int = Query(10, ge=1, le=20)):
    """Get trending events based on volume"""
    try:
        response = requests.get(f"{GAMMA_BASE}/events", params={"limit": limit, "active": True, "sortBy": "volume"}, timeout=10)
        response.raise_for_status()
        events = response.json()
        
        trending_events = []
        for event in events:
            total_volume = sum(float(market.get("volume", 0)) for market in event.get("markets", []))
            trending_events.append({
                "id": event.get("id"),
                "title": event.get("title"),
                "category": event.get("category", "General"),
                "total_volume": total_volume,
                "market_count": len(event.get("markets", [])),
                "endDate": event.get("endDate")
            })
        
        return trending_events
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 