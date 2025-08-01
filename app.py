import streamlit as st
from summarizer import summarize_all
from polymarket import extract_slug_from_url, get_event_by_slug
import requests
from pydantic import BaseModel
import os

# should I store event information into a database so it persists over tabs or just use session state?


def print_summary(summary): # have to edit this later 
    """Helper function to print summary in Streamlit"""
    st.subheader("✅ YES Case")
    st.write(summary['yes'])
    
    st.subheader("❌ NO Case")
    st.write(summary['no'])

class Market(BaseModel):
    id: str
    title: str
    description: str

class EventObject(BaseModel):
    id: str
    slug: str
    startDate: str
    endDate: str | None = None
    tags: list | None = []
    title: str | None = None
    description: str | None = None
    markets: list[Market] | None = []  # Added to handle markets data

st.set_page_config(page_title="Polymarket Summarizer", layout="centered")

col1, col2 = st.columns([1, 4])
with col1:
    st.image("images/polymarket.webp", width=100)
with col2:
    st.title("Polymarket Event Summarizer")
event_url = st.text_input("Enter Polymarket Market URL")

if st.button("Summarize Event") and event_url:
    try:
        # call the api to get details of the event/market here 
        # passes to chatgpt 
        slug = extract_slug_from_url(event_url)

        event_dict = get_event_by_slug(slug, return_full=True)  # Get full event data
        #print("Raw event data:", event_dict)  # Debugging line to check event data retrieval
        
        # Extract only the fields we need and handle missing ones
        # Handle tags - extract just the labels from the tag objects
        tag_labels = []
        if event_dict.get("tags"):
            tag_labels = [tag.get("label", "") for tag in event_dict["tags"] if isinstance(tag, dict)]

        # Handle markets - extract relevant fields from each market
        markets = event_dict.get("markets") or []
        market_list = [
            Market(
                id=m.get("id", ""),
                title=m.get("question", ""),
                description=m.get("description", "")
            ) for m in markets
        ]

        
        ev = EventObject(
            id=event_dict.get("id", ""),
            slug=event_dict.get("slug", ""),
            startDate=event_dict.get("startDate"),
            endDate=event_dict.get("endDate"),
            tags=tag_labels,
            title=event_dict.get("title"),
            description=event_dict.get("description"),
            markets=market_list
        )
        #print(event_data)  # Debugging line to check market da`ta conversion

        st.subheader(ev.description)
        # Show loading spinner while generating summary
        #with st.spinner("🤖 Analyzing market data and generating insights..."):
        # for each market, give a summary of the yes and no cases
        st.subheader("Market Summary")
# Run all summaries concurrently
        summaries = summarize_all(ev.markets)

        for m, summary in zip(ev.markets, summaries):
            st.markdown(f"### {m.title}")
            print_summary(summary)


    except ValueError as e:
        st.error(f"Error: {e}")
    except Exception as e: # how to get better at catching errors/making error messages better 
        st.error(f"Error: {e}")




