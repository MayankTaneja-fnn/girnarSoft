import sys
import asyncio
from scraper import GroceryScraper

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

async def main():
    s = GroceryScraper()
    await s.start()
    try:
        print("Testing Blinkit...")
        b = await s.scrape_blinkit("Maggi")
        print(f"Blinkit found {len(b)} items.")
        
        print("Testing Instamart...")
        i = await s.scrape_instamart("Maggi")
        print(f"Instamart found {len(i)} items.")
    finally:
        await s.stop()

if __name__ == "__main__":
    asyncio.run(main())
