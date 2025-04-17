import { useQuery } from "@tanstack/react-query";
import CoachCard from "@/components/coach/CoachCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const FeaturedListings = () => {
  const { data: featuredCoaches, isLoading, error } = useQuery({
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
    <section className="py-16 md:py-24 bg-neutral-light">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-dark mb-4 md:mb-0 font-serif tracking-wider">Featured Luxury Coaches</h2>
          <Link href="/browse?featured=true" className="group flex items-center text-primary font-medium tracking-wide">
            <span className="border-b border-transparent group-hover:border-primary transition-all duration-300">View All Featured</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading ? (
            renderSkeletons()
          ) : error ? (
            <div className="col-span-full text-center p-6">
              <p className="text-red-500">Error loading featured Coaches. Please try again later.</p>
            </div>
          ) : featuredCoaches && featuredCoaches.length > 0 ? (
            featuredCoaches.map((coach: any) => (
              <CoachCard key={coach.id} coach={coach} />
            ))
          ) : (
            <div className="col-span-full text-center p-6">
              <p className="text-muted-foreground">No featured Coaches available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
