from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests
import os
from dotenv import load_dotenv
import json
from openai import OpenAI


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
            "active": True,
            "closed": False
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
        
        # Format events with markets -> need to fix this here by calling the markets endpoint
        formatted_events = []
        for event in events:
            markets = event.get("markets", [])
            formatted_markets = []
            
            for market in markets:

                formatted_markets.append({
                    "id": market.get("id"),
                    "question": market.get("question"),
                    "description": market.get("description"),
                    "outcomePrices": market.get("outcomePrices")[0] if market.get("outcomePrices") else 0,
                    "volume": market.get("volume", 0)
                })
                #print(market.get("outcomePrices"))
            
            formatted_events.append({
                "id": event.get("id"),
                "title": event.get("title"),
                "description": event.get("description"),
                "slug": event.get("slug"),
                "endDate": event.get("endDate"),
                "category": event.get("category", "General"),
                "markets": formatted_markets,
                "image": event.get("image") # image url
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
async def chat_analysis(request: ChatRequest): # gotta fix this up here 
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
        
        openai_api_key = os.getenv("OPENAI_API_KEY")
        client = OpenAI(api_key=openai_api_key)


        prompt = (
        """ 
                You are **“Vega,”** a brutally candid, numbers-first trading-strategy architect.

        **Mission**  
        Design the _single most robust strategy_ that matches each user’s stated:  
        • Risk capital (absolute $ or % of portfolio)  
        • Risk tolerance (max loss per trade, max drawdown, VaR / ES targets)  
        • Preferred style (e.g., mean-reversion, momentum, event-driven, market-making)  
        • Asset class / venue (equities, FX, crypto, prediction markets, options, futures)  
        • Operational constraints (API limits, trading hours, leverage caps, fees, latency)

        **Rules of Engagement**  
        1. No platitudes or boilerplate. Facts, math, and hard edge only.  
        2. If the user’s request is vague, interrogate them for the missing parameters before giving a plan.  
        3. Every final answer must include—clearly separated by Markdown headings—  
        * **Thesis** – core rationale, key drivers, top two bullish & bearish forces.  
        * **Signal Generation** – data sources, indicators, formulas/pseudocode to map raw data → trade signals.  
        * **Risk & Sizing** – position sizing math (Kelly capped by user limits), stop/hedge logic, portfolio VaR test.  
        * **Execution Plan** – order types, venue mechanics, rate-limit handling, latency considerations.  
        * **Monitoring & Alerts** – what to track, update cadence, alert triggers.  
        * **Performance Attribution** – metrics (PnL vs model, hit rate, slippage) and how to surface them.  
        * **Contingencies** – scenario analysis for strategy failure and specific mitigation actions.  
        4. Express probabilities and returns as raw floats; label currency amounts explicitly (e.g., USD 10 000).  
        5. Use math or pseudocode wherever it clarifies; show key formulas end-to-end.  
        6. If user limits conflict with profitable implementation, warn loudly and propose the least-bad workaround.  
        7. Stay asset-agnostic: adapt drivers, indicators, and hedges to fit whatever market the user specifies.  
        8. Default to JSON output if the user asks for machine-readable format; otherwise plain Markdown.  
        9. Close with a one-liner that states the expected annualised Sharpe **and** worst-case 5-day drawdown under stress.

        (Respond in this uncompromising, data-driven voice—never sugar-coat. Don't respond in markdown format, just return the text.)

        """
            + json.dumps(event_context, indent=2)
        )
     
        try:
            # Get user's latest message
            user_message = request.messages[-1].content if request.messages else "Tell me about this event"
            
            # Create a proper OpenAI chat completion
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            return ai_response
            
        except Exception as ai_error:
            print(f"OpenAI API error: {ai_error}")
            # Fallback to mock response
            mock_response = f"I'm analyzing the event '{event.get('title')}'. This appears to be a {event.get('category', 'general')} category event with {len(event.get('markets', []))} markets. What specific aspect would you like me to focus on?"
            return ChatResponse(
                response=mock_response,
                event_context=event_context
            )


        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trending")
async def get_trending_events(limit: int = Query(10, ge=1, le=20)):
    """Get trending events based on volume"""
    try:

        params = {
            "order": "volume",      # <-- use a real field
            "ascending": False,      # send a boolean, not a string
            "limit": 10,
            "closed": False, # only get open markets
            # "liquidity_num_min": 100000
        }
        response = requests.get(f"{GAMMA_BASE}/events", params=params, timeout=10)
        response.raise_for_status()
        events = response.json()

        
        trending_events = []
        for event in events:

            trending_events.append(
                {
                "id": event.get("id"),
                "title": event.get("title"),
                "volume24hr": event.get("volume24hr"),
                "endDate": event.get("endDate"),
                "image": event.get("image"), # image url,
                "category": event.get("category")   
            })
        
        return trending_events
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 