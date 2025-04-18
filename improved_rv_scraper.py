#!/usr/bin/env python3
"""
Improved Prevost RV Listings Scraper

This script scrapes RV listings from prevost-stuff.com and downloads actual images
of the RVs to provide accurate visual representation of each listing.
"""

import json
import os
import re
import sys
import time
from urllib.parse import urljoin
import uuid

import requests
from bs4 import BeautifulSoup

# Base URL for the website
BASE_URL = "https://www.prevost-stuff.com"
# URL of the page with RV listings
LISTINGS_URL = f"{BASE_URL}/used_coaches.htm"

# Directory to save downloaded images
IMAGE_DIR = "public/images/rv_listings"

# Default manufacturer ID for Prevost
PREVOST_MANUFACTURER_ID = 1
# Default RV type ID for Class A Motorhomes
CLASS_A_TYPE_ID = 1

# Ensure the image directory exists
os.makedirs(IMAGE_DIR, exist_ok=True)


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


def extract_model(url_or_text):
    """Extract the Prevost model from a URL or text."""
    if not url_or_text:
        return None
    
    # Common Prevost models to look for
    models = ['H3-45', 'X3-45', 'X3', 'H3', 'XLII', 'XL II', 'Le Mirage']
    
    for model in models:
        if model.replace('-', '') in url_or_text.replace('-', ''):
            return model
    
    return None


def extract_converter(url_or_text):
    """Extract the converter/manufacturer from a URL or text."""
    if not url_or_text:
        return None
    
    # Common converters/manufacturers
    converters = [
        'Marathon', 'Liberty', 'Featherlite', 'Millennium', 'Emerald', 
        'Vogue', 'Newell', 'Prevost', 'Epic', 'Nashville', 'Country Coach'
    ]
    
    for converter in converters:
        if converter.lower() in url_or_text.lower():
            return converter
    
    return None


def download_image(image_url, prefix="rv", max_retries=3):
    """
    Download an image from a URL and save it to the image directory.
    Returns the local path to the saved image.
    
    Args:
        image_url: The URL of the image to download
        prefix: Prefix for the saved filename
        max_retries: Maximum number of retry attempts
        
    Returns:
        String with web-accessible path if successful, None otherwise
    """
    # Clean URL first (remove query parameters)
    clean_url = image_url.split('?')[0]
    
    # Setup headers to mimic a browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': BASE_URL,
    }
    
    # Retry logic
    for attempt in range(max_retries):
        try:
            print(f"Downloading image from {clean_url} (attempt {attempt+1}/{max_retries})")
            response = requests.get(clean_url, headers=headers, timeout=15, stream=True)
            response.raise_for_status()
            
            # Check if the content type is an image
            content_type = response.headers.get('Content-Type', '')
            if not content_type.startswith('image/'):
                print(f"Warning: URL does not point to an image. Content-Type: {content_type}")
                # Still proceed, as some servers may not set the correct content type
            
            # Determine file extension based on content type or URL
            if 'image/jpeg' in content_type or 'image/jpg' in content_type:
                image_extension = '.jpg'
            elif 'image/png' in content_type:
                image_extension = '.png'
            elif 'image/webp' in content_type:
                image_extension = '.webp'
            elif 'image/gif' in content_type:
                image_extension = '.gif'
            else:
                # Extract from URL as fallback
                image_extension = os.path.splitext(clean_url)[-1].lower()
                # Validate extension to prevent unusual ones
                if not image_extension or len(image_extension) > 5 or image_extension not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
                    image_extension = '.jpg'  # Default to jpg for invalid extensions
            
            # Generate a safe, web-accessible filename
            filename = f"{prefix}_{uuid.uuid4().hex}{image_extension}"
            local_path = os.path.join(IMAGE_DIR, filename)
            
            # Save the image with streaming to handle large files better
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Verify the file exists and is not empty
            if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
                print(f"Successfully downloaded image to {local_path}")
                # Return a web-accessible path
                return f"/images/rv_listings/{filename}"
            else:
                print(f"Downloaded file is empty or missing: {local_path}")
                if attempt < max_retries - 1:
                    print(f"Retrying download...")
                    continue
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Network error downloading image {clean_url}: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying download after error...")
                time.sleep(2)  # Add a delay before retrying
            else:
                print(f"Max retries reached. Failed to download image.")
                return None
        except Exception as e:
            print(f"Unexpected error downloading image {clean_url}: {e}")
            return None
    
    return None


