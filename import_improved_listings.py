#!/usr/bin/env python3
"""
Improved Database Import Script

This script imports scraped RV listings with downloaded images into the PostgreSQL database.
It uses the output JSON file from the improved_rv_scraper.py script.
"""

import json
import os
import sys
import requests
import time

def load_listings_from_file(file_path='improved_prevost_listings.json'):
    """Load the listings from a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            listings = json.load(f)
        print(f"Loaded {len(listings)} listings from {file_path}")
        return listings
    except Exception as e:
        print(f"Error loading listings from {file_path}: {e}")
        return []

def clean_listing_for_db(listing):
    """
    Clean and prepare a listing for database insertion.
    
    Ensures that all required fields are present and properly formatted.
    """
    # Make a copy to avoid modifying the original
    cleaned = listing.copy()
    
    # Extract additional images for separate insertion
    additional_images = cleaned.pop('additionalImages', [])
    
    # Ensure essential fields are present
    required_fields = ['title', 'description', 'manufacturerId', 'typeId', 'sellerId']
    for field in required_fields:
        if field not in cleaned:
            if field == 'title':
                cleaned[field] = f"Prevost Luxury Coach"
            elif field == 'description':
                cleaned[field] = "Luxury Prevost motor coach with high-end amenities and craftsmanship."
            elif field == 'manufacturerId':
                cleaned[field] = 1  # Default to Prevost
            elif field == 'typeId':
                cleaned[field] = 1  # Default to Class A
            elif field == 'sellerId':
                cleaned[field] = 1  # Default seller
    
    # Return both the cleaned listing and any additional images
    return cleaned, additional_images

def import_listing_to_database(listing):
    """
    Import a listing to the database via the API.
    
    Args:
        listing: A listing dictionary prepared for the database
        
    Returns:
        The created listing data including ID if successful, None otherwise
    """
    try:
        print(f"Importing listing: {listing['title']}")
        response = requests.post('http://localhost:5000/api/listings', json=listing)
        
        if response.status_code == 201:
            result = response.json()
            print(f"Successfully imported listing: {listing['title']} with ID {result['data']['id']}")
            return result['data']
        else:
            print(f"Failed to import listing: {listing['title']}")
            print(f"Response: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Error importing listing: {e}")
        return None

def import_image_to_database(image_data, rv_id):
    """
    Import an RV image to the database via the API.
    
    Args:
        image_data: Dictionary with image data
        rv_id: The ID of the RV listing
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Add the rvId to the image data
        image_data['rvId'] = rv_id
        
        print(f"Importing image for RV ID {rv_id}: {image_data['imageUrl']}")
        response = requests.post(f'http://localhost:5000/api/listings/{rv_id}/images', json=image_data)
        
        if response.status_code == 201:
            print(f"Successfully imported image for RV ID {rv_id}")
            return True
        else:
            print(f"Failed to import image for RV ID {rv_id}")
            print(f"Response: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error importing image: {e}")
        return False

def import_listings_to_database(listings):
    """
    Import listings to the database via the API.
    
    Args:
        listings: A list of listing dictionaries
        
    Returns:
        A tuple of (success_count, error_count)
    """
    success_count = 0
    error_count = 0
    
    for idx, listing in enumerate(listings):
        print(f"Processing listing {idx+1}/{len(listings)}")
        
        # Clean and prepare the listing
        cleaned_listing, additional_images = clean_listing_for_db(listing)
        
        # Import the listing
        created_listing = import_listing_to_database(cleaned_listing)
        
        if created_listing:
            success_count += 1
            
            # If we have a featured image, add it as a primary image
            if 'featuredImage' in cleaned_listing and cleaned_listing['featuredImage']:
                primary_image = {
                    'imageUrl': cleaned_listing['featuredImage'],
                    'isPrimary': True
                }
                
                if import_image_to_database(primary_image, created_listing['id']):
                    print(f"Added primary image for listing ID {created_listing['id']}")
                else:
                    print(f"Failed to add primary image for listing ID {created_listing['id']}")
            
            # Import additional images
            for image_data in additional_images:
                if import_image_to_database(image_data, created_listing['id']):
                    print(f"Added additional image for listing ID {created_listing['id']}")
                else:
                    print(f"Failed to add additional image for listing ID {created_listing['id']}")
            
            # Add a small delay to avoid overloading the server
            time.sleep(0.5)
        else:
            error_count += 1
    
    return success_count, error_count

def main():
    """Main function."""
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = 'improved_prevost_listings.json'
    
    listings = load_listings_from_file(file_path)
    
    if not listings:
        print("No listings found in the file. Exiting.")
        return
    
    # Create a directory for images if it doesn't exist
    os.makedirs('public/images/rv_listings', exist_ok=True)
    
    # Import the listings to the database
    success_count, error_count = import_listings_to_database(listings)
    
    print(f"Import completed: {success_count} successful, {error_count} failed")

if __name__ == "__main__":
    main()