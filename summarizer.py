from pydantic import BaseModel
import re
from urllib.parse import urlparse
import requests
from urllib.parse import urlparse
import requests
import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from openai import AsyncOpenAI
client = AsyncOpenAI()


class Market(BaseModel):
    id: str
    title: str
    description: str


async def summarize_event_async(market_data: Market):
    """Async version of summarize_event that parallelizes API calls"""
    summary = {"yes": "", "no": ""}
    
    # Prepare the event context
    market_context = f"Market Details: {market_data.title}\n"
    if market_data.description:
        market_context += f"Description: {market_data.description}\n"

    
    # Create both API calls concurrently
    yes_task = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": f"[Limit response to most essential arguments <100 words] What is the bullish case for this Polymarket market? Why might someone bet YES on this?\n\n{market_context}"}
        ]
    )
    
    no_task = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": f" [Limit response to most essential arguments <100 words] What is the bearish case for this Polymarket market? Why might someone bet NO on this?\n\n{market_context}"}
        ]
    )
    
    # Wait for both calls to complete

    yes_response, no_response = await asyncio.gather(yes_task, no_task)
    
    # Extract the content
    summary['yes'] = yes_response.choices[0].message.content
    summary['no'] = no_response.choices[0].message.content

    return summary

async def summarize_all_async(markets: list[Market], concurrency: int = 5) -> list[dict[str, str]]:
    sem = asyncio.Semaphore(concurrency)
    async def worker(m: Market):
        async with sem:
            return await summarize_event_async(m)
    return await asyncio.gather(*(worker(m) for m in markets))

def summarize_all(markets: list[Market]) -> list[dict[str, str]]:
    # sync entry point for Streamlit
    return asyncio.run(summarize_all_async(markets))

