#!/usr/bin/env python3
"""
Improved Prevost RV Scraper

This is a combination of the best features from both scrapers:
1. Uses the structure from the working template
2. Adds features extraction for converters, chassis, etc.
3. Formats data for our relevance-based search system

Based on the working template provided by the user.
"""

import requests
from bs4 import BeautifulSoup
import re
import hashlib
import os
import json
import time
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://www.prevost-stuff.com/forsale/public_list_ads.php"
DETAIL_BASE_URL = "https://www.prevost-stuff.com/forsale/"
IMAGE_DIR = "public/images/rv_listings/"
OUTPUT_FILE = "improved_prevost_listings.json"
os.makedirs(IMAGE_DIR, exist_ok=True)

# Common converters (companies that customize Prevost chassis)
KNOWN_CONVERTERS = [
    "Marathon", "Liberty", "Millennium", "Featherlite", "Vantare", 
    "Emerald", "Newell", "Prevost", "Country Coach", "Angola", 
    "American Heritage", "Foretravel", "Newmar", "Entegra", 
    "Tiffin", "Monaco", "Parliament", "Executive"
]

# Common chassis models
CHASSIS_MODELS = ["H3-45", "H3", "X3-45", "X3", "XLII", "XL", "H345", "X345"]

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

def download_image(image_url):
    """Download an image from a URL and save it to the image directory"""
    if not image_url:
        return None
        
    try:
        img_response = requests.get(image_url)
        if img_response.status_code == 200:
            img_hash = hash_image(img_response.content)
            file_name = f"rv_{img_hash[:8]}.jpg"
            file_path = os.path.join(IMAGE_DIR, file_name)
            
            with open(file_path, "wb") as f:
                f.write(img_response.content)
            
            return {
                "path": f"/images/rv_listings/{file_name}",
                "hash": img_hash
            }
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
        content_divs = soup.find_all("div")
        for div in content_divs:
            if div.find("p") and len(div.get_text()) > 50:  # Find a div with a paragraph and substantial text
                description = div.get_text(strip=True)
                break
        
        # Extract additional images
        additional_images = []
        for img in soup.find_all("img"):
            if img.get("src") and "thumbnail" not in img.get("src").lower():
                img_url = img.get("src")
                if not img_url.startswith("http"):
                    img_url = urljoin(detail_url, img_url)
                    
                # Download the image
                image_data = download_image(img_url)
                if image_data:
                    additional_images.append(image_data["path"])
        
        return {
            "description": description,
            "additional_images": additional_images
        }
    except Exception as e:
        print(f"Error fetching detail page {detail_url}: {e}")
        return {}

