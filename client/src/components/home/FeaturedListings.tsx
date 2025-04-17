import { useQuery } from "@tanstack/react-query";
import CoachCard from "@/components/coach/CoachCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const FeaturedListings = () => {
  const { data: featuredRvs, isLoading, error } = useQuery({
    queryKey: ["/api/listings/featured"],
  });

  const renderSkeletons = () => {
    return Array(4)
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
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-800">Featured Luxury RVs</h2>
          <Link href="/browse?featured=true" className="text-primary font-medium hover:underline">
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            renderSkeletons()
          ) : error ? (
            <div className="col-span-full text-center p-6">
              <p className="text-red-500">Error loading featured RVs. Please try again later.</p>
            </div>
          ) : featuredRvs && featuredRvs.length > 0 ? (
            featuredRvs.map((rv: any) => (
              <CoachCard key={rv.id} coach={rv} />
            ))
          ) : (
            <div className="col-span-full text-center p-6">
              <p className="text-muted-foreground">No featured RVs available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
