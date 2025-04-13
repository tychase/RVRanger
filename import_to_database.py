#!/usr/bin/env python3
"""
Database Import Script

This script imports scraped RV listings into the PostgreSQL database.
It uses the output JSON file from the scrape_prevost.py script.
"""

import json
import os
import sys

import requests

# The API endpoint for creating listings
API_URL = "http://localhost:5000/api/listings"

def load_listings_from_file(file_path='prevost_listings.json'):
    """Load the listings from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            listings = json.load(f)
        print(f"Loaded {len(listings)} listings from {file_path}")
        return listings
    except (IOError, json.JSONDecodeError) as e:
        print(f"Error loading listings from {file_path}: {e}", file=sys.stderr)
        return []

def clean_listing_for_db(listing):
    """
    Clean and prepare a listing for database insertion.
    
    Ensures that all required fields are present and properly formatted.
    """
    # Required fields for the database schema
    required_fields = [
        "title", "description", "price", "manufacturerId", 
        "typeId", "sellerId", "location", "featuredImage"
    ]
    
    # Check that all required fields are present
    for field in required_fields:
        if field not in listing:
            if field == "sellerId":
                # Add default seller ID if missing
                listing["sellerId"] = 1
            elif field == "featuredImage" and "featuredImage" not in listing:
                # Add a default image URL if none is available
                listing["featuredImage"] = "https://prevost-stuff.com/images/default_coach.jpg"
            else:
                print(f"Warning: Required field '{field}' missing from listing: {listing.get('title', 'Unknown')}")
    
    # Handle additional images if present
    if "additionalImages" in listing:
        # Save the additional images for later processing
        listing["additionalImagesArray"] = listing["additionalImages"]
        # Remove from main listing since the API doesn't accept this field
        del listing["additionalImages"]
    
    # Ensure status field is present
    if "status" not in listing:
        listing["status"] = "available"
    
    return listing

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
    
    for i, listing in enumerate(listings):
        print(f"Importing listing {i+1}/{len(listings)}: {listing.get('title', 'Unknown')}")
        
        # Clean the listing for database insertion
        cleaned_listing = clean_listing_for_db(listing)
        
        try:
            response = requests.post(
                API_URL, 
                json=cleaned_listing,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                result = response.json()
                print(f"  Success: {result.get('message', 'Created')}")
                
                # Get the ID of the newly created listing
                listing_id = result.get('data', {}).get('id')
                
                # If we have additional images and the listing ID, add them to the RV images table
                if listing_id and "additionalImagesArray" in cleaned_listing:
                    print(f"  Adding {len(cleaned_listing['additionalImagesArray'])} additional images...")
                    for img_url in cleaned_listing['additionalImagesArray']:
                        try:
                            # Create the RV image record
                            img_response = requests.post(
                                f"{API_URL}/{listing_id}/images",
                                json={
                                    "rvId": listing_id,
                                    "imageUrl": img_url,
                                    "isPrimary": False
                                },
                                headers={'Content-Type': 'application/json'}
                            )
                            if img_response.status_code == 201:
                                print(f"    Added image: {img_url}")
                            else:
                                print(f"    Failed to add image: {img_url} - {img_response.text}")
                        except requests.exceptions.RequestException as e:
                            print(f"    Error adding image {img_url}: {e}")
                
                success_count += 1
            else:
                print(f"  Error ({response.status_code}): {response.text}")
                error_count += 1
        except requests.exceptions.RequestException as e:
            print(f"  Request error: {e}", file=sys.stderr)
            error_count += 1
    
    return success_count, error_count

def main():
    """Main function."""
    # Get the input file from command line, otherwise use the default
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'prevost_listings.json'
    
    # Run the scraper if the input file doesn't exist
    if not os.path.exists(input_file):
        print(f"Input file '{input_file}' not found. Running scraper first...")
        import subprocess
        subprocess.run(["python", "scrape_prevost.py"])
    
    # Load the listings
    listings = load_listings_from_file(input_file)
    
    if not listings:
        print("No listings to import.")
        return
    
    # Import the listings to the database
    success_count, error_count = import_listings_to_database(listings)
    
    # Print summary
    print(f"\nImport summary:")
    print(f"  Total listings: {len(listings)}")
    print(f"  Successfully imported: {success_count}")
    print(f"  Failed to import: {error_count}")

if __name__ == "__main__":
    main()