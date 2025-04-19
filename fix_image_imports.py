#!/usr/bin/env python3
"""
Fix Image Imports

This script:
1. Connects to our database
2. Extracts 5 images per listing from our scraper images
3. Updates the database to store all 5 images instead of just 2 per listing
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse
import re

# Database connection string from environment variable
DATABASE_URL = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")


def get_db_connection():
    """Create a connection to the database."""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    conn.autocommit = True
    return conn


def get_all_downloaded_images():
    """Get all downloaded images in our images directory."""
    image_dir = "public/images/rv_listings"
    downloaded_images = {}
    pattern = re.compile(r'rv_(\d{4})_([^_]+)_(\d+)_')
    
    if os.path.isdir(image_dir):
        for filename in os.listdir(image_dir):
            if filename.startswith('rv_'):
                filepath = os.path.join(image_dir, filename)
                if os.path.isfile(filepath):
                    # Extract year, converter, image_index from filename using regex
                    match = pattern.search(filename)
                    if match:
                        year = match.group(1)
                        converter = match.group(2)
                        image_index = int(match.group(3))
                        
                        key = f"{year}_{converter}"
                        if key not in downloaded_images:
                            downloaded_images[key] = []
                        
                        web_path = f"/images/rv_listings/{filename}"
                        downloaded_images[key].append((image_index, web_path))
    
    # Sort images by index for each listing
    for key in downloaded_images:
        downloaded_images[key].sort()
    
    return downloaded_images


def get_listings_from_database():
    """Get all RV listings from the database."""
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT id, title, featured_image, year FROM rv_listings")
        listings = cur.fetchall()
    conn.close()
    return listings


def extract_year_converter(title):
    """Extract year and converter from a listing title."""
    # Extract year (first 4 digits in the title)
    year_match = re.search(r'(\d{4})', title)
    year = year_match.group(1) if year_match else None
    
    # Extract converter (usually the second word)
    title_parts = title.split()
    if len(title_parts) >= 2 and year_match:
        year_position = title_parts.index(year_match.group(0))
        if year_position + 1 < len(title_parts):
            converter = title_parts[year_position + 1]
            return year, converter
    
    return year, None


def update_listing_images(listing_id, images):
    """Update images for a listing in the database."""
    if not images:
        print(f"No images to update for listing ID {listing_id}")
        return
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Get existing images for this listing
            cur.execute("SELECT id, image_url FROM rv_images WHERE rv_id = %s", (listing_id,))
            existing_images = cur.fetchall()
            existing_urls = [img['image_url'] for img in existing_images]
            
            # Delete all existing images
            cur.execute("DELETE FROM rv_images WHERE rv_id = %s", (listing_id,))
            
            # Insert new images with proper is_primary flag
            for i, image_url in enumerate(images):
                is_primary = (i == 0)  # First image is primary
                cur.execute(
                    "INSERT INTO rv_images (rv_id, image_url, is_primary) VALUES (%s, %s, %s)",
                    (listing_id, image_url, is_primary)
                )
            
            # Update the featured_image to match the primary image
            cur.execute("UPDATE rv_listings SET featured_image = %s WHERE id = %s", 
                       (images[0], listing_id))
            
            print(f"Updated listing ID {listing_id} with {len(images)} images")
    except Exception as e:
        print(f"Error updating images for listing ID {listing_id}: {e}")
    finally:
        conn.close()


def main():
    # Get all downloaded images
    downloaded_images = get_all_downloaded_images()
    print(f"Found {sum(len(images) for images in downloaded_images.values())} downloaded images for {len(downloaded_images)} listings")
    
    # Get all listings from database
    listings = get_listings_from_database()
    print(f"Found {len(listings)} listings in database")
    
    # Update each listing with its images
    for listing in listings:
        listing_id = listing['id']
        title = listing['title']
        
        # Extract year and converter from title
        year, converter = extract_year_converter(title)
        
        if year and converter:
            key = f"{year}_{converter.lower()}"
            
            # Try variations of the key if exact match not found
            if key not in downloaded_images:
                for dk in downloaded_images.keys():
                    if year in dk and converter.lower() in dk.lower():
                        key = dk
                        break
            
            if key in downloaded_images:
                # Get up to 5 images for this listing
                image_paths = [img[1] for img in downloaded_images[key][:5]]
                if image_paths:
                    print(f"Updating listing {listing_id}: {title} with {len(image_paths)} images")
                    update_listing_images(listing_id, image_paths)
            else:
                print(f"No matching images found for listing {listing_id}: {title} (key: {key})")
        else:
            print(f"Could not extract year/converter from title: {title}")
    
    print("Done updating images")


if __name__ == "__main__":
    main()