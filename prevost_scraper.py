#!/usr/bin/env python3
"""
Prevost‑stuff ➜ listings.json   (first 20 rows, no sidebar ads)
"""

import json, re, hashlib, os, time
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

BASE_URL   = "https://www.prevost-stuff.com"
LIST_PAGE  = f"{BASE_URL}/forsale/public_list_ads.php"
MAX_ITEMS  = 20
OUT_JSON   = "listings.json"
IMG_DIR    = "public/images/rv_listings"
HEADERS    = {"User-Agent": "CoachRangerBot/1.0 (+https://CoachRanger.fake)"}

os.makedirs(IMG_DIR, exist_ok=True)

def slug(text:str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")

def md5(data:bytes)->str:
    return hashlib.md5(data).hexdigest()[:12]

def download_img(src:str, title:str)->str|None:
    if not src: return None
    if not src.startswith("http"): src = urljoin(BASE_URL, src)
    try:
        r = requests.get(src, headers=HEADERS, timeout=15)
        if r.status_code != 200: return None
        # Skip tiny / ad banners
        if len(r.content) < 25_000:   # < ~25 kB is almost always an ad thumb
            return None
        fname = f"rv_{slug(title)}_{md5(r.content)}.jpg"
        path  = os.path.join(IMG_DIR, fname)
        with open(path, "wb") as f: f.write(r.content)
        return f"/images/rv_listings/{fname}"
    except Exception as e:
        print(f"Failed to download image {src}: {e}")
        return None

def scrape():
    try:
        response = requests.get(LIST_PAGE, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(response.text, "html.parser")
        listings, seen = [], set()

        # Look for individual listings - they typically have specific patterns
        listing_patterns = [
            # Pattern for individual coach listings
            soup.find_all("tr", class_=lambda x: x and ("row" in x or "listing" in x)),
            # Alternative: look for table rows with specific content
            [tr for tr in soup.find_all("tr") if tr.find("a") and len(tr.find_all("td")) >= 2]
        ]
        
        all_rows = []
        for pattern in listing_patterns:
            if pattern:
                all_rows.extend(pattern)
        
        if not all_rows:
            # Fallback: get all table rows and filter
            all_rows = soup.find_all("tr")

        for row in all_rows:
            cells = row.find_all("td")
            if len(cells) < 2: continue
            
            # Look for links that might be coach listings
            links = row.find_all("a", href=True)
            if not links: continue
            
            for link in links:
                href = link.get("href", "")
                if not href or "ad_id" not in href: continue
                
                # Extract text from the entire row for this listing
                row_text = row.get_text(" ", strip=True)
                if not row_text: continue
                
                # Look for price
                price_match = re.search(r"\$[\d,]+", row_text)
                if not price_match: continue
                
                try:
                    price = int(price_match.group(0).replace("$", "").replace(",", ""))
                except ValueError:
                    continue
                
                # Extract title from link or nearby text
                title = link.get_text(strip=True)
                if not title or len(title) < 5:
                    # Try to get title from surrounding context
                    title = row_text.split("$")[0].strip()[:100]
                
                if title in seen or not title:
                    continue
                seen.add(title)
                
                detail_url = urljoin(BASE_URL, href)
                
                # Download image
                img_tag = link.find("img") or row.find("img")
                img_src = ""
                if img_tag and img_tag.get("src"):
                    img_src = img_tag.get("src")
                featured = download_img(img_src, title)
                
                # Extract other details
                year_m = re.search(r"\b(19|20)\d{2}\b", row_text)
                yr = int(year_m.group()) if year_m else None
                
                model_m = re.search(r"Model:\s*([A-Z0-9\-]+)", row_text, re.I)
                model = model_m.group(1) if model_m else None
                
                # Look for common Prevost models in text
                if not model:
                    model_patterns = [r"\b(H3-45|XLII|X3-45|XL)\b", r"\b(X3|H3)\b"]
                    for pattern in model_patterns:
                        model_match = re.search(pattern, row_text, re.I)
                        if model_match:
                            model = model_match.group(1)
                            break
                
                slides_m = re.search(r"Slides?:\s*(\d)", row_text, re.I)
                slides = int(slides_m.group(1)) if slides_m else 0
                
                converter_m = re.search(r"Converter:\s*([^$|]+)", row_text, re.I)
                converter = converter_m.group(1).strip() if converter_m else None
                
                # Look for common converter names
                if not converter:
                    converter_names = ["Marathon", "Liberty", "Millennium", "Featherlite", "Country Coach", "Royale", "Emerald"]
                    for name in converter_names:
                        if name.lower() in row_text.lower():
                            converter = name
                            break

                listings.append({
                    "title": title,
                    "detail_url": detail_url,
                    "price": price,
                    "year": yr,
                    "model": model,
                    "slides": slides,
                    "converter": converter,
                    "featured_image": featured,
                })
                
                if len(listings) >= MAX_ITEMS:
                    break
            
            if len(listings) >= MAX_ITEMS:
                break

        with open(OUT_JSON,"w") as f: json.dump(listings,f,indent=2)
        print(f"✱ Saved {len(listings)} listings ➜ {OUT_JSON}")
        
    except Exception as e:
        print(f"Scraping failed: {e}")
        # Create empty file if scraping fails
        with open(OUT_JSON,"w") as f: json.dump([],f)

if __name__ == "__main__":
    t0=time.time(); scrape(); print("Done in %.1fs"%(time.time()-t0))