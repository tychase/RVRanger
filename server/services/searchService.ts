import { SearchParams } from '../../shared/types/SearchParams';
import { Listing } from '../../shared/types/Listing';
import { db } from '../db';
import { rvListings, converters } from '../../shared/schema';
import { and, eq, gte, lte, sql, SQL } from 'drizzle-orm';

/**
 * Searches for RV listings based on provided search parameters
 * @param params Search parameters for filtering and pagination
 * @returns Array of listings matching the search criteria
 */
export async function searchListings(params: SearchParams): Promise<{ results: Listing[], total: number }> {
  const conditions = [];

  console.log("Search params:", params);
  
  // converter filter
  if (params.converter) {
    console.log("Searching for converter:", params.converter);
    const [conv] = await db
      .select({ id: converters.id })
      .from(converters)
      .where(eq(converters.name, params.converter));
    
    if (conv) {
      console.log(`Found converter ${params.converter} with id ${conv.id}`);
      conditions.push(eq(rvListings.converterId, conv.id));
    } else {
      console.log(`No converter found with name ${params.converter}`);
      // If no converter found, return empty results
      return { results: [], total: 0 };
    }
  }

  // numeric filters
  if (params.priceLow !== undefined) conditions.push(gte(rvListings.price, params.priceLow));
  if (params.priceHigh !== undefined) conditions.push(lte(rvListings.price, params.priceHigh));
  if (params.yearMin !== undefined) conditions.push(gte(rvListings.year, params.yearMin));
  if (params.yearMax !== undefined) conditions.push(lte(rvListings.year, params.yearMax));
  if (params.mileageMax !== undefined) conditions.push(lte(rvListings.mileage, params.mileageMax));

  // build base query
  let query = db.select({
      id: rvListings.id,
      title: rvListings.title,
      converterName: converters.name,
      price: rvListings.price,
      year: rvListings.year,
      mileage: rvListings.mileage,
      featuredImage: rvListings.featuredImage
    })
    .from(rvListings)
    .leftJoin(converters, eq(rvListings.converterId, converters.id));
    
  // Apply conditions if they exist
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // sorting
  if (params.sortBy === 'price') {
    query = query.orderBy(rvListings.price);
  } else if (params.sortBy === 'year') {
    query = query.orderBy(rvListings.year);
  } else {
    // Default sort by newest (id DESC)
    query = query.orderBy(sql`${rvListings.id} desc`);
  }

  // Create count query with SQL function
  let countQuery = db.select({
      count: sql`count(${rvListings.id})`
    })
    .from(rvListings)
    .leftJoin(converters, eq(rvListings.converterId, converters.id));
  
  // Apply same conditions to count query
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions));
  }
  
  // Get total count
  const [totalResult] = await countQuery;
  const total = Number(totalResult?.count || 0);
  
  // Apply pagination
  query = query.limit(params.limit || 12).offset(params.offset || 0);

  // execute & map
  const rows = await query;
  
  console.log(`Found ${rows.length} results out of ${total} total matches`);
  
  const results = rows.map(r => ({
    id: String(r.id),
    title: r.title,
    converter: r.converterName || 'Unknown',
    price: Number(r.price),
    year: r.year,
    mileage: r.mileage || 0,
    score: 0, // Default score
    featuredImage: r.featuredImage
  }));

  return { results, total };
}