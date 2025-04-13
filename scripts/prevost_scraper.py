#!/usr/bin/env python3
"""
Prevost RV Listings Scraper

This script scrapes RV listings from prevost-stuff.com and outputs them in JSON format
suitable for insertion into a PostgreSQL database.
"""

import json
import re
import sys
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# Base URL for the website
BASE_URL = "https://www.prevost-stuff.com"
# URL of the page with RV listings
LISTINGS_URL = f"{BASE_URL}/prevost_sale.htm"

# Default manufacturer ID for Prevost
PREVOST_MANUFACTURER_ID = 1
# Default RV type ID for Class A Motorhomes
CLASS_A_TYPE_ID = 1


def extract_price(text):
    """Extract price from text using regex."""
    if not text:
        return None
    
    # Find patterns like $1,234,567 or $1.2M or $950K
    price_match = re.search(r'\$([0-9,]+(?:\.[0-9]+)?(?:K|M)?)', text)
    if not price_match:
        return None
    
    price_text = price_match.group(1)
    
    # Handle K (thousands) and M (millions) notation
    if price_text.endswith('K'):
        price_value = float(price_text.replace('K', '').replace(',', '')) * 1000
    elif price_text.endswith('M'):
        price_value = float(price_text.replace('M', '').replace(',', '')) * 1000000
    else:
        price_value = float(price_text.replace(',', ''))
    
    return int(price_value)


def extract_year(text):
    """Extract year from text using regex."""
    if not text:
        return None
    
    # Find patterns like 2022 or '22
    year_match = re.search(r'\b(20[0-2][0-9])\b|\b\'([0-2][0-9])\b', text)
    if not year_match:
        return None
    
    if year_match.group(1):  # Full year format (2022)
        return int(year_match.group(1))
    else:  # Short year format ('22)
        short_year = int(year_match.group(2))
        return 2000 + short_year


def extract_mileage(text):
    """Extract mileage from text using regex."""
    if not text:
        return None
    
    # Find patterns like 12,345 miles or 12K miles
    mileage_match = re.search(r'([0-9,]+(?:\.[0-9]+)?(?:K|k)?)[\s-]*miles', text, re.IGNORECASE)
    if not mileage_match:
        return None
    
    mileage_text = mileage_match.group(1)
    
    # Handle K notation
    if 'K' in mileage_text or 'k' in mileage_text:
        mileage_value = float(mileage_text.lower().replace('k', '').replace(',', '')) * 1000
    else:
        mileage_value = float(mileage_text.replace(',', ''))
    
    return int(mileage_value)


def extract_length(text):
    """Extract the length of the RV in feet."""
    if not text:
        return None
    
    # Find patterns like 45 foot or 45'
    length_match = re.search(r'([0-9]+)[\s-]*(?:foot|ft|\')', text, re.IGNORECASE)
    if not length_match:
        return None
    
    return int(length_match.group(1))


def extract_slides(text):
    """Extract number of slides from text."""
    if not text:
        return None
    
    # Find patterns like 4 slides or 4-slide
    slides_match = re.search(r'([0-9])[\s-]*slides?', text, re.IGNORECASE)
    if not slides_match:
        return None
    
    return int(slides_match.group(1))


def extract_model(text):
    """Extract the Prevost model from text."""
    if not text:
        return None
    
    # Common Prevost models
    models = ['H3-45', 'X3-45', 'XLII', 'XL II', 'Le Mirage', 'Liberty', 'Marathon', 'Featherlite']
    
    for model in models:
        if model.lower() in text.lower():
            return model
    
    return None


