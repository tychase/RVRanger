#!/usr/bin/env python3
"""
Improved RV Listing Import Script

This script:
1. Imports listings from the improved_prevost_listings.json file
2. Updates the database with converter and chassis information
3. Enhances existing RV listings with more detailed data
"""

import json
import os
import requests
import time
import psycopg2
from psycopg2.extras import RealDictCursor

# Try to load environment variables with python-dotenv if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("python-dotenv not installed, using environment variables as is")

# Configuration
INPUT_FILE = "improved_prevost_listings.json"
API_BASE_URL = "http://localhost:5000/api"
DATABASE_URL = os.getenv("DATABASE_URL")

# Connect to the database directly for bulk operations
def get_db_connection():
    """Create a connection to the database."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def load_listings_from_file(file_path=INPUT_FILE):
    """Load the listings from a JSON file."""
    if not os.path.exists(file_path):
        print(f"Error: File not found - {file_path}")
        return []
    
    with open(file_path, "r") as f:
        try:
            listings = json.load(f)
            print(f"Loaded {len(listings)} listings from {file_path}")
            return listings
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            return []

def ensure_manufacturer_exists(name, conn):
    """Ensure a manufacturer exists in the database, return its ID."""
    with conn.cursor() as cursor:
        # Check if manufacturer exists
        cursor.execute(
            "SELECT id FROM manufacturers WHERE name = %s",
            (name,)
        )
        result = cursor.fetchone()
        
        if result:
            return result["id"]
        
        # Create manufacturer if it doesn't exist
        cursor.execute(
            """
            INSERT INTO manufacturers (name, description, logo_url, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
            RETURNING id
            """,
            (name, f"{name} is a luxury RV manufacturer.", "")
        )
        conn.commit()
        result = cursor.fetchone()
        print(f"Created manufacturer: {name} (ID: {result['id']})")
        return result["id"]

def ensure_converter_exists(name, conn):
    """Ensure a converter exists in the database, return its ID."""
    if not name:
        return None
        
    with conn.cursor() as cursor:
        # Check if converter exists
        cursor.execute(
            "SELECT id FROM converters WHERE name = %s",
            (name,)
        )
        result = cursor.fetchone()
        
        if result:
            return result["id"]
        
        # Create converter if it doesn't exist
        cursor.execute(
            """
            INSERT INTO converters (name, description, logo_url, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
            RETURNING id
            """,
            (name, f"{name} is a luxury RV converter/customizer.", "")
        )
        conn.commit()
        result = cursor.fetchone()
        print(f"Created converter: {name} (ID: {result['id']})")
        return result["id"]

def ensure_chassis_type_exists(model, conn):
    """Ensure a chassis type exists in the database, return its ID."""
    if not model:
        return None
        
    with conn.cursor() as cursor:
        # Check if chassis type exists
        cursor.execute(
            "SELECT id FROM chassis_types WHERE name = %s",
            (model,)
        )
        result = cursor.fetchone()
        
        if result:
            return result["id"]
        
        # Create chassis type if it doesn't exist
        cursor.execute(
            """
            INSERT INTO chassis_types (name, description, created_at, updated_at)
            VALUES (%s, %s, NOW(), NOW())
            RETURNING id
            """,
            (model, f"{model} chassis model.")
        )
        conn.commit()
        result = cursor.fetchone()
        print(f"Created chassis type: {model} (ID: {result['id']})")
        return result["id"]

def ensure_rv_type_exists(conn):
    """Ensure the luxury coach RV type exists, return its ID."""
    with conn.cursor() as cursor:
        # Check if the luxury coach type exists
        cursor.execute(
            "SELECT id FROM rv_types WHERE name = %s",
            ("Luxury Coach",)
        )
        result = cursor.fetchone()
        
        if result:
            return result["id"]
        
        # Create the RV type if it doesn't exist
        cursor.execute(
            """
            INSERT INTO rv_types (name, description, image_url, created_at, updated_at)
            VALUES (%s, %s, %s, NOW(), NOW())
            RETURNING id
            """,
            ("Luxury Coach", "Premium luxury diesel pusher coaches.", "")
        )
        conn.commit()
        result = cursor.fetchone()
        print(f"Created RV type: Luxury Coach (ID: {result['id']})")
        return result["id"]

def find_existing_listing(title, conn):
    """Try to find an existing listing with the same title."""
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT id FROM rv_listings WHERE title = %s",
            (title,)
        )
        result = cursor.fetchone()
        return result["id"] if result else None

def import_listing_to_database(listing, conn, type_id, seller_id=1):
    """Import a listing to the database directly."""
    # Check if listing already exists with same title
    existing_id = find_existing_listing(listing.get("title"), conn)
    
    # Ensure manufacturer exists
    manufacturer_id = None
    if listing.get("manufacturer"):
        manufacturer_id = ensure_manufacturer_exists(listing["manufacturer"], conn)
    
    # Ensure converter exists if available
    converter_id = None
    if listing.get("converter"):
        converter_id = ensure_converter_exists(listing["converter"], conn)
    
    # Ensure chassis type exists if available
    chassis_type_id = None
    if listing.get("chassis_model"):
        chassis_type_id = ensure_chassis_type_exists(listing["chassis_model"], conn)
    
    if existing_id:
        # Update existing listing
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE rv_listings 
                SET 
                    description = %s,
                    year = %s,
                    price = %s,
                    mileage = %s,
                    length = %s,
                    slides = %s,
                    converter_id = %s,
                    chassis_type_id = %s,
                    featured_image = COALESCE(%s, featured_image),
                    is_featured = true,
                    updated_at = NOW()
                WHERE id = %s
                RETURNING id
                """,
                (
                    listing.get("description", ""),
                    listing.get("year"),
                    listing.get("price"),
                    listing.get("mileage"),
                    listing.get("length"),
                    listing.get("slides"),
                    converter_id,
                    chassis_type_id,
                    listing.get("featured_image"),
                    existing_id
                )
            )
            conn.commit()
            print(f"Updated existing listing: {listing.get('title')} (ID: {existing_id})")
            
            # Add additional images if any
            for image_url in listing.get("additional_images", []):
                cursor.execute(
                    """
                    INSERT INTO rv_images (rv_id, image_url, is_primary, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                    ON CONFLICT (rv_id, image_url) DO NOTHING
                    """,
                    (existing_id, image_url, False)
                )
            
            conn.commit()
            return existing_id
    else:
        # Create new listing
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO rv_listings (
                    title, description, year, price, mileage, length, slides,
                    manufacturer_id, type_id, converter_id, chassis_type_id,
                    featured_image, is_featured, seller_id, location, 
                    created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id
                """,
                (
                    listing.get("title", "Luxury RV Listing"),
                    listing.get("description", ""),
                    listing.get("year"),
                    listing.get("price"),
                    listing.get("mileage"),
                    listing.get("length"),
                    listing.get("slides"),
                    manufacturer_id,
                    type_id,
                    converter_id,
                    chassis_type_id,
                    listing.get("featured_image"),
                    True,  # Mark all imported listings as featured
                    seller_id,
                    listing.get("location", "United States")
                )
            )
            result = cursor.fetchone()
            rv_id = result["id"]
            
            # Import additional images
            for image_url in listing.get("additional_images", []):
                cursor.execute(
                    """
                    INSERT INTO rv_images (rv_id, image_url, is_primary, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                    """,
                    (rv_id, image_url, False)
                )
            
            # Import primary image as the first image
            if listing.get("featured_image"):
                cursor.execute(
                    """
                    INSERT INTO rv_images (rv_id, image_url, is_primary, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                    """,
                    (rv_id, listing.get("featured_image"), True)
                )
            
            conn.commit()
            print(f"Created new listing: {listing.get('title')} (ID: {rv_id})")
            return rv_id

def import_listings_to_database(listings):
    """Import listings to the database."""
    with get_db_connection() as conn:
        # Ensure we have the luxury coach RV type
        type_id = ensure_rv_type_exists(conn)
        
        # Import each listing
        imported_count = 0
        updated_count = 0
        error_count = 0
        
        for listing in listings:
            try:
                existing_id = find_existing_listing(listing.get("title"), conn)
                rv_id = import_listing_to_database(listing, conn, type_id)
                
                if existing_id:
                    updated_count += 1
                else:
                    imported_count += 1
                    
                # Add a small delay to avoid database contention
                time.sleep(0.1)
            except Exception as e:
                print(f"Error importing listing: {e}")
                error_count += 1
        
        return (imported_count, updated_count, error_count)

def main():
    """Main function."""
    print("Starting improved RV listing import...")
    listings = load_listings_from_file()
    
    if not listings:
        print("No listings to import. Please run the scraper first.")
        return
    
    print(f"Preparing to import/update {len(listings)} listings.")
    imported, updated, errors = import_listings_to_database(listings)
    
    print("\nImport summary:")
    print(f"New listings imported: {imported}")
    print(f"Existing listings updated: {updated}")
    print(f"Errors: {errors}")

if __name__ == "__main__":
    main()