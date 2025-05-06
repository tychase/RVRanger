import { useQuery } from '@tanstack/react-query';
import qs from 'query-string';
import { SearchParams } from '../../../shared/types/SearchParams';
import { Listing } from '../../../shared/types/Listing';

interface SearchResponse {
  results: Listing[];
  total: number;
}

/**
 * Hook for searching RV listings
 * @param params Search parameters
 * @param options Additional query options
 * @returns Query result containing listings data
 */
export const useSearchListings = (params: SearchParams, options: { enabled?: boolean } = {}) => {
  // Create a stable cache key from the params for proper cache handling
  const stableKey = JSON.stringify(params);
  console.log("useSearchListings: Using stableKey for cache:", stableKey);
  
  return useQuery<SearchResponse>({
    queryKey: ['/api/search-listings', stableKey],
    queryFn: async () => {
      // Clean params by removing undefined, null, and empty strings
      const cleanParams = Object.entries(params).reduce((acc: Record<string, any>, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
          console.log(`useSearchListings: Including parameter ${key}=${value}`);
        }
        return acc;
      }, {});
      
      const queryString = qs.stringify(cleanParams);
      console.log("useSearchListings: Making API call with query string:", queryString);
      console.log("useSearchListings: Full URL:", `/api/search-listings?${queryString}`);
      
      const response = await fetch(`/api/search-listings?${queryString}`);
      console.log("useSearchListings: API response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Search request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("useSearchListings: API response data:", data);
      return data;
    },
    refetchOnWindowFocus: false,
    enabled: options.enabled !== false, // Enabled by default unless explicitly disabled
    ...options
  });
};