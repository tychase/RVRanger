#!/usr/bin/env python3
"""
RV Image Fix Script

This script fixes issues with RV images by:
1. Replacing external URLs with local image paths
2. Updating primary images to match featured images
3. Removing references to missing images

Use this after running verify_rv_images.py to identify issues.
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


def get_external_image_references():
    """
    Get all references to external image URLs in the database.
    
    Returns:
        A tuple containing (featured_external, rv_images_external) where:
        - featured_external is a list of (id, url) tuples for rv_listings.featured_image
        - rv_images_external is a list of (id, url) tuples for rv_images.image_url
    """
    conn = get_db_connection()
    if not conn:
        return [], []
    
    featured_external = []
    rv_images_external = []
    
    try:
        with conn.cursor() as cur:
            # Get external URLs in featured_image
            cur.execute("""
                SELECT id, featured_image 
                FROM rv_listings 
                WHERE featured_image LIKE 'http%'
            """)
            featured_external = cur.fetchall()
            
            # Get external URLs in image_url
            cur.execute("""
                SELECT id, image_url 
                FROM rv_images 
                WHERE image_url LIKE 'http%'
            """)
            rv_images_external = cur.fetchall()
    except Exception as e:
        print(f"Error querying external URLs: {e}")
    finally:
        conn.close()
    
    return featured_external, rv_images_external


def update_featured_image(rv_id, new_image_url):
    """Update the featured_image for an RV listing."""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE rv_listings 
                SET featured_image = %s 
                WHERE id = %s
            """, (new_image_url, rv_id))
            conn.commit()
            return True
    except Exception as e:
        print(f"Error updating featured image for RV ID {rv_id}: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


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


def align_primary_images():
    """
    Make sure primary images in rv_images match featured images in rv_listings.
    """
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # Get RVs with inconsistent images
            cur.execute("""
                SELECT r.id, r.featured_image, i.id as image_id, i.image_url
                FROM rv_listings r
                JOIN rv_images i ON r.id = i.rv_id
                WHERE i.is_primary = TRUE
                  AND r.featured_image != i.image_url
            """)
            inconsistencies = cur.fetchall()
            
            print(f"Found {len(inconsistencies)} inconsistencies between featured images and primary images")
            
            for row in inconsistencies:
                rv_id = row['id']
                featured_image = row['featured_image']
                image_id = row['image_id']
                
                # Only update if the featured image isn't an external URL
                if not featured_image.startswith('http'):
                    print(f"Updating primary image (ID {image_id}) to match featured image for RV ID {rv_id}")
                    if update_rv_image(image_id, featured_image):
                        print(f"  Success: {featured_image}")
                    else:
                        print(f"  Failed!")
    except Exception as e:
        print(f"Error aligning primary images: {e}")
    finally:
        conn.close()


def fix_image_references():
    """
    Fix external image references by replacing them with local images.
    """
    # Get local images
    local_images = get_local_images()
    if not local_images:
        print("No local images found. Cannot fix references.")
        return
    
    # Choose default images to use for missing images
    default_images = [img for img in local_images if 'main' in img]
    if not default_images:
        default_images = local_images
    
    print(f"Found {len(default_images)} potential default images to use")
    
    # Get external references
    featured_external, rv_images_external = get_external_image_references()
    
    print(f"Found {len(featured_external)} external URLs in featured_image field")
    print(f"Found {len(rv_images_external)} external URLs in rv_images table")
    
    # Update featured images
    success_count = 0
    for i, (rv_id, url) in enumerate(featured_external):
        # Use different images for each listing to provide visual variety
        default_image = default_images[i % len(default_images)]
        print(f"Updating featured image for RV ID {rv_id}: {url} -> {default_image}")
        if update_featured_image(rv_id, default_image):
            success_count += 1
    
    print(f"Updated {success_count}/{len(featured_external)} featured images")
    
    # Update rv_images
    success_count = 0
    for i, (image_id, url) in enumerate(rv_images_external):
        # Use different images for each entry
        default_image = default_images[i % len(default_images)]
        print(f"Updating image URL for image ID {image_id}: {url} -> {default_image}")
        if update_rv_image(image_id, default_image):
            success_count += 1
    
    print(f"Updated {success_count}/{len(rv_images_external)} rv_images")


def main():
    """Main function."""
    print("RV Image Fix Script")
    print("===================")
    
    # Step 1: Fix external image references
    print("\nStep 1: Fixing external image references")
    fix_image_references()
    
    # Step 2: Align primary images with featured images
    print("\nStep 2: Aligning primary images with featured images")
    align_primary_images()
    
    print("\nImage fix complete!")


if __name__ == "__main__":
    main()