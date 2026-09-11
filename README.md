# The Great DTU Grocery Race

This app ends the 11 PM hostel debate: Is it cheaper on Blinkit or Instamart? 
It live-scrapes both platforms for delivery strictly to DTU (Delhi Technological University) campus, standardizes item weights, and matches them side-by-side.

## Tech Stack
- **Backend:** Python + FastAPI + Playwright (Headless resilient DOM scraping).
- **Matching Engine:** 3-Layer Engine (Normalization -> Weight Standardization -> Fuzzy Token Sets).
- **Frontend:** React + Vite + Tailwind CSS.

## Prerequisites
- Python 3.9+
- Node.js 18+

---

## Setup & Run Instructions

*Follow these steps on a fresh machine.*

### 1. Setup Backend
1. Open a terminal and navigate to the `backend` folder.
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Install Playwright browser binaries:
   ```bash
   playwright install chromium
   ```
4. Start the FastAPI server (No `--reload` flag is used to avoid Windows asyncio subprocess bugs):
   ```bash
   python main.py
   ```
   The backend API will run on `http://localhost:8000`.

### 2. Setup Frontend
1. Open a *new* terminal and navigate to the `frontend` folder.
2. Install dependencies (using Tailwind CSS v3 for stable Vite PostCSS integration):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the URL shown in the terminal (e.g., `http://localhost:5173`).

### Usage
- Use the quick "Popular Picks" (Maggi, Amul Butter, Bread, Coke, Milk) or type manually.
- Wait (up to 8 seconds) while Playwright spins up headless browsers, injects DTU coordinates (`lat: 28.7499, lon: 77.1165`), parses the DOM resiliently, and feeds the results to the matching engine.
