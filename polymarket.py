from urllib.parse import urlparse
from pydantic import BaseModel
import re
from urllib.parse import urlparse
import requests
from urllib.parse import urlparse
import requests
from typing import Optional, Dict, Any



GAMMA_BASE = "https://gamma-api.polymarket.com"


class PolymarketLookupError(Exception):
    """Raised when a market UUID cannot be resolved from the given slug/search phrase."""


def extract_slug_from_url(url: str) -> str:
    path = urlparse(url).path                # “/event/fed-decision-in-july”
    parts = path.strip("/").split("/")        # [“event”, “fed-decision-in-july”]
    if len(parts) >= 2 and parts[0] == "event":
        return parts[1]
    raise ValueError(f"URL {url!r} is not a valid /event/… path")


def get_event_by_slug(
    slug: str,
    session: Optional[requests.Session] = None,
    return_full: bool = False
) -> Dict[str, Any]:
    s = session or requests.Session()
    params = {"slug": slug, "limit": 1, "active": True}
    r = s.get(f"{GAMMA_BASE}/events", params=params, timeout=10)
    r.raise_for_status()
    events = r.json()  # list of event dicts :contentReference[oaicite:0]{index=0}
    if not events:
        raise LookupError(f"No event found for slug={slug!r}")
    ev = events[0]
    return ev if return_full else {"id": ev.get("id"), "slug": ev.get("slug"),
                                    "startDate": ev.get("startDate"),
                                    "endDate": ev.get("endDate"),
                                    "tags": ev.get("tags", [])}

if __name__ == "__main__":
    # Example usage
    url = "https://polymarket.com/event/fed-decision-in-july?tid=1752940258419"
    slug = extract_slug_from_url(url)
    details = get_event_by_slug(slug, return_full=False)
    print(details)