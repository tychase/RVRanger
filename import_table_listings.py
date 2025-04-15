#!/usr/bin/env python3
"""
Import Script for Table Listings

This script:
1. Imports scraped data from prevost_table_listings.json
2. Handles converter and chassis type associations
3. Updates the database with enhanced RV information
"""

import json
import os
import time
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuration
INPUT_FILE = "prevost_table_listings.json"
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
    if not name:
        return None
        
    with conn.cursor() as cursor:
        # Check if manufacturer exists
        cursor.execute(
            "SELECT id FROM manufacturers WHERE name = %s",
            (name,)
        )
        result = cursor.fetchone()
        
        if result:
            return result["id"]
        
        # Check table structure first to see available columns
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'manufacturers'")
        columns = [col['column_name'] for col in cursor.fetchall()]
        
        # Create manufacturer if it doesn't exist
        if 'created_at' in columns and 'updated_at' in columns:
            # Table has timestamp columns
            cursor.execute(
                """
                INSERT INTO manufacturers (name, description, logo_url, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
                RETURNING id
                """,
                (name, f"{name} is a luxury RV manufacturer.", "")
            )
        else:
            # Table doesn't have timestamp columns
            cursor.execute(
                """
                INSERT INTO manufacturers (name, description, logo_url)
                VALUES (%s, %s, %s)
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
        
        # Check table structure first to see available columns
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'converters'")
        columns = [col['column_name'] for col in cursor.fetchall()]
        
        # Create converter if it doesn't exist
        if 'created_at' in columns and 'updated_at' in columns:
            # Table has timestamp columns
            cursor.execute(
                """
                INSERT INTO converters (name, description, logo_url, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
                RETURNING id
                """,
                (name, f"{name} is a luxury RV converter/customizer.", "")
            )
        else:
            # Table doesn't have timestamp columns
            cursor.execute(
                """
                INSERT INTO converters (name, description, logo_url)
                VALUES (%s, %s, %s)
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
        
    # Clean up the chassis model string if it has a trailing dash
    if model and model.endswith('-'):
        model = model[:-1]
        
    with conn.cursor() as cursor:
        # Check if chassis type exists
        cursor.execute(
            "SELECT id FROM chassis_types WHERE name = %s",
            (model,)
        )
        result = cursor.fetchone()
        
        if result:
            return result["id"]
        
        # Check table structure first to see available columns
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'chassis_types'")
        columns = [col['column_name'] for col in cursor.fetchall()]
        
        # Create chassis type if it doesn't exist
        if 'created_at' in columns and 'updated_at' in columns:
            # Table has timestamp columns
            cursor.execute(
                """
                INSERT INTO chassis_types (name, description, created_at, updated_at)
                VALUES (%s, %s, NOW(), NOW())
                RETURNING id
                """,
                (model, f"{model} chassis model.")
            )
        else:
            # Table doesn't have timestamp columns
            cursor.execute(
                """
                INSERT INTO chassis_types (name, description)
                VALUES (%s, %s)
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
        # Check table structure first to see available columns
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'rv_types'")
        columns = [col['column_name'] for col in cursor.fetchall()]
        
        if 'created_at' in columns and 'updated_at' in columns:
            # Table has timestamp columns
            cursor.execute(
                """
                INSERT INTO rv_types (name, description, image_url, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
                RETURNING id
                """,
                ("Luxury Coach", "Premium luxury diesel pusher coaches.", "")
            )
        else:
            # Table doesn't have timestamp columns
            cursor.execute(
                """
                INSERT INTO rv_types (name, description, image_url)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                ("Luxury Coach", "Premium luxury diesel pusher coaches.", "")
            )
            
        conn.commit()
        result = cursor.fetchone()
        print(f"Created RV type: Luxury Coach (ID: {result['id']})")
        return result["id"]

def clean_listing_data(listing):
    """Clean and prepare listing data for database import."""
    # Generate title if missing
    if not listing.get("title"):
        title_parts = []
        if listing.get("year"):
            title_parts.append(str(listing.get("year")))
        if listing.get("manufacturer"):
            title_parts.append(listing.get("manufacturer"))
        if listing.get("converter"):
            title_parts.append(listing.get("converter"))
        if listing.get("chassis_model"):
            title_parts.append(listing.get("chassis_model"))
            
        if title_parts:
            listing["title"] = " ".join(title_parts)
        else:
            listing["title"] = "Luxury RV Coach"
    
    # Generate description if missing
    if not listing.get("description"):
        description_parts = []
        if listing.get("year"):
            description_parts.append(f"Year: {listing.get('year')}")
        if listing.get("manufacturer"):
            description_parts.append(f"Manufacturer: {listing.get('manufacturer')}")
        if listing.get("converter"):
            description_parts.append(f"Converter: {listing.get('converter')}")
        if listing.get("chassis_model"):
            description_parts.append(f"Chassis Model: {listing.get('chassis_model')}")
        if listing.get("slides"):
            description_parts.append(f"Slides: {listing.get('slides')}")
        if listing.get("price"):
            description_parts.append(f"Price: ${listing.get('price'):,}")
            
        if description_parts:
            listing["description"] = " | ".join(description_parts)
        else:
            listing["description"] = "Luxury RV coach for sale."
    
    # Set default location if missing
    if not listing.get("location"):
        listing["location"] = "United States"
        
    return listing

def import_listing_to_database(listing, conn, type_id, seller_id=1):
    """Import a listing to the database."""
    # Clean and prepare the listing data
    listing = clean_listing_data(listing)
    
    # Ensure entities exist
    manufacturer_id = ensure_manufacturer_exists(listing.get("manufacturer"), conn)
    converter_id = ensure_converter_exists(listing.get("converter"), conn)
    
    # Clean up chassis model if it ends with a dash
    chassis_model = listing.get("chassis_model")
    if chassis_model and chassis_model.endswith('-'):
        chassis_model = chassis_model[:-1]
        
    chassis_type_id = ensure_chassis_type_exists(chassis_model, conn)
    
    with conn.cursor() as cursor:
        # Check rv_listings table structure
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'rv_listings'")
        rv_columns = [col['column_name'] for col in cursor.fetchall()]
        
        # Create the RV listing using the appropriate columns
        if 'created_at' in rv_columns and 'updated_at' in rv_columns:
            # Table has timestamp columns
            cursor.execute(
                """
                INSERT INTO rv_listings (
                    title, description, year, price, manufacturer_id, type_id, 
                    converter_id, chassis_type_id, slides, featured_image, 
                    location, is_featured, seller_id, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                ) RETURNING id
                """,
                (
                    listing.get("title"),
                    listing.get("description"),
                    listing.get("year"),
                    listing.get("price"),
                    manufacturer_id,
                    type_id,
                    converter_id,
                    chassis_type_id,
                    listing.get("slides") or 0,
                    listing.get("featured_image"),
                    listing.get("location"),
                    True,  # is_featured
                    seller_id
                )
            )
        else:
            # Table doesn't have timestamp columns
            cursor.execute(
                """
                INSERT INTO rv_listings (
                    title, description, year, price, manufacturer_id, type_id, 
                    converter_id, chassis_type_id, slides, featured_image, 
                    location, is_featured, seller_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING id
                """,
                (
                    listing.get("title"),
                    listing.get("description"),
                    listing.get("year"),
                    listing.get("price"),
                    manufacturer_id,
                    type_id,
                    converter_id,
                    chassis_type_id,
                    listing.get("slides") or 0,
                    listing.get("featured_image"),
                    listing.get("location"),
                    True,  # is_featured
                    seller_id
                )
            )
            
        conn.commit()
        result = cursor.fetchone()
        rv_id = result["id"]
        
        # Check rv_images table structure
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'rv_images'")
        image_columns = [col['column_name'] for col in cursor.fetchall()]
        
        # Add images using the appropriate columns
        if listing.get("featured_image"):
            if 'created_at' in image_columns and 'updated_at' in image_columns:
                cursor.execute(
                    """
                    INSERT INTO rv_images (rv_id, image_url, is_primary, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                    """,
                    (rv_id, listing.get("featured_image"), True)
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO rv_images (rv_id, image_url, is_primary)
                    VALUES (%s, %s, %s)
                    """,
                    (rv_id, listing.get("featured_image"), True)
                )
                
        # Add additional images
        for img_url in listing.get("additional_images", []):
            if 'created_at' in image_columns and 'updated_at' in image_columns:
                cursor.execute(
                    """
                    INSERT INTO rv_images (rv_id, image_url, is_primary, created_at, updated_at)
                    VALUES (%s, %s, %s, NOW(), NOW())
                    """,
                    (rv_id, img_url, False)
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO rv_images (rv_id, image_url, is_primary)
                    VALUES (%s, %s, %s)
                    """,
                    (rv_id, img_url, False)
                )
            
        conn.commit()
        print(f"Imported listing: {listing.get('title')} (ID: {rv_id})")
        return rv_id

def import_listings_to_database(listings):
    """Import all listings to the database."""
    with get_db_connection() as conn:
        # Ensure RV type exists
        type_id = ensure_rv_type_exists(conn)
        
        # Import all listings
        imported_count = 0
        error_count = 0
        
        for listing in listings:
            try:
                import_listing_to_database(listing, conn, type_id)
                imported_count += 1
                # Be nice to the database
                time.sleep(0.1)
            except Exception as e:
                print(f"Error importing listing: {e}")
                error_count += 1
                
        return (imported_count, error_count)

def main():
    """Main function."""
    print("Starting table listings import...")
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