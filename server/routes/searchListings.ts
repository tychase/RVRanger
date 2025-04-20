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

// Type definitions for the search response
interface Facet {
  value: string;
  count: number;
}

interface Aggregations {
  manufacturers: Facet[];
  converters: Facet[];
  chassisTypes: Facet[];
  rvTypes: Facet[];
  years: Facet[];
  priceRanges: Facet[];
  mileageRanges: Facet[];
  lengthRanges: Facet[];
  bedTypes: Facet[];
  fuelTypes: Facet[];
  slides: Facet[];
}

interface SearchResponse {
  listings: any[];
  totalCount: number;
  aggregations: Aggregations;
}

export function setupSearchEndpoint(app: Application, storage: IStorage) {
  /**
   * GET /api/listings/search
   * Search and filter RV listings with full-text search and faceted filtering
   */
  app.get('/api/listings/search', async (req, res) => {
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

      const conditions = [];

      // Add manufacturer filter
      if (manufacturer) {
        const manufacturerObj = await storage.getManufacturerByName(manufacturer as string);
        if (manufacturerObj) {
          conditions.push(eq(rvListings.manufacturerId, manufacturerObj.id));
        }
      }

      // Add converter filter
      if (converter) {
        const converterObj = await storage.getConverterByName(converter as string);
        if (converterObj) {
          conditions.push(eq(rvListings.converterId, converterObj.id));
        }
      }

      // Add chassis type filter
      if (chassisType) {
        const chassisTypeObj = await storage.getChassisTypeByName(chassisType as string);
        if (chassisTypeObj) {
          conditions.push(eq(rvListings.chassisTypeId, chassisTypeObj.id));
        }
      }

      // Add RV type filter
      if (type) {
        // Find the RV type by name
        const rvType = await storage.getRvType(parseInt(type as string, 10));
        if (rvType) {
          conditions.push(eq(rvListings.typeId, rvType.id));
        }
      }

      // Add year filter
      if (yearFrom) {
        conditions.push(gte(rvListings.year, parseInt(yearFrom as string, 10)));
      }
      if (yearTo) {
        conditions.push(lte(rvListings.year, parseInt(yearTo as string, 10)));
      }

      // Add price filter
      if (priceFrom) {
        conditions.push(gte(rvListings.price, parseInt(priceFrom as string, 10)));
      }
      if (priceTo) {
        conditions.push(lte(rvListings.price, parseInt(priceTo as string, 10)));
      }

      // Add mileage filter
      if (mileageFrom) {
        conditions.push(gte(rvListings.mileage, parseInt(mileageFrom as string, 10)));
      }
      if (mileageTo) {
        conditions.push(lte(rvListings.mileage, parseInt(mileageTo as string, 10)));
      }

      // Add length filter
      if (lengthFrom) {
        conditions.push(gte(rvListings.length, parseInt(lengthFrom as string, 10)));
      }
      if (lengthTo) {
        const lengthValue = parseInt(lengthTo as string, 10);
        conditions.push(lte(rvListings.length, lengthValue));
      }

      // Add bed type filter
      if (bedType) {
        conditions.push(eq(rvListings.bedType, bedType as string));
      }

      // Add fuel type filter
      if (fuelType) {
        conditions.push(eq(rvListings.fuelType, fuelType as string));
      }

      // Add slides filter
      if (slides) {
        conditions.push(eq(rvListings.slides, parseInt(slides as string, 10)));
      }

      // Add featured filter
      if (featured === 'true') {
        conditions.push(eq(rvListings.isFeatured, true));
      }

      // Add full-text search if query is provided
      if (query) {
        // Use PostgreSQL full-text search capabilities
        conditions.push(
          sql`${rvListings.searchVector} @@ plainto_tsquery('english', ${query})`
        );
      }

      // Get listings with applied filters
      const listings = await storage.searchRvListings(conditions, {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10)
      });

      // Get total count
      // For simplicity, we're using the same conditions, but in a real 
      // implementation you might optimize this with a COUNT query
      const allResults = await storage.searchRvListings(conditions);
      const totalCount = allResults.length;

      // For now, we're using simplified aggregations
      // In a real implementation, you would calculate these dynamically
      // from the filtered dataset (or use database aggregation functions)
      const aggregations: Aggregations = {
        manufacturers: [],
        converters: [],
        chassisTypes: [],
        rvTypes: [],
        years: [],
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