import { Request, Response } from 'express';
import { IStorage } from '../storage';
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
    
    // Build search options for existing storage API
    const searchOptions: any = {
      limit: searchParams.limit || 12,
      offset: searchParams.offset || 0
    };
    
    // Apply converter filter if specified
    if (searchParams.converter) {
      // Find the converter by name first
      const converters = await storage.getAllConverters();
      const converter = converters.find(c => 
        c.name.toLowerCase() === searchParams.converter?.toLowerCase()
      );
      
      if (converter) {
        searchOptions.converterId = converter.id;
      } else {
        // If no converter found, return empty results
        return res.json({ 
          results: [], 
          total: 0 
        });
      }
    }
    
    // Apply price range filters
    if (searchParams.priceLow !== undefined) {
      searchOptions.minPrice = searchParams.priceLow;
    }
    
    if (searchParams.priceHigh !== undefined) {
      searchOptions.maxPrice = searchParams.priceHigh;
    }
    
    // Apply year range filters
    if (searchParams.yearMin !== undefined) {
      searchOptions.yearFrom = searchParams.yearMin;
    }
    
    if (searchParams.yearMax !== undefined) {
      searchOptions.yearTo = searchParams.yearMax;
    }
    
    // Apply mileage filter
    if (searchParams.mileageMax !== undefined) {
      searchOptions.mileageTo = searchParams.mileageMax;
    }
    
    // Apply sorting
    if (searchParams.sortBy) {
      searchOptions.sortBy = searchParams.sortBy;
    }
    
    // Get listings using the existing storage API
    const listings = await storage.getAllRvListings(searchOptions);
    
    // Get the converter info for each listing
    const converterMap: Record<number, string> = {};
    const converters = await storage.getAllConverters();
    
    converters.forEach(converter => {
      converterMap[converter.id] = converter.name;
    });
    
    // Transform listings to match the Listing interface
    const formattedListings: Listing[] = listings.map(listing => ({
      id: String(listing.id),
      title: listing.title,
      price: Number(listing.price),
      year: listing.year,
      mileage: listing.mileage || 0,
      converter: listing.converterId ? converterMap[listing.converterId] || 'Unknown' : 'Unknown',
      featuredImage: listing.featuredImage
    }));
    
    // For total count, we need to get the total without pagination
    // We'll reuse the same options but without limit and offset
    const countOptions = { ...searchOptions };
    delete countOptions.limit;
    delete countOptions.offset;
    
    const allMatchingListings = await storage.getAllRvListings(countOptions);
    const total = allMatchingListings.length;
    
    console.log(`Found ${formattedListings.length} results out of ${total} total matches`);
    
    res.json({
      results: formattedListings,
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