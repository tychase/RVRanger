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
    
    # If it's a "Please Call For Pricing" message
    if "call" in text.lower() and "pricing" in text.lower():
        # Return a default price (we can adjust this)
        return 999999  # Placeholder price for "Call for pricing"
    
    # Find patterns like $ 1,234,567 or $1.2M or $950K
    # Note: The website uses "$ " with a space after the dollar sign
    price_match = re.search(r'\$\s*([0-9,]+(?:\.[0-9]+)?(?:K|M)?)', text)
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
    
    # Look for listing containers - typically a table or divs with listing content
    listings = []
    
    # Look specifically for price elements with the redprice class
    price_elements = soup.find_all(['span', 'p'], class_=['redprice', 'redprice1'])
    print(f"Found {len(price_elements)} price elements")
    
    for price_element in price_elements:
        # Get the price text
        price_text = price_element.get_text(strip=True)
        print(f"Price text: {price_text}")
        price = extract_price(price_text)
        
        if not price:
            print(f"  Failed to extract price from: {price_text}")
            continue
        else:
            print(f"  Extracted price: ${price:,}")
        
        # Find the parent container of the price element
        parent = price_element.parent
        
        # Look wider - find the closest div or p that might contain the listing description
        container = parent
        while container and container.name not in ('div', 'body'):
            container = container.parent
            
        # Get all text in the parent container
        description_text = parent.get_text(strip=True)
        print(f"  Raw description: {description_text}")
        
        # Try to find a better description in surrounding elements
        # Look at the previous sibling which often contains the description
        better_desc = None
        prev_sibling = price_element.find_previous_sibling(['p', 'div', 'span']) 
        if prev_sibling:
            better_desc = prev_sibling.get_text(strip=True)
            print(f"  Found previous sibling: {better_desc}")
            if better_desc and len(better_desc) > 20:  # It's probably a real description
                description_text = better_desc
                
        # If we still don't have a good description, look at surrounding paragraphs
        if not description_text or len(description_text) < 20:
            print("  Looking for better description in surrounding elements...")
            # Try to find a paragraph near the price element
            surrounding_paragraphs = []
            
            # Look at previous elements (likely to contain the model, year, etc.)
            for el in price_element.find_all_previous(['p']):
                text = el.get_text(strip=True)
                if text and len(text) > 20 and 'Prevost' in text:
                    surrounding_paragraphs.append(text)
                    print(f"  Found potential description: {text}")
                    
            # If we found potential descriptions, use the most detailed one
            if surrounding_paragraphs:
                # Sort by length and pick the longest one
                surrounding_paragraphs.sort(key=len, reverse=True)
                description_text = surrounding_paragraphs[0]
        
        # If we still don't have a description, use a generic one with the price
        if not description_text or len(description_text) < 5:
            description_text = f"Prevost Luxury Coach - Listed at ${price:,}. High-end luxury motorcoach built on the renowned Prevost chassis. Features premium amenities, spacious living areas, and top-of-the-line finishes. Ideal for luxury travel and full-time RV living."
            
        # Remove the price from the description
        if price_text in description_text:
            description_text = description_text.replace(price_text, '').strip()
            
        print(f"  Final description: {description_text}")
        
        # Find an image near this listing if available
        image_url = None
        img_tag = parent.find('img')
        if img_tag and 'src' in img_tag.attrs:
            image_url = urljoin(BASE_URL, img_tag['src'])
        else:
            # Try to find an image in a sibling or parent
            for sibling in parent.find_all_previous(['p', 'div']):
                img_tag = sibling.find('img')
                if img_tag and 'src' in img_tag.attrs:
                    image_url = urljoin(BASE_URL, img_tag['src'])
                    break
        
        # Extract details from description
        year = extract_year(description_text)
        mileage = extract_mileage(description_text)
        length = extract_length(description_text)
        slides = extract_slides(description_text)
        model = extract_model(description_text)
        
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
        is_featured = bool(image_url) and price > 500000
        
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


def extract_listing_from_cells(cells):
    """Extract listing data from table cells."""
    # Initialize variables
    image_url = None
    description_text = ""
    price_text = ""
    
    # First, look for the image
    for cell in cells:
        img_tag = cell.find('img')
        if img_tag and 'src' in img_tag.attrs:
            image_url = urljoin(BASE_URL, img_tag['src'])
            break
    
    # Next, look for text content in each cell
    for cell in cells:
        text = cell.get_text(strip=True)
        
        # Skip empty cells
        if not text:
            continue
            
        # Check if this cell contains a price
        if '$' in text and not price_text:
            price_text = text
        # Otherwise, add it to the description
        elif not description_text:
            description_text = text
        elif len(description_text) < len(text):
            # If we already have a description but this one is longer, use this one
            description_text = text
    
    # If we don't have a description or any text, return None
    if not description_text:
        return None
    
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
    
    return listing


def extract_listing_from_div(div):
    """Extract listing data from a div element."""
    # Initialize variables
    image_url = None
    description_text = ""
    price_text = ""
    
    # Look for image
    img_tag = div.find('img')
    if img_tag and 'src' in img_tag.attrs:
        image_url = urljoin(BASE_URL, img_tag['src'])
    
    # Look for price
    price_elem = div.find(['span', 'div', 'p'], class_=['price', 'cost', 'value'])
    if price_elem:
        price_text = price_elem.get_text(strip=True)
    else:
        # Try to find a price pattern in any text
        for elem in div.find_all(['span', 'div', 'p']):
            text = elem.get_text(strip=True)
            if '$' in text:
                price_text = text
                break
    
    # Look for description
    desc_elem = div.find(['span', 'div', 'p'], class_=['description', 'details', 'info'])
    if desc_elem:
        description_text = desc_elem.get_text(strip=True)
    else:
        # If no specific description element, use the whole div text
        description_text = div.get_text(strip=True)
        
        # If we have a price, make sure it's not just the price text
        if price_text and price_text in description_text:
            description_text = description_text.replace(price_text, '').strip()
    
    # If we don't have a description, return None
    if not description_text:
        return None
    
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
    
    return listing


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