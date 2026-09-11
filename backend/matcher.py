import re
from thefuzz import fuzz

# Layer 1: Normalization Dictionaries
SYNONYMS = {
    "coca cola": "coke",
    "coca-cola": "coke",
    "nestle maggi": "maggi",
    "amul pasteurised": "amul",
    "amul pasteurized": "amul"
}

STOPWORDS = ["the", "a", "an", "pack", "of", "packet", "fresh", "variant", "standard", "blinkit", "instamart"]

def normalize_text(text: str) -> str:
    """Layer 1: Normalizes text, strips suffixes/prefixes and stopwords."""
    if not text:
        return ""
    text = text.lower()
    
    # Strip platform suffixes in parenthesis if they snuck in
    text = re.sub(r'\(.*?\)', '', text)
    
    # Remove special characters
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    
    # Apply synonyms
    for k, v in SYNONYMS.items():
        text = text.replace(k, v)
        
    # Remove stop words
    words = [w for w in text.split() if w not in STOPWORDS]
    return " ".join(words)

def standardize_weight(weight_str: str) -> str:
    """Layer 2: Standardizes weights (e.g., '1kg' -> '1000g', '1l' -> '1000ml')."""
    if not weight_str:
        return ""
    w = weight_str.lower().replace(" ", "")
    
    # Convert kg to g
    if "kg" in w:
        try:
            num = float(re.findall(r"[\d\.]+", w)[0])
            return f"{int(num * 1000)}g"
        except:
            pass
            
    # Convert l to ml (ensure not 'ml')
    if "l" in w and "ml" not in w:
         try:
            num = float(re.findall(r"[\d\.]+", w)[0])
            return f"{int(num * 1000)}ml"
         except:
            pass
            
    return w

def match_products(blinkit_items: list, instamart_items: list) -> list:
    """
    3-Layer Matching Engine.
    Returns unified list with confidence scores, price deltas, and savings percentages.
    """
    matches = []
    instamart_pool = instamart_items.copy()
    
    for b_item in blinkit_items:
        best_match = None
        best_score = 0
        
        b_name_norm = normalize_text(b_item["name"])
        b_weight_norm = standardize_weight(b_item.get("weight", ""))
        
        for i, i_item in enumerate(instamart_pool):
            i_name_norm = normalize_text(i_item["name"])
            i_weight_norm = standardize_weight(i_item.get("weight", ""))
            
            # Layer 2 Hard Constraint: Weights must exactly match if both exist
            if b_weight_norm and i_weight_norm and b_weight_norm != i_weight_norm:
                continue
                
            # Layer 3: Fuzzy Token Matching
            score = fuzz.token_set_ratio(b_name_norm, i_name_norm)
            
            if score > best_score:
                best_score = score
                best_match = (i, i_item)
                
        # Threshold for considering it the same product
        if best_match and best_score >= 65:
            i_item = best_match[1]
            b_price = b_item["price"]
            i_price = i_item["price"]
            
            # Calculate savings
            price_diff = abs(b_price - i_price)
            max_price = max(b_price, i_price)
            savings_pct = round((price_diff / max_price) * 100) if max_price > 0 else 0
            
            matches.append({
                "blinkit": b_item,
                "instamart": i_item,
                "confidence": best_score,
                "price_diff": price_diff,
                "savings_pct": savings_pct
            })
            # Remove from pool to prevent double matching
            instamart_pool.pop(best_match[0])
        else:
            matches.append({
                "blinkit": b_item,
                "instamart": None,
                "confidence": 0,
                "price_diff": 0,
                "savings_pct": 0
            })
            
    # Add remaining unmatched Instamart items
    for i_item in instamart_pool:
        matches.append({
            "blinkit": None,
            "instamart": i_item,
            "confidence": 0,
            "price_diff": 0,
            "savings_pct": 0
        })
        
    # Sort matches: matched pairs first, then by highest confidence, then by savings
    matches.sort(key=lambda x: (1 if x["blinkit"] and x["instamart"] else 0, x["confidence"], x["savings_pct"]), reverse=True)
    return matches
