
import requests
from datetime import datetime

def get_active_markets_volume(target_date):
    base_url = "https://gamma-api.polymarket.com"
    
    # Get all markets with active filter
    params = {
        'active': True,  # or 'closed': False depending on API structure
        'limit': 1000    # Adjust based on API limits
    }
    
    markets_response = requests.get(f"{base_url}/markets", params=params)
    markets = markets_response.json()
    
    total_volume = 0
    active_market_count = 0
    
    for market in markets:
        # Double-check market is actually active
        if market.get('closed', False) == False and market.get('active', True):
            market_id = market['id']
            
            # Get detailed market data including volume
            market_response = requests.get(f"{base_url}/markets/{market_id}")
            market_data = market_response.json()
            
            # Add volume for this active market
            if 'volume' in market_data:
                total_volume += market_data['volume']
                active_market_count += 1
    
    return {
        'total_volume': total_volume,
        'active_markets': active_market_count
    }




if __name__ == "__main__":
    print("Hello, World!")
    # call the api
    response = requests.get("https://gamma-api.polymarket.com/markets?volume_num_min=1000000000&active=true")
    response.raise_for_status()
    print(response.json())
    print(len(response.json()))
    #get_active_markets_volume()