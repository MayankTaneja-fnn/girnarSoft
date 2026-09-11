import sys
import asyncio

# 1. Windows Asyncio & Loop Compatibility: 
# Explicitly enforce WindowsProactorEventLoopPolicy to prevent NotImplementedError in Playwright
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from scraper import GroceryScraper
from matcher import match_products

scraper = GroceryScraper()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await scraper.start()
    yield
    # Shutdown logic
    await scraper.stop()

app = FastAPI(title="The Great DTU Grocery Race API", lifespan=lifespan)

# Allow requests from our React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/search")
async def search_groceries(q: str):
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")

    print(f"Searching for: {q}")
    
    # Run scrapers sequentially. Running Playwright contexts concurrently via asyncio.gather 
    # on some Windows machines can crash the underlying Node.js pipe and abruptly kill the server.
    try:
        blinkit_results = await scraper.scrape_blinkit(q)
        instamart_results = await scraper.scrape_instamart(q)
    except Exception as e:
        print(f"Scraping error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data from providers")

    # Match the products via the 3-Layer matching engine
    matches = match_products(blinkit_results, instamart_results)
    
    return {
        "query": q,
        "results": matches,
        "raw_counts": {
            "blinkit": len(blinkit_results),
            "instamart": len(instamart_results)
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Prevent Uvicorn reload loop switching which crashes Playwright on Windows
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
