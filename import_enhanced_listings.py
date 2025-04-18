#!/usr/bin/env python3
"""
Enhanced RV Listing Importer

This script:
1. Reads the enhanced Prevost listings from the JSON file
2. Imports them into the database using our existing schema
3. Handles manufacturers, types, and images
4. Creates relationships between converters and chassis models
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

def import_listing_to_database(listing, conn, type_id, seller_id=1):
    """Import a listing to the database directly."""
    # Ensure manufacturer exists - handle both camelCase and snake_case keys
    manufacturer_id = None
    if listing.get("manufacturer"):
        manufacturer_id = ensure_manufacturer_exists(listing["manufacturer"], conn)
    elif listing.get("manufacturerId"):
        # If we don't have a manufacturer name but have an ID, use a default name
        manufacturer_id = listing["manufacturerId"]
        print(f"Using provided manufacturerId: {manufacturer_id}")
    else:
        # Default to Prevost as manufacturer if none specified
        manufacturer_id = ensure_manufacturer_exists("Prevost", conn)
        print(f"No manufacturer info found, defaulting to Prevost (ID: {manufacturer_id})")
    
    # Ensure converter exists if available
    converter_id = None
    if listing.get("converter"):
        converter_id = ensure_converter_exists(listing["converter"], conn)
    
    # Ensure chassis type exists if available
    chassis_type_id = None
    if listing.get("chassis_model"):
        chassis_type_id = ensure_chassis_type_exists(listing["chassis_model"], conn)
    
    # Prepare the listing data
    with conn.cursor() as cursor:
        # Provide default location if not provided
        location = listing.get("location", "United States")
        
        # Ensure we have a price (required field)
        price = listing.get("price")
        if price is None:
            # Use a placeholder price for "Call for price" listings
            price = 999999
            print(f"No price found for listing '{listing.get('title')}', using placeholder price of ${price}")
        
        cursor.execute(
            """
            INSERT INTO rv_listings (
                title, description, year, price, mileage, length, slides,
                manufacturer_id, type_id, converter_id, chassis_type_id,
                featured_image, is_featured, seller_id, location, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id
            """,
            (
                listing.get("title", "Luxury RV Listing"),
                listing.get("description", ""),
                listing.get("year"),
                price,
                listing.get("mileage"),
                listing.get("length"),
                listing.get("slides"),
                manufacturer_id,
                type_id,
                converter_id,
                chassis_type_id,
                listing.get("featured_image", listing.get("featuredImage")),
                True,  # Mark all imported listings as featured
                seller_id,
                location
            )
        )
        conn.commit()
        result = cursor.fetchone()
        rv_id = result["id"]
        
        # Import additional images - handle both formats
        additional_images = listing.get("additional_images", listing.get("additionalImages", []))
        
        for img in additional_images:
            # Handle both simple string URLs and object format
            if isinstance(img, dict) and "imageUrl" in img:
                img_url = img["imageUrl"]
                is_primary = img.get("isPrimary", False)
            else:
                img_url = img
                is_primary = False
                
            cursor.execute(
                """
                INSERT INTO rv_images (rv_id, image_url, is_primary)
                VALUES (%s, %s, %s)
                """,
                (rv_id, img_url, is_primary)
            )
        
        # Import primary image as the first image
        featured_image = listing.get("featured_image", listing.get("featuredImage"))
        if featured_image:
            cursor.execute(
                """
                INSERT INTO rv_images (rv_id, image_url, is_primary)
                VALUES (%s, %s, %s)
                """,
                (rv_id, featured_image, True)
            )
        
        conn.commit()
        print(f"Imported listing: {listing.get('title')} (ID: {rv_id})")
        return rv_id

def import_listings_to_database(listings):
    """Import listings to the database."""
    with get_db_connection() as conn:
        # Ensure we have the luxury coach RV type
        type_id = ensure_rv_type_exists(conn)
        
        # Import each listing
        imported_count = 0
        error_count = 0
        
        for listing in listings:
            try:
                import_listing_to_database(listing, conn, type_id)
                imported_count += 1
                # Add a small delay to avoid database contention
                time.sleep(0.1)
            except Exception as e:
                print(f"Error importing listing: {e}")
                error_count += 1
        
        return (imported_count, error_count)

def main():
    """Main function."""
    print("Starting enhanced RV listing import...")
    listings = load_listings_from_file()
    
    if not listings:
        print("No listings to import. Please run the scraper first.")
        return
    
    print(f"Preparing to import {len(listings)} listings.")
    imported, errors = import_listings_to_database(listings)
    
    print("\nImport summary:")
    print(f"Successfully imported: {imported} listings")
    print(f"Errors: {errors} listings")

if __name__ == "__main__":
    main()