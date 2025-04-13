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
BASE_URL = "https://prevost-stuff.com"
# URL of the page with RV listings
LISTINGS_URL = f"{BASE_URL}/used_coaches.htm"

# Default manufacturer ID for Prevost
PREVOST_MANUFACTURER_ID = 1
# Default RV type ID for Class A Motorhomes
CLASS_A_TYPE_ID = 1

def extract_price(text):
    """Extract price from text using regex."""
    if not text:
        return None
    
    # Find patterns like $1,234,567 or $1.2M or $950K
    price_match = re.search(r'\$\s*([0-9,.]+(?:\.[0-9]+)?(?:K|M)?)', text)
    if not price_match:
        return None
    
    price_text = price_match.group(1).strip()
    
    # Handle K (thousands) and M (millions) notation
    if 'K' in price_text:
        price_value = float(price_text.replace('K', '').replace(',', '')) * 1000
    elif 'M' in price_text:
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
    length_match = re.search(r'([0-9]+)[\s-]*(?:foot|ft|\'|feet)', text, re.IGNORECASE)
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

def extract_description(element):
    """
    Extract a clean description from an HTML element.
    Removes unnecessary whitespace and formatting.
    """
    if not element:
        return ""
    
    # Get all text from the element
    full_text = element.get_text(separator=' ', strip=True)
    
    # Replace multiple spaces with a single space
    cleaned_text = re.sub(r'\s+', ' ', full_text).strip()
    
    return cleaned_text

def get_listing_sections(soup):
    """
    Identifies and returns sections of the page that contain listings.
    Each section will likely be a container with an RV listing.
    """
    sections = []
    
    # Look for price elements with redprice class (these are usually part of listings)
    price_elements = soup.find_all(['span', 'p', 'div'], class_=['redprice', 'redprice1'])
    print(f"Found {len(price_elements)} price elements")
    
    for price_elem in price_elements:
        # Find the parent container which should contain the complete listing
        parent = price_elem.parent
        if parent:
            # Only add unique parents to avoid duplicates
            if parent not in sections:
                sections.append(parent)
    
    return sections

def parse_listing(section):
    """
    Parse a listing section and extract relevant details.
    """
    # Initialize an empty listing
    listing = {
        "manufacturerId": PREVOST_MANUFACTURER_ID,
        "typeId": CLASS_A_TYPE_ID,
        "sellerId": 1,  # Default seller ID
        "make": "Prevost",
        "fuelType": "Diesel",  # All Prevost RVs are diesel
    }
    
    # Extract price from redprice elements
    price_elem = section.find(['span', 'p', 'div'], class_=['redprice', 'redprice1'])
    if price_elem:
        price_text = price_elem.get_text(strip=True)
        price = extract_price(price_text)
        if price:
            listing["price"] = price
    
    # Get full description text from the section
    description_text = extract_description(section)
    if description_text:
        listing["description"] = description_text
    
    # Find images - both the primary image and any additional images
    images = []
    img_tags = section.find_all('img')
    
    for img_tag in img_tags:
        if 'src' in img_tag.attrs:
            image_url = urljoin(BASE_URL, img_tag['src'])
            # Avoid tiny images like icons, buttons, etc.
            if not ('icon' in image_url.lower() or 'button' in image_url.lower()):
                images.append(image_url)
    
    # Set the featured image to the first image if available
    if images:
        listing["featuredImage"] = images[0]
        
        # Store additional images in a separate field
        if len(images) > 1:
            listing["additionalImages"] = images[1:]
    
    # Extract various details from the description
    if "description" in listing:
        year = extract_year(listing["description"])
        if year:
            listing["year"] = year
        
        mileage = extract_mileage(listing["description"])
        if mileage:
            listing["mileage"] = mileage
        
        length = extract_length(listing["description"])
        if length:
            listing["length"] = length
        
        slides = extract_slides(listing["description"])
        if slides:
            listing["slides"] = slides
        
        model = extract_model(listing["description"])
        if model:
            listing["model"] = model
        
        # Extract location if available
        location_match = re.search(r'(located|location)[:\s]*(.*?)[\.\(\)]', listing["description"], re.IGNORECASE)
        if location_match:
            listing["location"] = location_match.group(2).strip()
        else:
            listing["location"] = "Unknown"
    
    # Generate a title if we have year or model information
    title_parts = []
    if "year" in listing:
        title_parts.append(str(listing["year"]))
    if "model" in listing:
        title_parts.append(listing["model"])
    title_parts.append("Prevost")
    
    if title_parts:
        listing["title"] = " ".join(title_parts)
    else:
        listing["title"] = "Prevost RV"
    
    # Set featured flag based on price (top-tier RVs are usually more expensive)
    if "price" in listing and listing["price"] > 500000:
        listing["isFeatured"] = True
    else:
        listing["isFeatured"] = False
    
    return listing

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
    
    # Get sections that contain listings
    listing_sections = get_listing_sections(soup)
    print(f"Found {len(listing_sections)} potential listing sections")
    
    # Parse each section to extract listing details
    listings = []
    for i, section in enumerate(listing_sections):
        print(f"Processing listing {i+1}/{len(listing_sections)}...")
        listing = parse_listing(section)
        
        # Only include listings that have at least a title and price
        if "title" in listing and "price" in listing:
            listings.append(listing)
    
    print(f"Successfully extracted {len(listings)} complete listings")
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