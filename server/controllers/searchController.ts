import { Request, Response } from 'express';
import { IStorage } from '../storage';
import { and, desc, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { rvListings, converters } from '../../shared/schema';
import { SearchParams } from '../../shared/types/SearchParams';
import { Listing } from '../../shared/types/Listing';

/**
 * Handles search requests for RV listings
 * @param req Express request object with query parameters
 * @param res Express response object
 * @param storage Database storage interface
 */
export async function searchListings(req: Request, res: Response, storage: IStorage) {
  try {
    console.log("RAW Search URL:", req.url);
    console.log("RAW Search params:", req.query);
    
    // Extract and parse search parameters
    const rawParams = req.query;
    
    const searchParams: SearchParams = {
      converter: rawParams.converter as string,
      priceLow: rawParams.priceLow ? parseInt(rawParams.priceLow as string) : undefined,
      priceHigh: rawParams.priceHigh ? parseInt(rawParams.priceHigh as string) : undefined,
      yearMin: rawParams.yearMin ? parseInt(rawParams.yearMin as string) : undefined,
      yearMax: rawParams.yearMax ? parseInt(rawParams.yearMax as string) : undefined,
      mileageMax: rawParams.mileageMax ? parseInt(rawParams.mileageMax as string) : undefined,
      sortBy: rawParams.sortBy as 'price' | 'year' | 'relevance',
      limit: rawParams.limit ? parseInt(rawParams.limit as string) : 12,
      offset: rawParams.offset ? parseInt(rawParams.offset as string) : 0
    };
    
    console.log("Search params:", searchParams);
    console.log("Converter param:", searchParams.converter);
    
    // Build the query conditions based on search parameters
    const conditions = [];
    
    // Filter by converter if specified
    if (searchParams.converter) {
      const converterQuery = await storage.db
        .select({ id: converters.id })
        .from(converters)
        .where(sql`LOWER(${converters.name}) = LOWER(${searchParams.converter})`)
        .limit(1);
      
      if (converterQuery.length > 0) {
        conditions.push(eq(rvListings.converterId, converterQuery[0].id));
      } else {
        // If no converter found, return empty results
        return res.json({ 
          results: [], 
          total: 0 
        });
      }
    }
    
    // Filter by price range
    if (searchParams.priceLow !== undefined) {
      conditions.push(gte(rvListings.price, searchParams.priceLow));
    }
    
    if (searchParams.priceHigh !== undefined) {
      conditions.push(lte(rvListings.price, searchParams.priceHigh));
    }
    
    // Filter by year range
    if (searchParams.yearMin !== undefined) {
      conditions.push(gte(rvListings.year, searchParams.yearMin));
    }
    
    if (searchParams.yearMax !== undefined) {
      conditions.push(lte(rvListings.year, searchParams.yearMax));
    }
    
    // Filter by maximum mileage
    if (searchParams.mileageMax !== undefined) {
      conditions.push(lte(rvListings.mileage, searchParams.mileageMax));
    }
    
    // Execute the query
    let query = storage.db
      .select({
        id: rvListings.id,
        title: rvListings.title,
        price: rvListings.price,
        year: rvListings.year,
        mileage: rvListings.mileage,
        converterId: rvListings.converterId,
        featuredImage: rvListings.featuredImage
      })
      .from(rvListings);
      
    // Apply conditions if we have any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Apply sorting
    if (searchParams.sortBy === 'price') {
      query = query.orderBy(asc(rvListings.price));
    } else if (searchParams.sortBy === 'year') {
      query = query.orderBy(desc(rvListings.year));
    } else {
      // Default sort by ID (newest first)
      query = query.orderBy(desc(rvListings.id));
    }
    
    // Apply pagination
    query = query
      .limit(searchParams.limit || 12)
      .offset(searchParams.offset || 0);
    
    // Execute the query
    const results = await query;
    
    // Get total count for pagination
    let countQuery = storage.db
      .select({ count: sql`COUNT(*)` })
      .from(rvListings);
      
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    
    const [{ count }] = await countQuery;
    const total = Number(count);
    
    // Fetch converter names for each listing
    const converterIds = results
      .map(listing => listing.converterId)
      .filter((id): id is number => id !== null);
      
    const converterMap: Record<number, string> = {};
    
    if (converterIds.length > 0) {
      const converterRows = await storage.db
        .select({
          id: converters.id,
          name: converters.name
        })
        .from(converters)
        .where(sql`${converters.id} IN (${converterIds.join(',')})`)
        .execute();
        
      converterRows.forEach(row => {
        converterMap[row.id] = row.name;
      });
    }
    
    // Map the results to the Listing interface
    const listingsWithConverters: Listing[] = results.map(listing => ({
      id: String(listing.id),
      title: listing.title,
      price: Number(listing.price),
      year: listing.year,
      mileage: listing.mileage || 0,
      converter: listing.converterId ? converterMap[listing.converterId] || 'Unknown' : 'Unknown',
      // Include any other necessary fields from the listing
      featuredImage: listing.featuredImage
    }));
    
    console.log(`Found ${results.length} raw results before scoring`);
    
    res.json({
      results: listingsWithConverters,
      total
    });
  } catch (error) {
    console.error("[Search Error] Details:", error);
    res.status(500).json({ 
      error: "Failed to search listings", 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}