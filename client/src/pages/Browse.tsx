import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import qs from "query-string";
import SearchForm from "@/components/search/SearchForm";
import CoachCard from "@/components/coach/CoachCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Browse = () => {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState<any>({});
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    document.title = "Browse Coaches - Luxury Coach Market";
    
    // Parse URL query parameters
    const params = new URLSearchParams(location.split("?")[1]);
    const urlParams: any = {};
    
    // Use forEach instead of for...of to avoid TypeScript issues
    params.forEach((value, key) => {
      // Convert numeric values to numbers
      if (key === 'minPrice' || key === 'maxPrice') {
        urlParams[key] = parseFloat(value);
      } else {
        urlParams[key] = value;
      }
    });
    
    setSearchParams(urlParams);
  }, [location]);

  // Build query parameters for API call
  const queryParams: any = { ...searchParams };
  
  // Add pagination
  queryParams.limit = itemsPerPage;
  queryParams.offset = (currentPage - 1) * itemsPerPage;

  // Create a custom hook for search functionality (could be moved to a separate file)
  const useSearchListings = (params: any) => {
    return useQuery({
      queryKey: ['/api/search-listings', params],
      queryFn: async () => {
        const queryString = qs.stringify(params);
        return fetch(`/api/search-listings?${queryString}`).then(r => r.json());
      }
    });
  };

  // Fetch RV listings with our search API
  const { data, isLoading, error } = useSearchListings(queryParams);

  // Extract listings and aggregations from the response
  const { listings = [], totalCount = 0, aggregations = {} } = data || {};
  
  // Set default sort option to relevance if we have search filters
  useEffect(() => {
    if (Object.keys(searchParams).some(key => 
      searchParams[key] !== undefined && 
      searchParams[key] !== null && 
      searchParams[key] !== "" && 
      searchParams[key] !== "all" && 
      searchParams[key] !== "any")) {
      setSortOption("relevance");
    }
  }, [searchParams]);

  // Sort listings based on selected option
  const sortedListings = [...listings].sort((a, b) => {
    switch (sortOption) {
      case "relevance":
        // Sort by match score if available
        return (b.matchScore || 0) - (a.matchScore || 0);
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

  const handleSearch = (newParams: any) => {
    // Merge current and new parameters
    const mergedParams = { ...searchParams, ...newParams };
    
    // Convert to URL query string
    const params = new URLSearchParams();
    for (const key in mergedParams) {
      // Only add parameters that have values and aren't default/empty values
      if (
        mergedParams[key] !== undefined && 
        mergedParams[key] !== null && 
        mergedParams[key] !== "" && 
        mergedParams[key] !== "all" && 
        mergedParams[key] !== "any" &&
        // Special case for price range - only include if not default values
        !(key === "minPrice" && mergedParams[key] === 100000) &&
        !(key === "maxPrice" && mergedParams[key] === 1000000)
      ) {
        // Handle arrays like features
        if (Array.isArray(mergedParams[key]) && mergedParams[key].length > 0) {
          params.append(key, mergedParams[key].join(','));
        } else {
          params.append(key, mergedParams[key].toString());
        }
      }
    }
    
    // Update URL without refreshing the page
    window.history.pushState({}, "", `/browse?${params.toString()}`);
    
    // Update search parameters
    setSearchParams(mergedParams);
    // Reset to first page
    setCurrentPage(1);
  };

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
          <SearchForm onSearch={handleSearch} simplified={false} />
        </div>
        
        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-32 sm:h-8 sm:w-40" />
              ) : (
                `${listings.length} Coaches Available`
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
          {!isLoading && listings.length > 0 && (
            <div className="flex justify-center mt-6 sm:mt-8">
              <div className="flex space-x-1 sm:space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm h-8 sm:h-10"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
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
                  disabled={listings.length < itemsPerPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
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
