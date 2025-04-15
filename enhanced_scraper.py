#!/usr/bin/env python3
"""
Enhanced Prevost RV Scraper

This scraper:
1. Gets all listings from prevost-stuff.com with prices
2. Extracts manufacturer, converter, chassis model where possible
3. Downloads images and stores them locally
4. Follows detail links to get complete descriptions
5. Prepares data for direct import to the database
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import hashlib
import os
import time
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://www.prevost-stuff.com/forsale/public_list_ads.php"
DETAIL_BASE_URL = "https://www.prevost-stuff.com/forsale/"
IMAGE_DIR = "public/images/rv_listings/"
OUTPUT_FILE = "enhanced_prevost_listings.json"
os.makedirs(IMAGE_DIR, exist_ok=True)

# Common converters (companies that customize Prevost chassis)
KNOWN_CONVERTERS = [
    "Marathon", "Liberty", "Millennium", "Featherlite", "Vantare", 
    "Emerald", "Newell", "Prevost", "Country Coach", "Angola", 
    "American Heritage", "Foretravel", "Newmar", "Entegra", 
    "Tiffin", "Monaco", "Parliament", "Executive"
]

# Common chassis models
CHASSIS_MODELS = ["H3-45", "X3-45", "XLII", "XL", "H345", "X345", "H3", "X3"]

def hash_image(content):
    """Create a hash for the image content"""
    return hashlib.md5(content).hexdigest()

def extract_price(text):
    """Extract numeric price from text"""
    match = re.search(r"\$[\d,]+", text)
    if match:
        # Remove commas and convert to integer
        price_str = match.group().replace('$', '').replace(',', '')
        try:
            return int(price_str)
        except ValueError:
            return None
    return None

def extract_year(text):
    """Extract year from text"""
    match = re.search(r"\b(19|20)\d{2}\b", text)
    if match:
        return int(match.group())
    return None

def extract_mileage(text):
    """Extract mileage from text"""
    match = re.search(r"\b(\d{1,3}(?:,\d{3})*)\s*miles\b", text, re.IGNORECASE)
    if match:
        return int(match.group(1).replace(',', ''))
    return None

def extract_length(text):
    """Extract length in feet from text"""
    match = re.search(r"\b(\d{1,2})(?:\.\d+)?\s*(?:foot|feet|ft)\.?\b", text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

def extract_slides(text):
    """Extract number of slides from text"""
    match = re.search(r"\b(\d+)\s*slide", text, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

def detect_converter(text):
    """Detect converter company from text"""
    for converter in KNOWN_CONVERTERS:
        if re.search(r'\b' + re.escape(converter) + r'\b', text, re.IGNORECASE):
            return converter
    return None

def detect_chassis_model(text):
    """Detect chassis model from text"""
    for model in CHASSIS_MODELS:
        if re.search(r'\b' + re.escape(model) + r'\b', text, re.IGNORECASE):
            return model
    return None

def download_image(image_url, prefix="rv"):
    """Download an image and save it to the image directory"""
    if not image_url or not image_url.startswith('http'):
        return None

    try:
        img_response = requests.get(image_url)
        if img_response.status_code == 200:
            img_hash = hash_image(img_response.content)
            file_name = f"{prefix}_{img_hash[:8]}.jpg"
            file_path = os.path.join(IMAGE_DIR, file_name)
            
            with open(file_path, "wb") as f:
                f.write(img_response.content)
            
            return f"/images/rv_listings/{file_name}"
        else:
            print(f"Failed to download image: {image_url} (Status: {img_response.status_code})")
    except Exception as e:
        print(f"Image download error for {image_url}: {e}")
    
    return None

def fetch_listing_detail(detail_url):
    """Fetch and parse listing detail page"""
    if not detail_url:
        return {}
    
    # Create full URL if needed
    if not detail_url.startswith("http"):
        detail_url = urljoin(DETAIL_BASE_URL, detail_url)
    
    try:
        response = requests.get(detail_url)
        if response.status_code != 200:
            print(f"Failed to fetch detail page: {detail_url}")
            return {}
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract detailed description
        description = ""
        desc_div = soup.select_one("div.detail-description")
        if desc_div:
            description = desc_div.get_text(strip=True)
        
        # Extract additional images
        additional_images = []
        for img in soup.select("div.detail-images img"):
            img_url = img.get("src")
            if img_url and isinstance(img_url, str):
                if not img_url.startswith("http"):
                    img_url = urljoin(detail_url, img_url)
                additional_images.append(img_url)
        
        return {
            "full_description": description,
            "additional_image_urls": additional_images
        }
    except Exception as e:
        print(f"Error fetching detail page {detail_url}: {e}")
        return {}

def scrape_prevost_listings():
    """Scrape Prevost RV listings"""
    response = requests.get(BASE_URL)
    if response.status_code != 200:
        print(f"Failed to fetch listings page: {BASE_URL}")
        return []
    
    soup = BeautifulSoup(response.text, "html.parser")
    listings = []

    for row in soup.select("div.row"):
        title_tag = row.select_one("h5")
        price_tag = row.find(text=re.compile("Price: "))
        img_tag = row.select_one("img")
        link_tag = row.select_one("a")

        if not title_tag or not price_tag or not img_tag:
            continue

        # Skip listings without numeric price
        price_text = price_tag.strip() if price_tag else ""
        price = extract_price(price_text)
        if not price:
            continue

        title = title_tag.get_text(strip=True)
        image_url = img_tag["src"] if img_tag else None
        detail_url = link_tag["href"] if link_tag else None

        # Extract basic info from title and description
        year = extract_year(title)
        converter = detect_converter(title)
        chassis_model = detect_chassis_model(title)
        
        # Default manufacturer is Prevost for this site
        manufacturer = "Prevost"
        
        # Download primary image
        primary_image_path = download_image(image_url)
        if not primary_image_path:
            print(f"Skipping listing with missing primary image: {title}")
            continue
            
        # Get additional details from the detail page
        print(f"Fetching details for: {title}")
        details = fetch_listing_detail(detail_url)
        
        # Extract additional info from full description
        full_description = details.get("full_description", "")
        
        # If we couldn't detect from title, try the description
        if not converter:
            converter = detect_converter(full_description)
        
        if not chassis_model:
            chassis_model = detect_chassis_model(full_description)
        
        # Extract other details
        if not year:
            year = extract_year(full_description)
            
        mileage = extract_mileage(full_description)
        length = extract_length(full_description)
        slides = extract_slides(full_description)
        
        # Download additional images
        additional_images = []
        for img_url in details.get("additional_image_urls", [])[:5]:  # Limit to 5 additional images
            img_path = download_image(img_url, f"rv_detail_{hash(img_url)}")
            if img_path:
                additional_images.append(img_path)
            
            # Add a small delay to avoid overloading the server
            time.sleep(0.2)
        
        # Create the listing object with all extracted information
        listing = {
            "title": title,
            "description": full_description,
            "price": price,
            "year": year,
            "manufacturer": manufacturer,
            "converter": converter,
            "chassis_model": chassis_model,
            "mileage": mileage,
            "length": length,
            "slides": slides,
            "featured_image": primary_image_path,
            "additional_images": additional_images,
            "detail_url": detail_url
        }
        
        listings.append(listing)
        print(f"Added listing: {year} {converter or 'Unknown'} {chassis_model or ''} - ${price}")
        
        # Add a small delay between processing listings
        time.sleep(0.5)

    return listings

def save_listings_to_json(listings, output_file=OUTPUT_FILE):
    """Save listings to a JSON file"""
    with open(output_file, "w") as f:
        json.dump(listings, f, indent=2)
    print(f"Saved {len(listings)} listings to {output_file}")

def main():
    """Main function"""
    print("Starting enhanced Prevost RV scraper...")
    listings = scrape_prevost_listings()
    save_listings_to_json(listings)
    print(f"Scraped {len(listings)} listings")

if __name__ == "__main__":
    main()