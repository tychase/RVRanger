#!/usr/bin/env python3
"""
Fix Remaining RV Images Script

This script updates the remaining external image URLs in the rv_images table
to use local image paths.
"""

import os
import sys
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection string
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    print("ERROR: DATABASE_URL environment variable not set!")
    sys.exit(1)

# Directory where images should be stored
IMAGE_DIR = "public/images/rv_listings"


def get_db_connection():
    """Create a connection to the database."""
    try:
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None


def get_local_images():
    """Get a list of all local images in the images directory."""
    if not os.path.exists(IMAGE_DIR):
        print(f"Warning: Image directory {IMAGE_DIR} doesn't exist!")
        return []
    
    local_images = []
    for filename in os.listdir(IMAGE_DIR):
        if os.path.isfile(os.path.join(IMAGE_DIR, filename)):
            local_images.append(f"/images/rv_listings/{filename}")
    
    return local_images


def get_external_images():
    """
    Get all external image URLs from the rv_images table.
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    external_images = []
    try:
        with conn.cursor() as cur:
            # Get external URLs in image_url
            cur.execute("""
                SELECT id, image_url 
                FROM rv_images 
                WHERE image_url LIKE 'http%'
            """)
            external_images = cur.fetchall()
    except Exception as e:
        print(f"Error querying external URLs: {e}")
    finally:
        conn.close()
    
    return external_images


def update_rv_image(image_id, new_image_url):
    """Update the image_url for an RV image."""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE rv_images 
                SET image_url = %s 
                WHERE id = %s
            """, (new_image_url, image_id))
            conn.commit()
            return True
    except Exception as e:
        print(f"Error updating image URL for image ID {image_id}: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


def fix_remaining_images():
    """
    Fix remaining external image references in rv_images table.
    """
    # Get local images
    local_images = get_local_images()
    if not local_images:
        print("No local images found. Cannot fix references.")
        return
    
    # Choose different images to use
    default_images = [img for img in local_images if 'main' not in img and 'Featherlite' in img]
    if not default_images:
        default_images = local_images
    
    print(f"Found {len(default_images)} potential default images to use")
    
    # Get external references
    external_images = get_external_images()
    print(f"Found {len(external_images)} external URLs in rv_images table")
    
    # Update rv_images
    success_count = 0
    for i, (image_id, url) in enumerate(external_images):
        # Use different images for each entry
        default_image = default_images[i % len(default_images)]
        print(f"Updating image URL for image ID {image_id}: {url} -> {default_image}")
        if update_rv_image(image_id, default_image):
            success_count += 1
    
    print(f"Updated {success_count}/{len(external_images)} rv_images")


def main():
    """Main function."""
    print("Fix Remaining RV Images Script")
    print("=============================")
    
    fix_remaining_images()
    
    print("\nImage fix complete!")


if __name__ == "__main__":
    main()