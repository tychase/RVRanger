/**
 * Daily Scraper Script
 * 
 * This script triggers the scraping process by calling the /api/scrape endpoint.
 * It can be executed manually or scheduled to run automatically.
 * 
 * Usage:
 * - Node.js: node daily_scraper.js
 * - Environment variables:
 *   - API_URL: Override the scraper API endpoint (default: http://localhost:5000/api/scrape)
 */

// Use ES modules syntax for compatibility
import axios from 'axios';

// Configure the API endpoint (can be overridden with env vars)
const API_URL = process.env.API_URL || 'http://localhost:5000/api/scrape';

async function runScraper() {
  console.log('Starting daily scraper...');
  console.time('scrape-total');
  
  try {
    console.log(`Calling scrape API at ${API_URL}...`);
    const response = await axios.post(API_URL);
    
    if (response.data.ok) {
      console.log('Scraper completed successfully!');
      console.log(response.data.message);
      process.exit(0); // Success
    } else {
      console.error('Scraper reported an error:', response.data.message);
      process.exit(1); // Error
    }
  } catch (error) {
    console.error('Failed to run scraper:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Server responded with:', error.response.data);
    }
    process.exit(1); // Error
  } finally {
    console.timeEnd('scrape-total');
  }
}

// Execute the scraper
runScraper();