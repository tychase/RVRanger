#!/usr/bin/env python3
"""
Prevost Table Scraper

This scraper:
1. Extracts RV listings from Prevost-stuff.com's table-based layout
2. Identifies converters, chassis models, and other attributes
3. Downloads images and saves them locally
4. Creates a structured dataset ready for import
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
OUTPUT_FILE = "prevost_table_listings.json"
os.makedirs(IMAGE_DIR, exist_ok=True)

def hash_image(content):
    """Create a hash for the image content"""
    return hashlib.md5(content).hexdigest()

def extract_price(text):
    """Extract numeric price from text"""
    if not text:
        return None
        
    match = re.search(r"\$[\d,]+", text)
    if match:
        # Remove commas and convert to integer
        price_str = match.group().replace('$', '').replace(',', '')
        try:
            return int(price_str)
        except ValueError:
            return None
    return None

def extract_field_from_text(text, field_name):
    """Extract a field value from text like 'Converter:Marathon'"""
    if not text:
        return None
        
    pattern = field_name + r':([^:]+?)(?:$|(?=\w+:))'
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return None

def extract_year(text):
    """Extract year from text"""
    if not text:
        return None
        
    match = re.search(r"Year:(\d{4})", text)
    if match:
        return int(match.group(1))
    return None

def extract_model(text):
    """Extract model from text"""
    return extract_field_from_text(text, "Model")

def extract_slides(text):
    """Extract slides from text"""
    slides = extract_field_from_text(text, "Slides")
    if slides and slides.isdigit():
        return int(slides)
    return 0  # Default to 0 slides if not specified

def extract_converter(text):
    """Extract converter from text"""
    return extract_field_from_text(text, "Converter")

def download_image(image_url, prefix="rv"):
    """Download an image from a URL and save it locally"""
    if not image_url:
        return None
        
    # Create full URL if needed
    if not image_url.startswith("http"):
        image_url = urljoin(BASE_URL, image_url)
        
    try:
        response = requests.get(image_url)
        if response.status_code == 200:
            img_hash = hash_image(response.content)
            file_name = f"{prefix}_{img_hash[:8]}.jpg"
            file_path = os.path.join(IMAGE_DIR, file_name)
            
            with open(file_path, "wb") as f:
                f.write(response.content)
            
            return f"/images/rv_listings/{file_name}"
        else:
            print(f"Failed to download image: {image_url} (Status: {response.status_code})")
    except Exception as e:
        print(f"Image download error for {image_url}: {e}")
    
    return None

def process_detail_page(url):
    """Process detail page to extract more information and images"""
    if not url:
        return {}
        
    # Create full URL if needed
    if not url.startswith("http"):
        url = urljoin(DETAIL_BASE_URL, url)
    
    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Failed to fetch detail page: {url}")
            return {}
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Look for detailed description
        description = ""
        for p in soup.find_all("p"):
            text = p.get_text(strip=True)
            if len(text) > 100:  # Looking for substantial paragraphs
                description = text
                break
                
        if not description:
            # Try finding a div with substantial text
            for div in soup.find_all("div"):
                text = div.get_text(strip=True)
                if len(text) > 100 and "Price:" not in text:
                    description = text
                    break
        
        # Look for additional images
        additional_images = []
        for img in soup.find_all("img"):
            if not img.get("src"):
                continue
                
            src = img.get("src")
            # Skip small thumbnails and navigation icons
            if "thumb" in src.lower() or "icon" in src.lower() or "button" in src.lower():
                continue
                
            # Create full URL if needed
            if not src.startswith("http"):
                src = urljoin(url, src)
                
            # Download image
            image_path = download_image(src)
            if image_path:
                additional_images.append(image_path)
                
            # Limit to 5 additional images and avoid overloading server
            if len(additional_images) >= 5:
                break
            time.sleep(0.2)
        
        return {
            "description": description,
            "additional_images": additional_images
        }
    except Exception as e:
        print(f"Error processing detail page {url}: {e}")
        return {}

def scrape_prevost_tables(max_listings=20):
    """Scrape RV listings from table-based structure at prevost-stuff.com"""
    print(f"Fetching listings from {BASE_URL}")
    response = requests.get(BASE_URL)
    if response.status_code != 200:
        print(f"Failed to fetch listings: {BASE_URL} (Status: {response.status_code})")
        return []
    
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Find tables with listing data
    tables = soup.find_all("table")
    print(f"Found {len(tables)} tables on the page")
    print(f"Limiting to {max_listings} listings for performance")
    
    listings = []
    listing_count = 0
    
    # Process each listing row in each table
    for table in tables:
        # Skip small tables that are likely navigation or header elements
        rows = table.find_all("tr")
        if len(rows) <= 2:
            continue
            
        for row in rows:
            # Skip header rows
            if row.find("th"):
                continue
                
            cells = row.find_all("td")
            if len(cells) < 3:
                continue
                
            # Extract information from cells
            # For this site, usually:
            # - First cell: Title + Image
            # - Second cell: Details (Year, Model, Price)
            # - Third cell: Additional info (Converter, Slides)
            
            # Check if we have a title and image
            title_cell = cells[0] if len(cells) > 0 else None
            details_cell = cells[1] if len(cells) > 1 else None
            info_cell = cells[2] if len(cells) > 2 else None
            
            if not all([title_cell, details_cell]):
                continue
                
            # Extract title and image
            title_tag = title_cell.find("a")
            title = title_tag.get_text(strip=True) if title_tag else ""
            
            # If no title found, try getting text directly from cell
            if not title:
                title = title_cell.get_text(strip=True)
                
            # Extract link to detail page
            detail_url = title_tag.get("href") if title_tag else None
            
            # Extract image
            img_tag = title_cell.find("img")
            image_url = img_tag.get("src") if img_tag else None
            
            # Extract details
            details_text = details_cell.get_text(strip=True) if details_cell else ""
            
            # Extract price
            price = extract_price(details_text)
            if not price:
                print(f"Skipping listing without price: {title}")
                continue
                
            # Extract year
            year = extract_year(details_text)
            
            # Extract model (chassis type)
            model = extract_model(details_text)
            
            # Extract additional info
            info_text = info_cell.get_text(strip=True) if info_cell else ""
            
            # Extract converter
            converter = extract_converter(info_text)
            
            # Extract slides
            slides = extract_slides(info_text)
            
            print(f"Processing listing: {title}, Price: {price}, Year: {year}, Converter: {converter}")
            
            # Download primary image
            featured_image = download_image(image_url)
            if not featured_image:
                print(f"No primary image for listing: {title}")
                featured_image = "/images/default_rv.jpg"  # Use default if needed
            
            # Get additional details from detail page if available
            detail_info = {}
            if detail_url:
                print(f"Fetching details for: {title}")
                detail_info = process_detail_page(detail_url)
                time.sleep(0.5)  # Be nice to the server
            
            # Create listing object
            listing = {
                "title": title,
                "description": detail_info.get("description", title),
                "price": price,
                "year": year,
                "manufacturer": "Prevost",  # Default for this website
                "converter": converter,
                "chassis_model": model,
                "slides": slides,
                "featured_image": featured_image,
                "additional_images": detail_info.get("additional_images", []),
                "detail_url": detail_url,
                "location": "United States"  # Default location
            }
            
            listings.append(listing)
            listing_count += 1
            print(f"Added listing: {year or 'N/A'} {converter or 'Unknown'} {model or 'N/A'} - ${price}")
            
            # Check if we've reached the maximum number of listings
            if listing_count >= max_listings:
                print(f"Reached maximum of {max_listings} listings")
                break
        
        # Also break from outer loop if we've reached the limit
        if listing_count >= max_listings:
            break
            
        # Be respectful of the server between tables
        time.sleep(0.5)
    
    return listings

def save_listings_to_json(listings, output_file=OUTPUT_FILE):
    """Save the scraped listings to a JSON file"""
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(listings, f, indent=2)
    print(f"Saved {len(listings)} listings to {output_file}")

def main():
    """Main function to run the scraper"""
    print("Starting Prevost Table Scraper...")
    listings = scrape_prevost_tables()
    
    if listings:
        save_listings_to_json(listings)
        print(f"Successfully scraped {len(listings)} listings")
    else:
        print("No listings found or processed")

if __name__ == "__main__":
    main()