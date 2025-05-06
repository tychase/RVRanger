/**
 * Search Listings API Endpoint
 * 
 * Provides advanced search functionality for RV listings including:
 * - Full-text search on title, description, and dealer name
 * - Filtering by various parameters (make, model, year, price, etc.)
 * - Aggregation of results for faceted search UI
 * 
 * Uses PostgreSQL's powerful text search capabilities with a GIN index
 * for optimal performance on large datasets.
 */
import { Application } from 'express';
import { and, asc, count, desc, eq, gt, gte, ilike, lt, lte, or, sql } from 'drizzle-orm';
import { IStorage } from '../storage';
import { rvListings } from '../../shared/schema';
import { SearchParams, SearchResponse, ListingWithScore } from '../../shared/apiSchema';

export function setupSearchEndpoint(app: Application, storage: IStorage) {
  /**
   * GET /api/search-listings
   * Search and filter RV listings with full-text search and scoring-based ranking
   */
  app.get('/api/search-listings', async (req, res) => {
    try {
      console.log("RAW Search URL:", req.url);
      console.log("RAW Search params:", req.query);

      const {
        query,          // Text query for full-text search
        manufacturer,   // Manufacturer name
        make,           // Make (same as manufacturer, but kept for API compatibility)
        converter,      // Converter company name
        chassisType,    // Chassis type/model
        type,           // RV type name
        yearFrom,       // Minimum year
        yearTo,         // Maximum year
        priceFrom,      // Minimum price
        priceTo,        // Maximum price
        mileageFrom,    // Minimum mileage
        mileageTo,      // Maximum mileage
        lengthFrom,     // Minimum length
        lengthTo,       // Maximum length
        bedType,        // Bed type
        fuelType,       // Fuel type
        slides,         // Number of slides
        featured,       // Featured listings only
        limit = '20',   // Number of results to return
        offset = '0',   // Offset for pagination
      } = req.query;

      console.log("Search request with params:", JSON.stringify(req.query));
      console.log("Converter param value:", converter);

      // Convert query params to search params
      const searchParams: SearchParams = {
        query: query as string,
        manufacturer: manufacturer as string || make as string,
        make: make as string,
        converter: converter as string,
        chassisType: chassisType as string,
        type: type as string,
        yearFrom: yearFrom ? parseInt(yearFrom as string) : undefined,
        yearTo: yearTo ? parseInt(yearTo as string) : undefined,
        priceFrom: priceFrom ? parseInt(priceFrom as string) : undefined,
        priceTo: priceTo ? parseInt(priceTo as string) : undefined,
        mileageFrom: mileageFrom ? parseInt(mileageFrom as string) : undefined,
        mileageTo: mileageTo ? parseInt(mileageTo as string) : undefined,
        lengthFrom: lengthFrom ? parseInt(lengthFrom as string) : undefined,
        lengthTo: lengthTo ? parseInt(lengthTo as string) : undefined,
        bedType: bedType as string,
        fuelType: fuelType as string,
        slides: slides ? parseInt(slides as string) : undefined,
        featured: featured === 'true',
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      // Use unified search method that returns results, count, and aggregations in one call
      const searchResult = await storage.searchRvListings(searchParams);

      // Prepare the response in the format expected by the front-end
      const response: SearchResponse = {
        results: searchResult.results,
        total: searchResult.total,
        aggregations: searchResult.aggregations
      };

      res.json(response);
    } catch (error) {
      console.error("[Search Error] Details:", error);
      console.error("[Search Params]", req.query);
      res.status(500).json({ 
        error: "Failed to search listings", 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });
}

/**
 * Helper function to count items by a property
 */
function countByProperty<T>(items: T[], property: keyof T): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = String(item[property] || 'Unknown');
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}