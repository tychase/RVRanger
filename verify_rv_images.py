#!/usr/bin/env python3
"""
RV Image Verification Script

This script verifies that all image paths stored in the database actually exist in the
filesystem. It identifies any missing or mismatched files.
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


def get_image_paths_from_db():
    """
    Get all image paths stored in the database.
    
    Returns:
        A tuple containing (featured_images, rv_images) where:
        - featured_images is a dict mapping rv_id to the featuredImage path
        - rv_images is a list of dictionaries with id, rvId, and imageUrl
    """
    conn = get_db_connection()
    if not conn:
        return {}, []
    
    featured_images = {}
    rv_images = []
    
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # Get featured images from rv_listings
            cur.execute("""
                SELECT id, featured_image 
                FROM rv_listings 
                WHERE featured_image IS NOT NULL
            """)
            for row in cur.fetchall():
                featured_images[row['id']] = row['featured_image']
            
            # Get all images from rv_images
            cur.execute("""
                SELECT id, rv_id, image_url, is_primary 
                FROM rv_images
            """)
            for row in cur.fetchall():
                rv_images.append({
                    'id': row['id'],
                    'rvId': row['rv_id'],
                    'imageUrl': row['image_url'],
                    'isPrimary': row['is_primary']
                })
    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        conn.close()
    
    return featured_images, rv_images


def get_files_from_directory():
    """
    Get all image files from the image directory.
    
    Returns:
        A set of file paths relative to the public directory.
    """
    files = set()
    
    if not os.path.exists(IMAGE_DIR):
        print(f"Warning: Image directory '{IMAGE_DIR}' does not exist!")
        return files
    
    for filename in os.listdir(IMAGE_DIR):
        if os.path.isfile(os.path.join(IMAGE_DIR, filename)):
            # Convert to web path format
            files.add(f"/images/rv_listings/{filename}")
    
    return files


def verify_images():
    """
    Verify that all image paths in the database exist as files.
    
    Prints out missing or mismatched files.
    """
    # Get image paths from database
    featured_images, rv_images = get_image_paths_from_db()
    
    # Get files from directory
    files = get_files_from_directory()
    
    print(f"Found {len(featured_images)} featured images in rv_listings table")
    print(f"Found {len(rv_images)} images in rv_images table")
    print(f"Found {len(files)} image files in {IMAGE_DIR}")
    
    # Check featured images
    missing_featured = []
    for rv_id, image_path in featured_images.items():
        if image_path not in files:
            missing_featured.append((rv_id, image_path))
    
    # Check rv_images
    missing_rv_images = []
    for image in rv_images:
        if image['imageUrl'] not in files:
            missing_rv_images.append(image)
    
    # Find unused files
    used_paths = set(featured_images.values()).union(
        {img['imageUrl'] for img in rv_images}
    )
    unused_files = files - used_paths
    
    # Print results
    if missing_featured:
        print("\nMissing featured images:")
        for rv_id, path in missing_featured:
            print(f"RV ID {rv_id}: {path}")
    else:
        print("\nAll featured images exist in the filesystem.")
    
    if missing_rv_images:
        print("\nMissing rv_images:")
        for image in missing_rv_images:
            primary_str = " (PRIMARY)" if image['isPrimary'] else ""
            print(f"Image ID {image['id']} (RV ID {image['rvId']}){primary_str}: {image['imageUrl']}")
    else:
        print("\nAll rv_images exist in the filesystem.")
    
    if unused_files:
        print("\nUnused files in the filesystem:")
        for path in sorted(unused_files):
            print(path)
    else:
        print("\nAll files in the filesystem are referenced in the database.")
    
    # Summary
    total_missing = len(missing_featured) + len(missing_rv_images)
    if total_missing > 0:
        print(f"\nWARNING: Found {total_missing} missing image files!")
    else:
        print("\nSUCCESS: All database image paths have corresponding files!")
    
    if unused_files:
        print(f"NOTE: Found {len(unused_files)} unused image files in the filesystem.")
    
    # Check for duplicate entries
    duplicate_check = {}
    duplicate_images = []
    
    # Find duplicates in rv_images (same image URL)
    for image in rv_images:
        url = image['imageUrl']
        if url in duplicate_check:
            duplicate_check[url].append(image)
        else:
            duplicate_check[url] = [image]
    
    # Filter for actual duplicates (more than one entry with same URL)
    for url, images in duplicate_check.items():
        if len(images) > 1:
            duplicate_images.append((url, images))
    
    if duplicate_images:
        print("\nDuplicate image entries in rv_images table:")
        for url, images in duplicate_images:
            print(f"URL: {url} is used {len(images)} times:")
            for img in images:
                primary_str = " (PRIMARY)" if img['isPrimary'] else ""
                print(f"  - Image ID {img['id']} (RV ID {img['rvId']}){primary_str}")
    
    # Check for inconsistencies between featured images and primary images in rv_images
    inconsistent_primary = []
    for rv_id, featured_path in featured_images.items():
        # Find primary images for this RV
        primary_images = [img for img in rv_images if img['rvId'] == rv_id and img['isPrimary']]
        
        # Check if any primary image URL doesn't match the featured image
        for img in primary_images:
            if img['imageUrl'] != featured_path:
                inconsistent_primary.append((rv_id, featured_path, img['id'], img['imageUrl']))
    
    if inconsistent_primary:
        print("\nInconsistencies between featuredImage and primary image in rv_images:")
        for rv_id, featured, img_id, img_url in inconsistent_primary:
            print(f"RV ID {rv_id}:")
            print(f"  - Featured image: {featured}")
            print(f"  - Primary image (ID {img_id}): {img_url}")


if __name__ == "__main__":
    verify_images()