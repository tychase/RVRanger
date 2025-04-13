#!/usr/bin/env python3
"""
Database Import Script

This script imports scraped RV listings into the PostgreSQL database.
It uses the output JSON file from the prevost_scraper.py script.
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
            else:
                print(f"Warning: Required field '{field}' missing from listing: {listing.get('title', 'Unknown')}")
    
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
                print(f"  Success: {response.json().get('message', 'Created')}")
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
        print(f"Input file '{input_file}' not found. Try running prevost_scraper.py first.")
        return
    
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