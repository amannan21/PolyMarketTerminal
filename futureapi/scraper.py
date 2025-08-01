# # load playwright + beautiful soup 
# from playwright.sync_api import sync_playwright
# from pydantic import BaseModel
# class EventData(BaseModel):
#     topic_name: str
#     description: str
#     market_lines: list[str]
#     date: str
#     time: str

# def scrape_event_data(url: str): # return should be a pydantic model
#     # return should be a pydantic model
    

#     with sync_playwright() as p:
#         browser = p.chromium.launch(headless=True) # headless is a boolean that determines if the browser is visible or not 
#         page = browser.new_page()
#         page.goto(url)

#         # wait for the page to load
#         page.wait_for_load_state("networkidle")

#         # get the page content
#         content = page.content()

#         # get topic name
#         topic_text = page.title()

#         # get description
#         description = page.locator('meta[name="twitter:description"]').get_attribute("content")

#         # get the different lines of the market 

#         # get date

#         # get time

#         # get location
#         current_event = EventData(
#             topic_name=topic_text,
#             description=description,
#             market_lines=market_lines,
#             date=date,
#             time=time,
#         )
#     return current_event


