/**
 * Search Listings API Endpoint
 * 
 * Provides advanced search functionality for RV listings including:
 * - Filtering by converter, price, year, and mileage
 * - Sorting by price, year, or relevance
 * - Pagination support
 */
import { Application } from 'express';
import { IStorage } from '../storage';
import { searchListings } from '../controllers/searchController';

export function setupSearchEndpoint(app: Application, storage: IStorage) {
  /**
   * GET /api/search-listings
   * Search and filter RV listings based on specified parameters
   */
  app.get('/api/search-listings', (req, res) => {
    searchListings(req, res, storage);
  });
}