def fetch_detailed_listing(listing_url):
    """
    Fetch the detailed page for a listing and extract additional information and images.
    """
    print(f"Fetching detailed listing from {listing_url}")
    
    # Setup headers to mimic a browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': BASE_URL,
    }
    
    try:
        response = requests.get(listing_url, headers=headers, timeout=15)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"RequestException fetching detailed listing: {e}")
        return {}
    except Exception as e:
        print(f"Unexpected error fetching detailed listing: {e}")
        return {}
    
    soup = BeautifulSoup(response.text, 'lxml')
    
    # Initialize data
    listing_data = {}
    images = []
    
    # Extract the full title from the page (usually in a heading element)
    full_title = ""
    headline_tag = soup.find("h2") or soup.find("h1")
    if headline_tag:
        full_title = headline_tag.get_text(strip=True)
        listing_data['full_title'] = full_title
    
    # Look for all images on the page
    for img in soup.find_all('img'):
        src = img.get('src')
        # Skip tiny images, navigation elements, etc.
        if src and not src.endswith(('.png', '.gif', 'logo', 'banner')):
            full_url = urljoin(listing_url, src)
            images.append(full_url)
    
    # Look for additional details
    description = ""
    
    # Find the detailed description
    for p in soup.find_all(['p', 'div'], class_=['blackname', 'Descrip21']):
        text = p.get_text(strip=True)
        if len(text) > 20:  # Only consider substantial paragraphs
            description += text + " "
    
    # Find price information
    price = None
    for p in soup.find_all(['p', 'span'], class_=['redprice', 'redprice1']):
        price_text = p.get_text(strip=True)
        extracted_price = extract_price(price_text)
        if extracted_price:
            price = extracted_price
            break
    
    # Find the year and model
    year_model_match = re.search(r'([0-9]{4})\s+Prevost\s+([^\s]+)', response.text)
    if year_model_match:
        listing_data['year'] = int(year_model_match.group(1))
        model = year_model_match.group(2)
        if model:
            listing_data['model'] = model
    
    # Update the listing data
    if description:
        listing_data['description'] = description
    if price:
        listing_data['price'] = price
    
    # Add the images
    listing_data['images'] = images
    
    return listing_data


