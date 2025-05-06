import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import qs from "query-string";
import SearchForm from "@/components/search/SearchForm";
import CoachCard from "@/components/coach/CoachCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchParams } from "@shared/apiSchema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Clean function to remove empty values from params
const clean = (obj: any) => {
  console.log("Browse: Cleaning object:", obj);
  const result = Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => {
      // Skip keys that are null, undefined, empty strings, or specific default values
      if (value == null || value === "" || value === "all" || value === "any") {
        console.log(`Browse: Removing key ${key} with value:`, value);
        return false;
      }
      console.log(`Browse: Keeping key ${key} with value:`, value);
      return true;
    })
  );
  console.log("Browse: Cleaned result:", result);
  return result;
};

const Browse = () => {
  const [location, navigate] = useLocation();
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Parse URL query parameters once using useMemo
  console.log("Browse: Current location:", location);
  const params = useMemo(
    () => {
      console.log("Browse: Parsing location in useMemo:", location);
      // Ensure we extract the query string correctly
      let queryString = "";
      if (location.includes("?")) {
        queryString = location.split("?")[1] || "";
        console.log("Browse: Found query string:", queryString);
      }
      
      // Parse the query string into an object
      const parsed = qs.parse(queryString) as Record<string, any>;
      console.log("Browse: Parsed params - raw from URL:", parsed);
      
      // Make sure all fields are explicitly handled
      const cleanedParams: Record<string, any> = {};
      
      // Only keep non-empty, non-null values
      Object.entries(parsed).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "" && value !== "all" && value !== "any") {
          console.log(`Browse: useMemo keeping key ${key} with value:`, value);
          cleanedParams[key] = value;
        }
      });
      
      console.log("Browse: Parsed params - cleaned for API use:", cleanedParams);
      return cleanedParams;
    },
    [location]
  );
  console.log("Browse: Current params state:", params);
  const ready = true; // Always enable queries

  // Removed old useEffect for location changes - now using the processUrlParams useCallback with its own useEffect
  
  // Effect to ensure queryParams update when currentPage changes
  useEffect(() => {
    console.log("Browse: Current page changed to", currentPage);
    // We don't need to manually force a query refetch here because
    // queryParams will change, which will trigger a new fetch
  }, [currentPage]);

  useEffect(() => {
    document.title = "Browse Coaches - Luxury Coach Market";
  }, []);

  // Build query parameters for API call
  // We need to make sure we're passing all URL parameters to the API
  const queryParams: any = {
    ...params,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  };
  
  console.log("Browse: Final queryParams for API call:", queryParams);

  // Create a custom hook for search functionality (could be moved to a separate file)
  const useSearchListings = (params: any) => {
    console.log("useSearchListings hook called with params:", params);
    
    // The problem might be how we're structuring our queryKey
    // Let's make sure we're deeply comparing all params for proper cache invalidation
    const stableKey = JSON.stringify(params);
    console.log("useSearchListings: Using stableKey for cache:", stableKey);
    
    return useQuery({
      queryKey: ['/api/search-listings', stableKey],
      enabled: ready, // Only run the query when we have parameters
      refetchOnWindowFocus: false, // Don't fetch on window focus
      refetchOnMount: true, // Always refetch when component mounts
      queryFn: async () => {
        // Make sure we remove undefined, null, and empty strings from params
        const cleanParams = Object.entries(params).reduce((acc: Record<string, any>, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = value;
            console.log(`useSearchListings: Including parameter ${key}=${value}`);
          } else {
            console.log(`useSearchListings: Skipping parameter ${key}=${value}`);
          }
          return acc;
        }, {});
        
        const queryString = qs.stringify(cleanParams);
        console.log("useSearchListings: Making API call with query string:", queryString);
        console.log("useSearchListings: Full URL:", `/api/search-listings?${queryString}`);
        return fetch(`/api/search-listings?${queryString}`)
          .then(r => {
            console.log("useSearchListings: API response status:", r.status);
            return r.json();
          })
          .then(data => {
            console.log("useSearchListings: API response data:", data);
            return data;
          })
          .catch(err => {
            console.error("useSearchListings: API call failed:", err);
            throw err;
          });
      }
    });
  };

  // Fetch RV listings with our search API using the parsed URL params directly
  // Track if we're doing a specific search to help with debugging
  // Add more detailed debugging logs to help diagnose the search functionality
  console.log('Browse: About to call useSearchListings with params:', JSON.stringify(queryParams));
  console.log('Browse: Checking for specific search parameters - converter:', queryParams.converter);
  const { data, isLoading, error } = useSearchListings(queryParams);

  // Extract listings and aggregations from the response
  const { results, listings = [], totalCount = 0, aggregations = {} } = data || {};
  // Handle both formats - the old API returned just listings, the new one returns results
  const rvListings = results || listings || [];
  
  // Set default sort option to relevance if we have search filters
  useEffect(() => {
    if (Object.keys(params).some(key => 
      params[key] !== undefined && 
      params[key] !== null && 
      params[key] !== "" && 
      params[key] !== "all" && 
      params[key] !== "any")) {
      setSortOption("relevance");
    }
  }, [params]);

  // Sort listings based on selected option
  // Special case: For converter searches (like Marathon), check if we should highlight matches in titles
  const isSearchingForConverter = params.converter && typeof params.converter === 'string';
  const searchConverterText = isSearchingForConverter ? String(params.converter).toLowerCase() : '';
  
  const sortedListings = [...rvListings].sort((a, b) => {
    switch (sortOption) {
      case "relevance":
        // Check for converter name in title if we're doing a converter search
        if (isSearchingForConverter) {
          const aHasMatch = a.title.toLowerCase().includes(searchConverterText);
          const bHasMatch = b.title.toLowerCase().includes(searchConverterText);
          
          if (aHasMatch && !bHasMatch) return -1; // A has match, B doesn't -> A comes first
          if (!aHasMatch && bHasMatch) return 1;  // B has match, A doesn't -> B comes first
          
          // If both match or both don't match, use the database-provided score or fallback to id
          return (b.score || 0) - (a.score || 0) || b.id - a.id;
        }
        
        // Normal relevance sorting for non-converter searches
        return (b.score || 0) - (a.score || 0);
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "mileage-low":
        return a.mileage - b.mileage;
      case "mileage-high":
        return b.mileage - a.mileage;
      case "year-new":
        return b.year - a.year;
      case "year-old":
        return a.year - b.year;
      default:
        // newest listings first (by id as a proxy for created date)
        return b.id - a.id;
    }
  });

  // Handle form submission by updating the URL, which will trigger a data fetch
  const handleSearch = useCallback((newParams: any) => {
    console.log("Browse: handleSearch called with params:", newParams);
    
    // Merge current and new parameters
    const mergedParams = { ...params, ...newParams };
    console.log("Browse: merged params:", mergedParams);
    
    // Clean the parameters to remove empty/default values
    const cleanedParams = clean(mergedParams);
    console.log("Browse: cleaned params:", cleanedParams);
    
    // Update URL with the new search parameters - this will trigger the useMemo hook
    const newUrl = `/browse?${qs.stringify(cleanedParams)}`;
    console.log("Browse: navigating to:", newUrl);
    navigate(newUrl);
    
    // Reset to first page
    setCurrentPage(1);
  }, [params, navigate]);
  
  // Function to extract search params from URL and directly pass to API
  const processUrlParams = useCallback(() => {
    console.log("Browse: Processing URL params from location:", location);
    if (location.includes('?')) {
      const searchParams = qs.parse(location.split('?')[1]);
      console.log("Browse: Extracted search params from URL:", searchParams);
      
      // We don't call handleSearch here to avoid an infinite loop
      // Instead, we'll reset the currentPage to ensure the API call is made with the right params
      // This combined with the useMemo for 'params' should ensure search works correctly
      
      // Reset to first page when URL parameters change
      setCurrentPage(1);
      
      // Log the converter parameter specifically for debugging
      if (searchParams.converter) {
        console.log("Browse: Found converter in URL params:", searchParams.converter);
      }
    }
  }, [location]);

  // Watch for changes to the URL query parameters
  useEffect(() => {
    console.log("Browse: URL location changed, processing params");
    processUrlParams();
  }, [location, processUrlParams]);

  const renderSkeletons = () => {
    return Array(itemsPerPage)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
          <Skeleton className="w-full h-56" />
          <div className="p-4">
            <Skeleton className="h-6 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/3 mb-4" />
            <div className="flex flex-wrap gap-2 mb-3">
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-6 w-14" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      ));
  };

  return (
    <div className="bg-neutral-100 min-h-screen py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Find Your Perfect Coach</h1>
        
        {/* Search Form */}
        <div className="mb-6 sm:mb-8">
          <SearchForm 
            onSearch={handleSearch} 
            simplified={false} 
            initialParams={params}
          />
        </div>
        
        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-32 sm:h-8 sm:w-40" />
              ) : (
                `${rvListings.length} Coaches Available`
              )}
            </h2>
            
            <div className="flex items-center w-full sm:w-auto">
              <span className="mr-2 text-xs sm:text-sm font-medium">Sort by:</span>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue placeholder="Newest" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price (Low to High)</SelectItem>
                  <SelectItem value="price-high">Price (High to Low)</SelectItem>
                  <SelectItem value="mileage-low">Mileage (Low to High)</SelectItem>
                  <SelectItem value="mileage-high">Mileage (High to Low)</SelectItem>
                  <SelectItem value="year-new">Year (Newest First)</SelectItem>
                  <SelectItem value="year-old">Year (Oldest First)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {isLoading ? (
              renderSkeletons()
            ) : error ? (
              <div className="col-span-full text-center p-4 sm:p-6">
                <p className="text-red-500 text-sm sm:text-base">Error loading Coaches. Please try again later.</p>
              </div>
            ) : sortedListings.length > 0 ? (
              sortedListings.map((rv) => (
                <CoachCard key={rv.id} coach={rv} />
              ))
            ) : (
              <div className="col-span-full text-center p-4 sm:p-6">
                <p className="text-muted-foreground text-sm sm:text-base mb-4">No Coaches match your current search criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => handleSearch({})}
                  className="text-sm sm:text-base px-4 py-2 h-auto"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {!isLoading && rvListings.length > 0 && (
            <div className="flex justify-center mt-6 sm:mt-8">
              <div className="flex space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm h-8 sm:h-10"
                  disabled={currentPage === 1}
                  onClick={() => {
                    console.log("Browse: Changing to previous page");
                    setCurrentPage(currentPage - 1);
                  }}
                >
                  Previous
                </Button>
                
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  className="text-xs sm:text-sm h-8 sm:h-10"
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </Button>
                
                {/* Add more page numbers as needed */}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm h-8 sm:h-10"
                  disabled={rvListings.length < itemsPerPage}
                  onClick={() => {
                    console.log("Browse: Changing to next page");
                    setCurrentPage(currentPage + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Browse;
