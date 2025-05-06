export interface SearchParams {
  converter?: string;
  priceLow?: number;
  priceHigh?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMax?: number;
  sortBy?: 'price' | 'year' | 'relevance';
  limit?: number;
  offset?: number;
}