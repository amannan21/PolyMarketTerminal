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
        
        openai_api_key = os.getenv("OPENAI_API_KEY")
        client = OpenAI(api_key=openai_api_key)

        event_context = {
            "title": "Q1-2026 Global Inflation Outlook",
            "description": "Set of markets tracking whether major economies will keep inflation under 3 % by March 31 2026.",
            "category": "Macro",
            "endDate": "2026-03-31T23:59:59Z",
            "markets": [
                {
                    "question": "Will U.S. CPI YoY be below 3 % in March 2026?",
                    "description": "Resolves ‘Yes’ if the YoY change in the U.S. Consumer Price Index reported for March 2026 is strictly below 3 %. Uses BLS headline CPI.",
                    "probability": 0.47,
                    "volume": 158_200.50
                }
            ]
        }

        prompt = (
        """ You are “Quark,” a ruthless macro-focused prediction-market strategist. 
        Traits: brutally realistic, deeply quantitative, unfazed by uncertainty, allergic to fluff. 
        Goal: design a complete trading strategy—research, signal generation, risk control, order execution, monitoring, and post-mortem—for the market(s) in the supplied JSON. 
        Assume full API access to Polymarket’s Gamma & CLOB endpoints and on-chain settlement. 
        Capital available: 100 000 USDC.   Target risk per trade: ≤ 2 % of NAV.   Max portfolio VaR (95 %): ≤ 10 %.

        USER:
        Below is the event context (verbatim).  
        Tasks:
        1. **Fundamental Thesis** –  
        • Deconstruct the macro backdrop (Fed policy path, fiscal, labor, commodities).  
        • State the two strongest bullish and two strongest bearish arguments for the market’s “Yes” outcome.  
        2. **Quant Signals** –  
        • List ≥ 3 leading indicators you’d track (e.g., CPI nowcasts, 5-y breakevens, OIS curve, Atlanta Fed Wage Growth).  
        • Describe how you’d translate each into a probability update (formula or pseudocode).  
        3. **Order-Book & Liquidity Scan** –  
        • Pull best bid/ask, depth at ±5 c, and 30-day volume.  
        • Decide limit-vs-RFQ vs sweeping and justify.  
        4. **Position Sizing & Risk** –  
        • Compute position size for base case (0.47 prob, 6 c/5 c spread) using Kelly fraction capped by the risk limits above. Show math.  
        • Define stop-loss / hedge (e.g., inverse CPI spreads on Kalshi or EURUSD options).  
        5. **Execution Plan** –  
        • Pseudocode for placing, modifying, cancelling orders via the CLOB API—including handling partial fills and API rate-limits.  
        • Specify monitoring cadence (cron or event-driven) and alert conditions (price gaps, liquidity evaporates, new CPI print).  
        6. **Performance & Attribution** –  
        • Lay out metrics: PnL vs mark-to-model, hit ratio, intraday slippage, variance contribution per signal.  
        • Describe a nightly notebook / dashboard update.  
        7. **Contingencies** –  
        • What blows up this trade? (Fed surprise hike, supply-shock oil spike, data revision).  
        • Mitigations (flatten, reverse, or re-hedge).  
        8. **Deliverable Format** –  
        Return a JSON object with these top-level keys:  
            • "thesis", "signals", "sizing", "execution", "monitoring", "contingencies".  
        Each key’s value should be Markdown-ready text (line breaks with \n). Keep numbers as plain floats.
        """
            + json.dumps(event_context, indent=2)
        )

        resp = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,            
        
        )

        return resp.output_text


        
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