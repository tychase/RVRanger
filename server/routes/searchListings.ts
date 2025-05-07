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
import { z } from 'zod';
import { SearchParams } from '../../shared/types/SearchParams';
import { searchListings } from '../services/searchService';

// Validate & coerce query params
const querySchema = z.object({
  converter: z.string().optional(),
  priceLow: z.coerce.number().optional(),
  priceHigh: z.coerce.number().optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  mileageMax: z.coerce.number().optional(),
  sortBy: z.enum(['price', 'year', 'relevance']).optional(),
  limit: z.coerce.number().optional().default(20),
  offset: z.coerce.number().optional().default(0),
});

export function setupSearchEndpoint(app: Application, storage: IStorage) {
  /**
   * GET /api/search-listings
   * Search and filter RV listings based on specified parameters
   */
  app.get('/api/search-listings', async (req, res) => {
    console.log('RAW Search URL:', req.url);
    console.log('RAW Search params:', req.query);
    
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }
    
    const params: SearchParams = parsed.data;
    
    try {
      const result = await searchListings(params);
      res.json(result);
    } catch (err) {
      console.error('search-listings error', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
    }
  });
}