def scrape_prevost_listings():
    """Scrape Prevost RV listings"""
    print(f"Fetching listings from {BASE_URL}")
    response = requests.get(BASE_URL)
    if response.status_code != 200:
        print(f"Failed to fetch listings page: {BASE_URL} (Status: {response.status_code})")
        return []
    
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Debug HTML structure
    print("HTML structure analysis:")
    
    # Check for common container elements
    divs = soup.find_all("div")
    print(f"Found {len(divs)} div elements")
    
    tables = soup.find_all("table")
    print(f"Found {len(tables)} table elements")
    
    # Let's see if there are any tables with listing-like content
    if tables:
        for i, table in enumerate(tables):
            rows = table.find_all("tr")
            print(f"Table {i+1} has {len(rows)} rows")
            
            if rows and len(rows) > 3:  # Looks like a substantial table
                print(f"Table {i+1} appears to have substantial content, checking rows...")
                
                # Analyze the structure of the first row to understand the format
                first_row = rows[0]
                cells = first_row.find_all(["td", "th"])
                print(f"First row has {len(cells)} cells")
                
                if cells:
                    print("Sample content from first row:")
                    for j, cell in enumerate(cells):
                        content = cell.get_text(strip=True)
                        print(f"  Cell {j+1}: {content[:50]}...")
    
    # Try with div.row first (original selector)
    all_rows = soup.select("div.row")
    print(f"Found {len(all_rows)} div.row elements")
    
    # If div.row doesn't work, let's try table rows
    if not all_rows and tables:
        main_table = None
        for table in tables:
            if len(table.find_all("tr")) > 3:  # Table with multiple rows
                main_table = table
                break
        
        if main_table:
            print("Using table rows as listings instead of div.row")
            listings = []
            for row in main_table.find_all("tr")[1:]:  # Skip header row
                cells = row.find_all("td")
                
                if len(cells) < 3:  # Need at least 3 cells for title, price, image
                    continue
                    
                # Try to identify title, price, and image elements
                title = cells[0].get_text(strip=True) if cells[0] else None
                price_text = cells[1].get_text(strip=True) if len(cells) > 1 else None
                img_tag = cells[0].find("img") if cells[0] else None
                link_tag = cells[0].find("a") if cells[0] else None
                
                if not all([title, price_text]):
                    continue
                    
                if price_text and not re.search(r"\$\d", price_text):
                    continue  # Skip listings without numeric price
                
                price = extract_price(price_text)
                image_url = img_tag["src"] if img_tag and "src" in img_tag.attrs else None
                detail_url = link_tag["href"] if link_tag and "href" in link_tag.attrs else None
                
                print(f"Found listing: {title}, Price: {price}")
                
                # Create a basic listing object
                listing = {
                    "title": title,
                    "price": price,
                    "image_url": image_url,
                    "detail_url": detail_url
                }
                
                listings.append(listing)
            
            print(f"Found {len(listings)} listings in table format")
            return listings
    
    # If we get here, use the original div.row selector
    listings = []
    for row in soup.select("div.row"):
        title_tag = row.select_one("h5")
        price_tag = row.find(text=re.compile("Price: "))
        img_tag = row.select_one("img") 
        link_tag = row.select_one("a")

        if not all([title_tag, price_tag, img_tag, link_tag]):
            print("Missing required elements in listing")
            continue

        price_text = price_tag.strip()
        if not re.search(r"\$\d", price_text):
            print("Skipping listing without numeric price")
            continue  # skip listings without numeric price

        title = title_tag.get_text(strip=True)
        price = extract_price(price_text)
        image_url = img_tag["src"] if img_tag else None
        detail_url = link_tag["href"] if link_tag else None
        
        print(f"Processing listing: {title}, Price: {price}")

        # Download primary image
        image_info = download_image(image_url)
        if not image_info:
            print(f"Skipping listing with missing primary image: {title}")
            continue
            
        # Extract additional info
        year = extract_year(title)
        converter = detect_converter(title)
        chassis_model = detect_chassis_model(title)
        
        # Default manufacturer is Prevost for this site
        manufacturer = "Prevost"
        
        # Get additional details from detail page
        print(f"Fetching details for: {title}")
        details = fetch_listing_detail(detail_url)
        
        # Merge details
        description = details.get("description", "")
        additional_images = details.get("additional_images", [])
        
        # If we couldn't detect from title, try from description
        if not converter and description:
            converter = detect_converter(description)
        
        if not chassis_model and description:
            chassis_model = detect_chassis_model(description)
        
        # Extract other details from description
        if not year and description:
            year = extract_year(description)
            
        mileage = extract_mileage(description) if description else None
        length = extract_length(description) if description else None
        slides = extract_slides(description) if description else None
        
        # Create listing object
        listing = {
            "title": title,
            "description": description or title,
            "price": price,
            "year": year,
            "manufacturer": manufacturer,
            "converter": converter,
            "chassis_model": chassis_model,
            "mileage": mileage,
            "length": length,
            "slides": slides,
            "featured_image": image_info["path"],
            "additional_images": additional_images,
            "detail_url": detail_url,
            "location": "United States"  # Default location
        }
        
        listings.append(listing)
        print(f"Added listing: {year or 'N/A'} {converter or 'Unknown'} {chassis_model or 'N/A'} - ${price}")
        
        # Respect the website by adding a small delay
        time.sleep(0.5)

    return listings

def save_listings_to_json(listings, output_file=OUTPUT_FILE):
    """Save listings to a JSON file"""
    with open(output_file, "w") as f:
        json.dump(listings, f, indent=2)
    print(f"Saved {len(listings)} listings to {output_file}")

def main():
    """Main function"""
    print("Starting improved Prevost RV scraper...")
    listings = scrape_prevost_listings()
    
    if listings:
        save_listings_to_json(listings)
        print(f"Successfully scraped {len(listings)} listings")
    else:
        print("No listings were found or could be processed")

if __name__ == "__main__":
    main()