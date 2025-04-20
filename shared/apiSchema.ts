import { RvListing } from "./schema";

/**
 * Search parameters for the RV search endpoint
 */
export type SearchParams = {
  // Text search
  query?: string;
  
  // Entity filters
  manufacturer?: string;
  converter?: string;
  chassisType?: string;
  type?: string;
  
  // Year range
  yearFrom?: number | string;
  yearTo?: number | string;
  
  // Price range
  priceFrom?: number | string;
  priceTo?: number | string;
  
  // Mileage range
  mileageFrom?: number | string;
  mileageTo?: number | string;
  
  // Length range
  lengthFrom?: number | string;
  lengthTo?: number | string;
  
  // Features filters
  bedType?: string;
  fuelType?: string;
  slides?: number | string;
  
  // Boolean flags
  featured?: boolean;
  
  // Pagination
  limit?: number | string;
  offset?: number | string;
  
  // Sorting
  sortBy?: 'newest' | 'price-asc' | 'price-desc';
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
 * Complete search response structure
 */
export interface SearchResponse {
  listings: RvListing[];
  totalCount: number;
  aggregations: Aggregations;
}