def scrape_listings():
    """
    Scrape RV listings from prevost-stuff.com and return them as a list of dictionaries.
    """
    print(f"Fetching listings from {LISTINGS_URL}...")
    
    # Setup headers to mimic a browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    
    try:
        response = requests.get(LISTINGS_URL, headers=headers, timeout=15)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching the listings page: {e}", file=sys.stderr)
        return []
    
    soup = BeautifulSoup(response.text, 'lxml')
    
    listings = []
    
    # Find all listing links
    listing_links = []
    
    # Look for links to detailed coach pages
    pattern = re.compile(r'.*Prevost.*\.html$')
    for link in soup.find_all('a', href=pattern):
        href = link.get('href')
        if href and 'Prevost' in href:
            full_url = urljoin(BASE_URL, href)
            if full_url not in listing_links:
                listing_links.append(full_url)
    
    print(f"Found {len(listing_links)} potential listing links")
    
    # Process each listing link
    for idx, link in enumerate(listing_links):
        print(f"Processing listing {idx+1}/{len(listing_links)}: {link}")
        
        # Extract basic info from the URL
        url_parts = os.path.basename(link).split('_')
        
        if len(url_parts) < 2:
            print(f"Skipping URL with unexpected format: {link}")
            continue
        
        # Extract what we can from the URL
        title_part = url_parts[0]
        year_match = re.search(r'^(\d{4})Prevost', title_part)
        
        if not year_match:
            print(f"Could not extract year from {title_part}")
            continue
            
        year = int(year_match.group(1))
        converter = extract_converter(title_part)
        model = extract_model(title_part)
        
        # Fetch detailed information from the listing page
        detailed_data = fetch_detailed_listing(link)
        
        # Download the main image and additional images
        main_image_path = None
        additional_images = []
        
        # First, find the main image
        if 'images' in detailed_data and detailed_data['images']:
            for img_url in detailed_data['images']:
                local_path = download_image(img_url, f"rv_{year}_{converter or 'prevost'}_{len(additional_images)}")
                if local_path:
                    if not main_image_path:
                        main_image_path = local_path
                    else:
                        additional_images.append({
                            "imageUrl": local_path,
                            "isPrimary": False
                        })
        
        # If no images found, try to get the preview image from the coach listing
        if not main_image_path:
            # Find image associated with this link on the main page
            link_element = soup.find('a', href=re.compile(os.path.basename(link)))
            if link_element:
                img_element = link_element.find('img')
                if img_element and img_element.has_attr('src'):
                    img_url = urljoin(BASE_URL, img_element['src'])
                    main_image_path = download_image(img_url, f"rv_{year}_{converter or 'prevost'}_main")
        
        # If we still don't have a main image, try a fallback
        if not main_image_path:
            print(f"No images found for {link}")
            # We'll rely on a fallback in the frontend
        
        # Clean and format the title
        full_title = detailed_data.get('full_title', '')
        
        # If we have a full title from the detail page, use it; otherwise, construct one
        if full_title:
            # Remove "Prevost" from the title
            clean_title = re.sub(r"\bPrevost\b", "", full_title, flags=re.IGNORECASE)
            # Collapse extra whitespace
            clean_title = " ".join(clean_title.split())
        else:
            # Construct from parts
            clean_title = f"{year} {converter or ''} {model or ''}".strip()
        
        # Ensure year stays at the front if available
        if year:
            # Remove the year from the title if it's already there
            year_pattern = r"^" + str(year) + r"\s+"
            clean_title = re.sub(year_pattern, "", clean_title)
            # Add the year at the beginning
            clean_title = f"{year} {clean_title}"
        
        # Final title should be in the format "2009 Liberty Elegant Lady H3-45 Double Slide"
        # Merge all the information
        listing = {
            "title": clean_title,
            "description": detailed_data.get('description', f"Luxury {year} Prevost coach."),
            "price": detailed_data.get('price'),
            "year": year,
            "manufacturerId": PREVOST_MANUFACTURER_ID,
            "typeId": CLASS_A_TYPE_ID,
            "location": "Unknown",
            "featuredImage": main_image_path,
            "fuelType": "Diesel",  # All Prevost RVs are diesel
            "isFeatured": True,  # Make all detailed listings featured
            "sellerId": 1,  # Default seller ID, to be replaced later if needed
            "additionalImages": additional_images
        }
        
        # Filter out None values
        listing = {k: v for k, v in listing.items() if v is not None}
        
        # Add to our listings array
        listings.append(listing)
        
        # Add a small delay to avoid overloading the server
        time.sleep(1)
    
    print(f"Found {len(listings)} listings with details")
    return listings


def save_listings_to_json(listings, output_file='improved_prevost_listings.json'):
    """Save the listings to a JSON file."""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(listings, f, indent=2)
    print(f"Saved {len(listings)} listings to {output_file}")


def main():
    """Main function."""
    listings = scrape_listings()
    
    if listings:
        save_listings_to_json(listings)
        print("Scraping completed successfully!")
    else:
        print("No listings found!")


if __name__ == "__main__":
    main()