import json
from bs4 import BeautifulSoup

def inspect_blinkit():
    html = open("blinkit.html", encoding="utf-8").read()
    soup = BeautifulSoup(html, "html.parser")
    # Blinkit usually has products in "a" tags with href pointing to /pr/
    links = soup.find_all("a", href=lambda h: h and "/pr/" in h)
    print(f"Blinkit found {len(links)} links")
    for link in links[:2]:
        print("Blinkit link:", link.get_text(separator=' | '))

def inspect_instamart():
    html = open("instamart.html", encoding="utf-8").read()
    soup = BeautifulSoup(html, "html.parser")
    # Find any div that might look like a product card
    cards = soup.find_all("div", {"data-testid": "item-card"})
    print(f"Instamart found {len(cards)} item-card divs")
    if not cards:
        # maybe another test id or class
        cards = soup.find_all("div", class_=lambda c: c and "Product" in c)
        print(f"Instamart fallback 'Product' class found {len(cards)}")
    for card in cards[:2]:
        print("Instamart card:", card.get_text(separator=' | '))

if __name__ == "__main__":
    inspect_blinkit()
    inspect_instamart()
