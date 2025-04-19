#!/usr/bin/env python3
"""
Test Image URLs Script

This script diagnoses the issue with additional images by analyzing
the detailed listing URLs and checking what images are actually found.
"""

import json
import os
import re
import sys
import time
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

# Base URL for the website
BASE_URL = "https://www.prevost-stuff.com"
# URL of the page with RV listings
LISTINGS_URL = f"{BASE_URL}/forsale/public_list_ads.php"

def fetch_image_urls(listing_url):
    """
    Fetch and process a detailed listing page to extract image URLs.
    """
    print(f"\nFetching images from {listing_url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
    
    try:
        response = requests.get(listing_url, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching the page: {e}")
        return []
    
    soup = BeautifulSoup(response.text, 'lxml')
    images = []
    
    # Look for all images on the page
    for img in soup.find_all('img'):
        src = img.get('src')
        # Skip tiny images, navigation elements, etc.
        if src and not src.endswith(('.png', '.gif', 'logo', 'banner')):
            full_url = urljoin(listing_url, src)
            images.append(full_url)
    
    return images

def main():
    """Main function."""
    # Setup headers to mimic a browser request
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
    
    try:
        response = requests.get(LISTINGS_URL, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"Error fetching the listings page: {e}")
        return
    
    soup = BeautifulSoup(response.text, 'lxml')
    listing_links = []
    
    # Find all listing links
    pattern = re.compile(r'.*Prevost.*\.html$')
    for link in soup.find_all('a', href=pattern):
        href = link.get('href')
        if href and 'Prevost' in href:
            full_url = urljoin(BASE_URL, href)
            if full_url not in listing_links:
                listing_links.append(full_url)
    
    print(f"Found {len(listing_links)} potential listing links")
    
    # Process up to 3 listings
    listing_links = listing_links[:3]
    
    for link in listing_links:
        images = fetch_image_urls(link)
        print(f"Found {len(images)} images in {link}:")
        for i, img in enumerate(images):
            print(f"  {i+1}. {img}")
        print("-" * 80)

if __name__ == "__main__":
    main()