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
from bs4 import BeautifulSoup, Tag

# Base URL for the website
BASE_URL = "https://www.prevost-stuff.com"
# URL of the page with RV listings
LISTINGS_URL = f"{BASE_URL}/forsale/public_list_ads.php"

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
    
    # Common Prevost chassis models
    chassis_models = [
        'H3-45', 'X3-45', 'XLII', 'XL II', 'XL-II', 
        'H3', 'X3', 'H345', 'X345', 
        'Le Mirage', 'LeMirage'
    ]
    
    # Common converter models
    converter_models = [
        'Elegant Lady', 'Executive', 'Imperial', 'Marquis', 
        'Classic', 'Signature', 'Legacy', 'Royale'
    ]
    
    # First try exact chassis model matches with word boundaries
    for model in chassis_models:
        if re.search(r'\b' + re.escape(model) + r'\b', url_or_text, re.IGNORECASE):
            return model
    
    # Then try more flexible matches for chassis models
    for model in chassis_models:
        # Replace dashes and spaces for more flexible matching
        if model.replace('-', '').replace(' ', '') in url_or_text.replace('-', '').replace(' ', ''):
            return model
            
    # Try to find converter models (secondary)
    for model in converter_models:
        if re.search(r'\b' + re.escape(model) + r'\b', url_or_text, re.IGNORECASE):
            return model
    
    return None


def extract_converter(url_or_text):
    """Extract the converter/manufacturer from a URL or text."""
    if not url_or_text:
        return None
    
    # Common converters/manufacturers
    converters = [
        'Marathon', 'Liberty', 'Featherlite', 'Millennium', 'Emerald', 
        'Vogue', 'Newell', 'Prevost', 'Epic', 'Nashville', 'Country Coach',
        'Parliament', 'Executive', 'Angola', 'American Heritage', 
        'Foretravel', 'Newmar', 'Entegra', 'Tiffin', 'Monaco'
    ]
    
    # First try exact matches with word boundaries
    for converter in converters:
        if re.search(r'\b' + re.escape(converter) + r'\b', url_or_text, re.IGNORECASE):
            return converter
    
    # Then try more flexible matches
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
    
    # Extract the full title from the page
    full_title = ""
    
    # First try to find in headings (which might be present on some pages)
    headline_tag = soup.find("h2") or soup.find("h1")
    if headline_tag and headline_tag.get_text(strip=True):
        full_title = headline_tag.get_text(strip=True)
    
    # If not found, look for the typical div/p pattern
    if not full_title or "Prevost" not in full_title:
        # Look for divs or paragraphs containing a pattern like "2xxx Prevost [Converter] [Model]"
        title_pattern = re.compile(r"\d{4}\s+Prevost\s+\w+")
        
        for tag in soup.find_all(['div', 'p']):
            text = tag.get_text(strip=True)
            if title_pattern.search(text) and len(text) > 15 and len(text) < 100:
                # This looks like a title - it contains year, Prevost, and converter name
                full_title = text
                break
    
    # Save the title if found
    if full_title:
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


