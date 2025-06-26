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

        for row in soup.select("table tr"):
            # Each real listing has at least 3 <td> cells and a link with a $price nearby
            cells = row.find_all("td")
            if len(cells) < 3: continue
            link  = row.find("a", href=True)
            if not link:       continue
            price_match = re.search(r"\$\d[\d,]*", row.get_text(" ", strip=True))
            if not price_match: continue

            title = link.get_text(" ", strip=True)
            if title in seen: continue                   # safety
            seen.add(title)

            detail_url = urljoin(BASE_URL, link["href"])
            img_tag = link.find("img")
            featured = download_img(img_tag["src"] if img_tag else "", title)

            # Parse quick meta right from table text
            row_txt = row.get_text(" ", strip=True)
            price   = int(price_match.group(0).replace("$","").replace(",",""))
            year_m  = re.search(r"\b(19|20)\d{2}\b", row_txt)
            yr      = int(year_m.group()) if year_m else None
            model_m = re.search(r"Model:\s*([A-Z0-9\-]+)", row_txt, re.I)
            model   = model_m.group(1) if model_m else None
            slides_m= re.search(r"Slides?:\s*(\d)", row_txt, re.I)
            slides  = int(slides_m.group(1)) if slides_m else 0
            converter_m = re.search(r"Converter:\s*([^|]+)", row_txt, re.I)
            converter   = converter_m.group(1).strip() if converter_m else None

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
            if len(listings) >= MAX_ITEMS: break

        with open(OUT_JSON,"w") as f: json.dump(listings,f,indent=2)
        print(f"✱ Saved {len(listings)} listings ➜ {OUT_JSON}")
        
    except Exception as e:
        print(f"Scraping failed: {e}")
        # Create empty file if scraping fails
        with open(OUT_JSON,"w") as f: json.dump([],f)

if __name__ == "__main__":
    t0=time.time(); scrape(); print("Done in %.1fs"%(time.time()-t0))