#!/usr/bin/env python3
"""
Image Redistribution Script

This script takes the existing downloaded images and redistributes them to all listings
to ensure every listing has actual images instead of fallbacks.
"""

import os
import sys
import requests
import time

# Directory where images are stored
IMAGE_DIR = "public/images/rv_listings"

def get_downloaded_images():
    """Get a list of all downloaded images."""
    try:
        images = []
        for filename in os.listdir(IMAGE_DIR):
            if filename.endswith(('.jpg', '.jpeg', '.png')):
                images.append(f"/images/rv_listings/{filename}")
        return images
    except Exception as e:
        print(f"Error getting images: {e}")
        return []

def get_all_listings():
    """Get all RV listings from the database."""
    try:
        response = requests.get('http://localhost:5000/api/listings')
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to get listings: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error getting listings: {e}")
        return []

def update_listing_featuredImage(listing_id, image_url):
    """Update the featured image for a listing."""
    try:
        response = requests.put(
            f'http://localhost:5000/api/listings/{listing_id}',
            json={'featuredImage': image_url}
        )
        
        if response.status_code == 200:
            print(f"Successfully updated listing {listing_id} with image {image_url}")
            return True
        else:
            print(f"Failed to update listing {listing_id}: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error updating listing {listing_id}: {e}")
        return False

def add_image_to_listing(listing_id, image_url, is_primary=False):
    """Add an image to a listing."""
    try:
        image_data = {
            'imageUrl': image_url,
            'isPrimary': is_primary
        }
        
        response = requests.post(
            f'http://localhost:5000/api/listings/{listing_id}/images',
            json=image_data
        )
        
        if response.status_code == 201:
            print(f"Successfully added image to listing {listing_id}")
            return True
        else:
            print(f"Failed to add image to listing {listing_id}: {response.status_code}")
            return False
    except Exception as e:
        print(f"Error adding image to listing {listing_id}: {e}")
        return False

def main():
    # Get all downloaded images
    images = get_downloaded_images()
    print(f"Found {len(images)} downloaded images")
    
    if not images:
        print("No images found to redistribute.")
        return
    
    # Get all listings
    listings = get_all_listings()
    print(f"Found {len(listings)} listings to update")
    
    if not listings:
        print("No listings found to update.")
        return
    
    # Calculate images per listing (at least 3)
    images_per_listing = max(3, len(images) // len(listings))
    
    # Distribute images among listings
    for i, listing in enumerate(listings):
        listing_id = listing['id']
        print(f"Updating listing {listing_id}: {listing['title']}")
        
        # Select a set of images for this listing
        # We'll wrap around if we run out of images
        start_idx = (i * images_per_listing) % len(images)
        selected_images = []
        
        for j in range(images_per_listing):
            idx = (start_idx + j) % len(images)
            selected_images.append(images[idx])
        
        # Update the featured image and add additional images
        if selected_images:
            # Update featured image
            update_listing_featuredImage(listing_id, selected_images[0])
            
            # Add images (including the featured one as primary)
            for j, image_url in enumerate(selected_images):
                is_primary = (j == 0)
                add_image_to_listing(listing_id, image_url, is_primary)
        
        # Add a small delay
        time.sleep(0.5)
    
    print("Update completed!")

if __name__ == "__main__":
    main()