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
import { Aggregations, Facet, SearchParams, SearchResponse, ScoredRvListing } from '../../shared/apiSchema';

export function setupSearchEndpoint(app: Application, storage: IStorage) {
  /**
   * GET /api/search-listings
   * Search and filter RV listings with full-text search and faceted filtering
   */
  app.get('/api/search-listings', async (req, res) => {
    try {
      const {
        query,          // Text query for full-text search
        manufacturer,   // Manufacturer name
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
        sortBy = 'newest', // Sort field: 'newest', 'price-asc', 'price-desc', etc.
      } = req.query;

      // We don't need to build filter conditions anymore since we're using soft filtering
      // with the score-based approach
      // This will show all listings, but rank the best matches at the top

      // Use scoring-based search instead of hard filtering
      // Convert query params to search params
      const searchParams: SearchParams = {
        query: query as string,
        manufacturer: manufacturer as string,
        converter: converter as string,
        chassisType: chassisType as string,
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
      
      // Get scored listings using soft filtering (everything stays in results, but ranks by relevance)
      const listings = await storage.searchRvListingsWithScoring(searchParams, {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10)
      });

      // Get all listings for aggregations (but don't need to paginate them)
      // We skip pagination for aggregations since we need all data for accurate counts
      const allResults = await storage.searchRvListingsWithScoring(searchParams);
      const totalCount = allResults.length;

      // Calculate basic aggregations from the results
      // First, get all entities from database
      const manufacturers = await storage.getAllManufacturers();
      const converters = await storage.getAllConverters();
      const rvTypes = await storage.getAllRvTypes();
      
      // Calculate aggregations from results
      const yearCounts = countByProperty(allResults, 'year');
      const years = Object.entries(yearCounts)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => parseInt(b.value, 10) - parseInt(a.value, 10));
      
      // Calculate manufacturer aggregations
      const manufacturerCounts: Record<number, number> = {};
      allResults.forEach(listing => {
        if (listing.manufacturerId) {
          manufacturerCounts[listing.manufacturerId] = (manufacturerCounts[listing.manufacturerId] || 0) + 1;
        }
      });
      
      const manufacturerFacets = manufacturers
        .filter(m => manufacturerCounts[m.id])
        .map(m => ({ value: m.name, count: manufacturerCounts[m.id] }));
      
      // Calculate converter aggregations
      const converterCounts: Record<number, number> = {};
      allResults.forEach(listing => {
        if (listing.converterId) {
          converterCounts[listing.converterId] = (converterCounts[listing.converterId] || 0) + 1;
        }
      });
      
      const converterFacets = converters
        .filter(c => converterCounts[c.id])
        .map(c => ({ value: c.name, count: converterCounts[c.id] }));
      
      // Calculate RV type aggregations
      const rvTypeCounts: Record<number, number> = {};
      allResults.forEach(listing => {
        if (listing.typeId) {
          rvTypeCounts[listing.typeId] = (rvTypeCounts[listing.typeId] || 0) + 1;
        }
      });
      
      const rvTypeFacets = rvTypes
        .filter(t => rvTypeCounts[t.id])
        .map(t => ({ value: t.name, count: rvTypeCounts[t.id] }));
      
      // Create the aggregations object  
      const aggregations: Aggregations = {
        manufacturers: manufacturerFacets,
        converters: converterFacets,
        chassisTypes: [],
        rvTypes: rvTypeFacets,
        years,
        priceRanges: [],
        mileageRanges: [],
        lengthRanges: [],
        bedTypes: [],
        fuelTypes: [],
        slides: []
      };

      // Prepare the response
      const response: SearchResponse = {
        listings,
        totalCount,
        aggregations
      };

      res.json(response);
    } catch (error) {
      console.error("[Search Error]", error);
      res.status(500).json({ error: "Failed to search listings" });
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