def scrape_listings():
    """
    Scrape RV listings from prevost-stuff.com and return them as a list of dictionaries.
    """
    print(f"Fetching listings from {LISTINGS_URL}...")
    
    try:
        response = requests.get(LISTINGS_URL)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching the listings page: {e}", file=sys.stderr)
        return []
    
    soup = BeautifulSoup(response.text, 'lxml')
    
    # The main table contains the listings
    listings_table = soup.find('table', {'width': '700'})
    if not listings_table:
        print("Could not find the listings table on the page", file=sys.stderr)
        return []
    
    listings = []
    
    # Each listing is typically in a row with multiple cells
    rows = listings_table.find_all('tr')
    
    for i, row in enumerate(rows):
        # Skip header rows
        if i < 2:
            continue
        
        cells = row.find_all('td')
        if len(cells) < 3:
            continue
        
        # Extract the image if available
        image_cell = cells[0]
        image_tag = image_cell.find('img')
        if image_tag and 'src' in image_tag.attrs:
            image_url = urljoin(BASE_URL, image_tag['src'])
        else:
            image_url = None
        
        # The description is usually in the second cell
        description_cell = cells[1]
        description_text = description_cell.get_text(strip=True)
        
        # The price is usually in the third cell
        price_cell = cells[2]
        price_text = price_cell.get_text(strip=True)
        
        # Check if there's valid content
        if not description_text and not price_text:
            continue
        
        # Get additional details from the description text
        year = extract_year(description_text)
        mileage = extract_mileage(description_text)
        length = extract_length(description_text)
        slides = extract_slides(description_text)
        model = extract_model(description_text)
        price = extract_price(price_text) or extract_price(description_text)
        
        # Create a title from the description
        title_parts = []
        if year:
            title_parts.append(str(year))
        if model:
            title_parts.append(model)
        title_parts.append("Prevost")
        if not title_parts:
            title = "Prevost RV"
        else:
            title = " ".join(title_parts)
        
        # Extract location if available
        location_match = re.search(r'(located|location)[:\s]*(.*?)[\.\(\)]', description_text, re.IGNORECASE)
        location = location_match.group(2).strip() if location_match else "Unknown"
        
        # Check if it's a featured listing (arbitrary criteria)
        is_featured = bool(image_url) and price and price > 500000
        
        # Create the listing dictionary
        listing = {
            "title": title,
            "description": description_text,
            "price": price,
            "year": year,
            "make": "Prevost",
            "model": model,
            "length": length,
            "mileage": mileage,
            "manufacturerId": PREVOST_MANUFACTURER_ID,
            "typeId": CLASS_A_TYPE_ID,
            "location": location,
            "featuredImage": image_url,
            "slides": slides,
            "fuelType": "Diesel",  # All Prevost RVs are diesel
            "isFeatured": is_featured,
            # Field required for database insertion but not available from scraping
            "sellerId": 1  # Default seller ID, to be replaced later if needed
        }
        
        # Filter out None values
        listing = {k: v for k, v in listing.items() if v is not None}
        
        listings.append(listing)
    
    print(f"Found {len(listings)} listings")
    return listings


def save_listings_to_json(listings, output_file='prevost_listings.json'):
    """Save the listings to a JSON file."""
    try:
        with open(output_file, 'w') as f:
            json.dump(listings, f, indent=2)
        print(f"Saved {len(listings)} listings to {output_file}")
    except IOError as e:
        print(f"Error saving to {output_file}: {e}", file=sys.stderr)


def main():
    """Main function."""
    listings = scrape_listings()
    
    if listings:
        save_listings_to_json(listings)
        
        # Print summary statistics
        prices = [listing['price'] for listing in listings if 'price' in listing]
        if prices:
            avg_price = sum(prices) / len(prices)
            print(f"Average price: ${avg_price:,.2f}")
            print(f"Price range: ${min(prices):,} - ${max(prices):,}")
        
        years = [listing['year'] for listing in listings if 'year' in listing]
        if years:
            print(f"Year range: {min(years)} - {max(years)}")
        
        # Print the first listing as an example
        if listings:
            print("\nExample listing:")
            print(json.dumps(listings[0], indent=2))
    else:
        print("No listings found.")


if __name__ == "__main__":
    main()