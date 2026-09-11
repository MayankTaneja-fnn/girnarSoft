import sys
import asyncio
from playwright.async_api import async_playwright
import urllib.parse

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

async def dump_html():
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context()
    page = await context.new_page()
    
    # Test Blinkit
    await context.add_cookies([
        {"name": "lat", "value": "28.7499", "domain": ".blinkit.com", "path": "/"},
        {"name": "lon", "value": "77.1165", "domain": ".blinkit.com", "path": "/"}
    ])
    await page.goto("https://blinkit.com/s/?q=maggi", wait_until="networkidle")
    html_b = await page.content()
    with open("blinkit.html", "w", encoding="utf-8") as f:
        f.write(html_b)
        
    # Test Instamart
    await context.add_cookies([
        {"name": "lat", "value": "28.7499", "domain": ".swiggy.com", "path": "/"},
        {"name": "lng", "value": "77.1165", "domain": ".swiggy.com", "path": "/"}
    ])
    await page.goto("https://www.swiggy.com/instamart/search?query=maggi", wait_until="networkidle")
    html_i = await page.content()
    with open("instamart.html", "w", encoding="utf-8") as f:
        f.write(html_i)
        
    await browser.close()
    await playwright.stop()

if __name__ == "__main__":
    asyncio.run(dump_html())