def scrape_listings(max_listings=5):
    """
    Scrape RV listings from prevost-stuff.com and return them as a list of dictionaries.
    
    Args:
        max_listings: Maximum number of listings to process (default: 5)
    
    Returns:
        List of listing dictionaries
    """
    print(f"Fetching listings from {LISTINGS_URL} (max: {max_listings} listings)...")
    
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
    
    # Limit the number of listings to process
    listing_links = listing_links[:max_listings]
    print(f"Processing {len(listing_links)} listings (limited by max_listings={max_listings})")
    
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
        url_filename = os.path.basename(link)
        year_match = re.search(r'^(\d{4})Prevost', title_part)
        
        if not year_match:
            print(f"Could not extract year from {title_part}")
            continue
            
        year = int(year_match.group(1))
        converter = extract_converter(title_part)
        model = extract_model(title_part)
        
        # Look for chassis in the URL itself
        # The 'H' or 'X' in the URL often indicates the chassis model
        if not model:
            chassis_match = re.search(r'Prevost([HX][^_]*)', url_filename)
            if chassis_match:
                chassis_code = chassis_match.group(1)
                # Check if it's one of the common chassis designations
                if chassis_code == 'H':
                    model = 'H3-45'
                elif chassis_code == 'X':
                    model = 'X3-45'
                elif chassis_code == 'XLII' or chassis_code == 'XL':
                    model = 'XLII'
                else:
                    # Use whatever was matched
                    model = chassis_code
        
        # Fetch detailed information from the listing page
        detailed_data = fetch_detailed_listing(link)
        
        # Download the main image and additional images
        main_image_path = None
        additional_images = []
        
        # First, find the main image
        if 'images' in detailed_data and detailed_data['images']:
            # Now using max 5 images per listing as requested
            image_count = 0
            for img_url in detailed_data['images'][:5]:  # Limit to 5 images
                local_path = download_image(img_url, f"rv_{year}_{converter or 'prevost'}_{image_count}")
                if local_path:
                    if not main_image_path:
                        # First image becomes the featured image
                        main_image_path = local_path
                    else:
                        # All other images become additional images
                        additional_images.append({
                            "imageUrl": local_path,
                            "isPrimary": False
                        })
                    image_count += 1
        
        # If no images found, try to get the preview image from the coach listing
        if not main_image_path:
            # Find image associated with this link on the main page
            link_element = soup.find('a', href=re.compile(os.path.basename(link)))
            if link_element:
                img_element = link_element.find('img')
                if img_element and hasattr(img_element, 'get') and img_element.get('src'):
                    img_src = img_element.get('src')
                    if img_src:
                        img_url = urljoin(BASE_URL, str(img_src))
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
        
        # Extract additional details from the description
        description = detailed_data.get('description', '')
        
        # Look for model names like "Elegant Lady" that should appear in the title
        # Separate from chassis models like H3-45
        elegant_lady_match = re.search(r'\bElegant\s+Lady\b', full_title + ' ' + description, re.IGNORECASE)
        if elegant_lady_match and 'Elegant Lady' not in clean_title:
            # Add "Elegant Lady" model name after the converter name
            # For example: "2009 Liberty" -> "2009 Liberty Elegant Lady"
            parts = clean_title.split()
            if len(parts) > 1:  # Make sure we have at least year and converter
                converter_index = 1  # Position after year
                clean_title = " ".join(parts[:converter_index+1] + ["Elegant Lady"] + parts[converter_index+1:])
            else:
                clean_title = f"{clean_title} Elegant Lady"
        
        # Check for chassis model in description if not already in title
        chassis_model = None
        
        # First check if we already have a model from URL extraction
        if model:
            chassis_model = model
        else:
            # Try to find chassis model in description
            for chassis in ['H3-45', 'X3-45', 'XLII', 'H3', 'X3']:
                # Look for the chassis model with word boundaries to avoid partial matches
                if re.search(r'\b' + re.escape(chassis) + r'\b', description, re.IGNORECASE):
                    chassis_model = chassis
                    break
        
        # Only add the chassis model if it's not already in the title
        if chassis_model and chassis_model not in clean_title:
            # Add chassis model to the title
            clean_title = f"{clean_title} {chassis_model}".strip()
        
        # Check for slides information
        slides_count = None
        
        # First check if we have slide information without proper spacing in the title
        # Pattern like "H3-45Double Slide" or "H3-45DoubleSlide" should be fixed to "H3-45 Double Slide"
        slide_spacing_fix = re.sub(r'(\w+)(Double|Single|Triple|Quad)(\s+)?Slide', r'\1 \2 Slide', clean_title)
        if slide_spacing_fix != clean_title:
            clean_title = slide_spacing_fix
        
        # Look for "Double Slide" in the full title (more accurate)
        double_slide_match = re.search(r'\bDouble\s+Slide\b', full_title, re.IGNORECASE) 
        if double_slide_match and 'slide' not in clean_title.lower():
            clean_title = f"{clean_title} Double Slide"
        else:
            # Try to find numeric slide count in description
            slides_match = re.search(r'\b(\d+)[- ]slide', description + ' ' + full_title, re.IGNORECASE)
            if slides_match:
                slides_count = slides_match.group(1)
                # Only add if not already in title
                if 'slide' not in clean_title.lower():
                    if slides_count == "1":
                        clean_title = f"{clean_title} Single Slide"
                    elif slides_count == "2":
                        clean_title = f"{clean_title} Double Slide"
                    elif slides_count == "3":
                        clean_title = f"{clean_title} Triple Slide"
                    elif slides_count == "4":
                        clean_title = f"{clean_title} Quad Slide"
                    else:
                        clean_title = f"{clean_title} {slides_count}-Slide"
        
        # Ensure year stays at the front if available
        if year:
            # Remove the year from the title if it's already there
            year_pattern = r"^" + str(year) + r"\s+"
            clean_title = re.sub(year_pattern, "", clean_title)
            # Add the year at the beginning
            clean_title = f"{year} {clean_title}"
            
        # Final cleanup to remove any duplicate information and normalize spacing
        # 1. Remove duplicate chassis model mentions
        for chassis in ['H3-45', 'X3-45', 'XLII']:
            # If the chassis appears twice, remove the second instance
            chassis_pattern = fr'({chassis})(.+?)\1'
            clean_title = re.sub(chassis_pattern, r'\1\2', clean_title, flags=re.IGNORECASE)
            
        # 2. Fix multiple spaces
        clean_title = ' '.join(clean_title.split())
        
        # 3. Add missing space between text and numbers
        clean_title = re.sub(r'([a-zA-Z])(\d)', r'\1 \2', clean_title)
        
        # 4. Fix the case of chassis models for consistency
        for chassis in ['H3-45', 'X3-45', 'XLII']:
            clean_title = re.sub(fr'\b{re.escape(chassis)}\b', chassis, clean_title, flags=re.IGNORECASE)
            
        # 5. Fix specific spacing problems
        # Fix "H 3-45" to "H3-45"
        clean_title = re.sub(r'H\s+3-45', 'H3-45', clean_title)
        clean_title = re.sub(r'X\s+3-45', 'X3-45', clean_title)
        
        # 6. Fix "XLIINon Slide" to "XLII Non Slide"
        clean_title = re.sub(r'XLII(\w+)', r'XLII \1', clean_title)
        
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