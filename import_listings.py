"""
Import Listings Script

This script takes the improved_prevost_listings.json file and imports the listings
to the PostgreSQL database.
"""
import json
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values

# Load environment variables
load_dotenv()

# File to import from
INPUT_FILE = 'improved_prevost_listings.json'

# Constants
PREVOST_MANUFACTURER_ID = 1
CLASS_A_TYPE_ID = 1

def get_db_connection():
    """Create a connection to the database."""
    try:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("ERROR: DATABASE_URL environment variable not set.")
            sys.exit(1)
            
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to the database: {e}")
        sys.exit(1)

def load_listings_from_file(file_path=INPUT_FILE):
    """Load the listings from a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading listings from {file_path}: {e}")
        return []

def ensure_manufacturer_exists(name="Prevost", conn=None):
    """Ensure a manufacturer exists in the database, return its ID."""
    if conn is None:
        conn = get_db_connection()
    
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM manufacturers WHERE name = %s",
        (name,)
    )
    result = cur.fetchone()
    
    if result:
        print(f"Found existing manufacturer: {name}, ID: {result[0]}")
        return result[0]
    
    # If not found, insert and return the new ID
    cur.execute(
        "INSERT INTO manufacturers (name) VALUES (%s) RETURNING id",
        (name,)
    )
    new_id = cur.fetchone()[0]
    print(f"Created new manufacturer: {name}, ID: {new_id}")
    return new_id

def ensure_rv_type_exists(name="Class A", conn=None):
    """Ensure an RV type exists in the database, return its ID."""
    if conn is None:
        conn = get_db_connection()
    
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM rv_types WHERE name = %s",
        (name,)
    )
    result = cur.fetchone()
    
    if result:
        print(f"Found existing RV type: {name}, ID: {result[0]}")
        return result[0]
    
    # If not found, insert and return the new ID
    cur.execute(
        "INSERT INTO rv_types (name) VALUES (%s) RETURNING id",
        (name,)
    )
    new_id = cur.fetchone()[0]
    print(f"Created new RV type: {name}, ID: {new_id}")
    return new_id

# Instead of creating sellers table, we'll just return a default seller_id
def get_default_seller_id():
    """Return a default seller ID (1)."""
    print("Using default seller_id: 1")
    return 1

def import_listings_to_database(listings):
    """Import listings to the database."""
    conn = get_db_connection()
    
    # Ensure necessary IDs exist
    manufacturer_id = ensure_manufacturer_exists("Prevost", conn)
    type_id = ensure_rv_type_exists("Class A", conn)
    seller_id = ensure_seller_exists("Prevost-Stuff.com", conn)
    
    # Import each listing
    success_count = 0
    error_count = 0
    
    for listing in listings:
        try:
            # Set defaults
            listing['manufacturerId'] = listing.get('manufacturerId', manufacturer_id)
            listing['typeId'] = listing.get('typeId', type_id)
            listing['sellerId'] = listing.get('sellerId', seller_id)
            
            # Extract images
            featured_image = listing.get('featuredImage')
            additional_images = listing.get('additionalImages', [])
            
            # Remove them from the listing dict
            if 'featuredImage' in listing:
                del listing['featuredImage']
            if 'additionalImages' in listing:
                del listing['additionalImages']
            
            # Insert the listing
            cur = conn.cursor()
            columns = ', '.join(listing.keys())
            placeholders = ', '.join(['%s'] * len(listing))
            
            query = f"""
            INSERT INTO rv_listings ({columns})
            VALUES ({placeholders})
            RETURNING id
            """
            
            cur.execute(query, list(listing.values()))
            rv_id = cur.fetchone()[0]
            
            # Now update the featured image
            if featured_image:
                cur.execute(
                    """
                    UPDATE rv_listings 
                    SET "featuredImage" = %s
                    WHERE id = %s
                    """,
                    (featured_image, rv_id)
                )
            
            # Insert additional images
            if additional_images:
                for img in additional_images:
                    cur.execute(
                        """
                        INSERT INTO rv_images (rv_id, image_url, is_primary)
                        VALUES (%s, %s, %s)
                        """,
                        (rv_id, img['imageUrl'], img.get('isPrimary', False))
                    )
            
            success_count += 1
            print(f"Imported listing: {listing['title']}")
            
        except Exception as e:
            error_count += 1
            print(f"Error importing listing {listing.get('title', 'Unknown')}: {e}")
    
    print(f"Import completed with {success_count} successes and {error_count} errors.")
    return success_count, error_count

def main():
    """Main function."""
    print("Starting import process...")
    
    # Load listings from file
    listings = load_listings_from_file()
    if not listings:
        print("No listings found to import.")
        return
    
    print(f"Found {len(listings)} listings to import.")
    
    # Import to database
    success, errors = import_listings_to_database(listings)
    
    if success > 0:
        print(f"Successfully imported {success} listings to the database!")
    
    if errors > 0:
        print(f"Warning: {errors} listings failed to import.")

if __name__ == "__main__":
    main()