"""
Reset Listings Script

This script:
1. Removes all existing RV listings from the database
2. Runs the improved_rv_scraper.py to fetch new listings
"""
import os
import subprocess
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create a connection to the database."""
    try:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("ERROR: DATABASE_URL environment variable not set.")
            sys.exit(1)
            
        conn = psycopg2.connect(db_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to the database: {e}")
        sys.exit(1)

def reset_listings():
    """Remove all existing RV listings from the database."""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # First delete from rv_images table (child table with foreign key)
        print("Removing all RV images...")
        cur.execute("DELETE FROM rv_images")
        
        # Then delete from rv_listings table
        print("Removing all RV listings...")
        cur.execute("DELETE FROM rv_listings")
        
        # Get count of remaining listings to verify deletion
        cur.execute("SELECT COUNT(*) FROM rv_listings")
        count = cur.fetchone()[0]
        print(f"Listings in database after reset: {count}")
        
        return True
    except psycopg2.Error as e:
        print(f"Error resetting listings: {e}")
        return False
    finally:
        cur.close()
        conn.close()

def run_scraper():
    """Run the improved RV scraper."""
    print("\nRunning the improved RV scraper...")
    try:
        # Run the scraper script as a subprocess
        subprocess.run([sys.executable, "improved_rv_scraper.py"], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running scraper: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def main():
    """Main function."""
    print("Starting the reset and scrape process...")
    
    # Step 1: Reset existing listings
    if reset_listings():
        print("Successfully reset all listings.")
    else:
        print("Failed to reset listings. Exiting.")
        return
    
    # Step 2: Run the scraper
    if run_scraper():
        print("Successfully ran the scraper.")
    else:
        print("Scraper did not complete successfully.")

if __name__ == "__main__":
    main()