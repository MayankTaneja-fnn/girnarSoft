# Design Note: The Great DTU Grocery Race

## Section 1: Overall Architecture
The application is built on a decoupled architecture: **Python/FastAPI** on the backend and **React/Vite** on the frontend. 

**Why this architecture?**
*   **The Scraping Constraint:** The challenge restricts reverse-engineering private APIs. Both Blinkit and Swiggy utilize heavily secured GraphQL/REST endpoints wrapped with signed hashes and CAPTCHAs. Reversing this is not only fragile but violates the constraint.
*   **The Solution:** I implemented a headless browser layer using **Playwright**. By navigating directly to the desktop web interfaces and executing resilient DOM parsing (targeting `₹` currency symbols and traversing DOM nodes instead of hardcoded CSS classes), we bypass API token complexities. 
*   **Why Python over Node.js for Backend?** Python excels in data normalization. Integrating `thefuzz` for Levenshtein distance string matching is seamless in Python compared to building custom string similarity logic in a Node monolith.
*   **Why React?** A decoupled Vite React SPA provides a premium, reactive interface with immediate visual feedback (multi-step loading skeletons) without the server-side rendering overhead of Next.js, making local execution trivial for grading.

## Section 2: Product Matching Engine
The hardest part of this challenge is declaring that two wildly different strings represent the same physical product. I built a 3-Layer Matching Engine (`matcher.py`):

1.  **Layer 1 (Normalization):** Both strings are stripped of punctuation, platform suffixes (e.g., `(Blinkit Standard)`), and generic stopwords ("pack of", "fresh"). A curated synonym dictionary maps variations like "Nestle Maggi" to "Maggi".
2.  **Layer 2 (Weight Standardization - The Anchor):** A 70g pack and a 140g pack of Maggi are fundamentally different products. I use Regex (`\d+\s*(g|kg|ml|l|pc)`) to extract the volumetric/mass data and standardize it (e.g., `1kg` -> `1000g`). **Hard Constraint:** If both platforms provide a standard weight, they *must* match exactly to proceed.
3.  **Layer 3 (Fuzzy Token Sets):** I utilize `fuzz.token_set_ratio()` to handle words being entirely out of order. A threshold of 65% triggers a successful match.

**Where this logic breaks down (Honest Technical Breakdown):**
*   **Multipacks & Bundle Variants:** If Blinkit sells "Maggi 70g x 4" (extracting `70g`) and Instamart sells "Maggi 280g" (extracting `280g`), Layer 2 immediately rejects the pair despite them being functionally identical.
*   **Brand Ambiguity & SEO Padding:** Some listings pad their titles with descriptive tags (e.g., "Crunchy Snack"). If the threshold is too low, "Lay's Blue Chips" matches with "Bingo Blue Chips". If too high, we miss legitimate matches.
*   **Hidden Weights:** When platforms embed product weight strictly in the image graphic and omit it from the title DOM, Layer 2 is bypassed, leading to potential size mismatch false positives.

## Section 3: Scaling for the Future
To support all of Delhi or millions of concurrent users, this Playwright prototype would melt under CPU/RAM pressure. 

**What must change for scale:**
1.  **Replace Headless Browsers:** We must reverse-engineer the mobile API gateways (intercepting network requests) and route headless HTTP calls through a distributed pool of rotating residential proxies to bypass Cloudflare/Akamai bot protection.
2.  **Distributed Caching (Redis Geo-Hashing):** If 50 students at DTU search for "Maggi" at 11 PM, the backend should only scrape once. We would index search queries mapped to geohashes (e.g., `ttpg` for DTU). A Redis layer would cache `(geohash, query)` pairs with a TTL of 15 minutes to guarantee fast, cached responses.
3.  **Dynamic Location Contexts:** Hardcoded `lat`/`lng` cookies would be replaced by the browser's HTML5 Geolocation API, dynamically fed to the backend to manipulate Swiggy's headers and Blinkit's location cookie payloads on the fly.
