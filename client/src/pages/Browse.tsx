import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SearchForm from "@/components/search/SearchForm";
import RVCard from "@/components/rv/RVCard";
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
    document.title = "Browse RVs - LuxuryRV Market";
    
    // Parse URL query parameters
    const params = new URLSearchParams(location.split("?")[1]);
    const urlParams: any = {};
    
    for (const [key, value] of params.entries()) {
      urlParams[key] = value;
    }
    
    setSearchParams(urlParams);
  }, [location]);

  // Build query parameters for API call
  const queryParams: any = { ...searchParams };
  
  // Add pagination
  queryParams.limit = itemsPerPage;
  queryParams.offset = (currentPage - 1) * itemsPerPage;

  // Fetch RV listings
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/listings", queryParams],
    queryFn: async () => {
      // Convert queryParams to URL search params
      const params = new URLSearchParams();
      for (const key in queryParams) {
        params.append(key, queryParams[key]);
      }
      return fetch(`/api/listings?${params.toString()}`).then(res => res.json());
    }
  });

  const listings = data || [];
  
  // Sort listings based on selected option
  const sortedListings = [...listings].sort((a, b) => {
    switch (sortOption) {
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
        mergedParams[key] !== "any"
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
    <div className="bg-neutral-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Find Your Perfect RV</h1>
        
        {/* Search Form */}
        <div className="mb-8">
          <SearchForm onSearch={handleSearch} simplified={false} />
        </div>
        
        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-xl font-bold mb-2 md:mb-0">
              {isLoading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                `${listings.length} RVs Available`
              )}
            </h2>
            
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium">Sort by:</span>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Newest" />
                </SelectTrigger>
                <SelectContent>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              renderSkeletons()
            ) : error ? (
              <div className="col-span-full text-center p-6">
                <p className="text-red-500">Error loading RVs. Please try again later.</p>
              </div>
            ) : sortedListings.length > 0 ? (
              sortedListings.map((rv) => (
                <RVCard key={rv.id} rv={rv} />
              ))
            ) : (
              <div className="col-span-full text-center p-6">
                <p className="text-muted-foreground mb-4">No RVs match your current search criteria.</p>
                <Button variant="outline" onClick={() => handleSearch({})}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {!isLoading && listings.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </Button>
                
                {/* Add more page numbers as needed */}
                
                <Button
                  variant="outline"
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
