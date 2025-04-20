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
import { Application } from "express";
import { sql, and, or, eq, gte, lte, like, ilike } from "drizzle-orm";
import { IStorage } from "../storage";
import { searchParamsSchema, type SearchResponse } from "@shared/apiSchema";
import { 
  rvListings, manufacturers, converters, chassisTypes,
  type RvListing 
} from "@shared/schema";

export function setupSearchEndpoint(app: Application, storage: IStorage) {
  /**
   * GET /api/listings/search
   * Search and filter RV listings with full-text search and faceted filtering
   */
  app.get("/api/listings/search", async (req, res) => {
    try {
      console.log("[GET /api/listings/search] Query params:", req.query);
      
      // Validate and parse search parameters
      const validationResult = searchParamsSchema.safeParse(req.query);
      
      if (!validationResult.success) {
        console.error("[GET /api/listings/search] Validation error:", validationResult.error);
        return res.status(400).json({ 
          message: "Invalid search parameters", 
          errors: validationResult.error.errors 
        });
      }
      
      const params = validationResult.data;
      console.log("[GET /api/listings/search] Validated params:", params);
      
      // Build search conditions
      const conditions = [];
      
      // Full-text search (if q parameter is provided)
      if (params.q) {
        // Use PostgreSQL's to_tsquery with websearch_to_tsquery for better UX
        // This allows for natural search syntax like "prevost engine"
        const searchQuery = sql`websearch_to_tsquery('english', ${params.q})`;
        conditions.push(sql`rv_listings.search_vector @@ ${searchQuery}`);
      }
      
      // Manufacturer (make) filter
      if (params.make) {
        const manufacturers = await storage.getAllManufacturers();
        const matchingManufacturer = manufacturers.find(
          m => m.name.toLowerCase() === params.make!.toLowerCase()
        );
        
        if (matchingManufacturer) {
          conditions.push(eq(rvListings.manufacturerId, matchingManufacturer.id));
        } else {
          // If not an exact match, try a case-insensitive partial match
          conditions.push(sql`EXISTS (
            SELECT 1 FROM manufacturers 
            WHERE manufacturers.id = rv_listings.manufacturer_id 
            AND LOWER(manufacturers.name) LIKE ${`%${params.make.toLowerCase()}%`}
          )`);
        }
      }
      
      // Chassis type filter
      if (params.chassis) {
        const chassisTypes = await storage.getAllChassisTypes();
        const matchingChassisType = chassisTypes.find(
          c => c.name.toLowerCase() === params.chassis!.toLowerCase()
        );
        
        if (matchingChassisType) {
          conditions.push(eq(rvListings.chassisTypeId, matchingChassisType.id));
        } else {
          // If not an exact match, try a case-insensitive partial match
          conditions.push(sql`EXISTS (
            SELECT 1 FROM chassis_types 
            WHERE chassis_types.id = rv_listings.chassis_type_id 
            AND LOWER(chassis_types.name) LIKE ${`%${params.chassis.toLowerCase()}%`}
          )`);
        }
      }
      
      // Model filter (look in title or match converter)
      if (params.model) {
        const converters = await storage.getAllConverters();
        const matchingConverter = converters.find(
          c => c.name.toLowerCase() === params.model!.toLowerCase()
        );
        
        if (matchingConverter) {
          conditions.push(eq(rvListings.converterId, matchingConverter.id));
        } else {
          // If not a direct converter match, look for model in title
          conditions.push(ilike(rvListings.title, `%${params.model}%`));
        }
      }
      
      // Year range filter
      if (params.year_min) {
        conditions.push(gte(rvListings.year, params.year_min));
      }
      
      if (params.year_max) {
        conditions.push(lte(rvListings.year, params.year_max));
      }
      
      // Price range filter
      if (params.price_min) {
        conditions.push(gte(rvListings.price, params.price_min));
      }
      
      if (params.price_max) {
        conditions.push(lte(rvListings.price, params.price_max));
      }
      
      // Length range filter
      if (params.length_min) {
        conditions.push(gte(rvListings.length, params.length_min));
      }
      
      if (params.length_max) {
        conditions.push(lte(rvListings.length, params.length_max));
      }
      
      // Slides filter
      if (params.slides) {
        conditions.push(eq(rvListings.slides, parseInt(params.slides)));
      }
      
      // Mileage max filter
      if (params.mileage_max) {
        conditions.push(lte(rvListings.mileage, params.mileage_max));
      }
      
      // Execute search query
      const options: any = {
        limit: 50
      };
      
      // Pass complex search conditions to a custom search method
      const listings = await storage.searchRvListings(conditions, options);
      
      // Get all manufacturers, chassis types for aggregations
      const allManufacturers = await storage.getAllManufacturers();
      const allChassisTypes = await storage.getAllChassisTypes();
      
      // Calculate aggregations for faceted search
      const manufacturerCounts = countByProperty(listings, 'manufacturerId');
      const chassisCounts = countByProperty(listings, 'chassisTypeId');
      const yearCounts = countByProperty(listings, 'year');
      
      // Format manufacturer aggregations
      const manufacturerAggs = Object.entries(manufacturerCounts).map(([id, count]) => {
        const manufacturer = allManufacturers.find(m => m.id === parseInt(id));
        return {
          id: parseInt(id),
          name: manufacturer?.name || 'Unknown',
          count
        };
      });
      
      // Format chassis aggregations
      const chassisAggs = Object.entries(chassisCounts).map(([id, count]) => {
        const chassis = allChassisTypes.find(c => c.id === parseInt(id));
        return {
          id: parseInt(id),
          name: chassis?.name || 'Unknown',
          count
        };
      });
      
      // Format year aggregations
      const yearAggs = Object.entries(yearCounts).map(([year, count]) => ({
        year: parseInt(year),
        count
      }));
      
      // Full response with results and aggregations
      const response: SearchResponse = {
        total: listings.length,
        results: listings,
        aggregations: {
          manufacturers: manufacturerAggs,
          chassis: chassisAggs,
          years: yearAggs
        }
      };
      
      console.log(`[GET /api/listings/search] Found ${listings.length} listings`);
      res.json(response);
      
    } catch (error) {
      console.error("[GET /api/listings/search] Error:", error);
      res.status(500).json({ 
        message: "Failed to search listings", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

/**
 * Helper function to count items by a property
 */
function countByProperty<T>(items: T[], property: keyof T): Record<string, number> {
  return items.reduce((counts, item) => {
    const value = item[property];
    if (value !== null && value !== undefined) {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, {} as Record<string, number>);
}