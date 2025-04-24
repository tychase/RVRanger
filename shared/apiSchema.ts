import { RvListing } from "./schema";

/**
 * Search parameters for the RV search endpoint
 */
export interface SearchParams {
  // Text search
  query?: string;
  
  // Entity filters
  make?: string;
  manufacturer?: string;
  converter?: string;
  chassisType?: string;
  type?: string;
  
  // Year range
  yearFrom?: number;
  yearTo?: number;
  
  // Price range
  priceFrom?: number;
  priceTo?: number;
  
  // Mileage range
  mileageFrom?: number;
  mileageTo?: number;
  
  // Length range
  lengthFrom?: number;
  lengthTo?: number;
  
  // Features filters
  bedType?: string;
  fuelType?: string;
  slides?: number;
  
  // Boolean flags
  featured?: boolean;
  
  // Pagination
  limit?: number;
  offset?: number;
};

/**
 * Facet interface for aggregations
 */
export interface Facet {
  value: string;
  count: number;
}

/**
 * Aggregations response structure
 */
export interface Aggregations {
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

/**
 * RV Listing with match score, aliased to ListingWithScore for clarity
 */
export interface ScoredRvListing extends RvListing {
  matchScore: number;
}
export type ListingWithScore = ScoredRvListing;

/**
 * Complete search response structure
 */
export interface SearchResponse {
  total: number;
  results: ListingWithScore[];
  aggregations: Record<string, Record<string, number>>;
}