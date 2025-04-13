import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedManufacturers = () => {
  const { data: manufacturers, isLoading, error } = useQuery({
    queryKey: ["/api/manufacturers"],
  });

  // Placeholder vehicle counts
  const vehicleCounts = {
    1: 86,
    2: 104,
    3: 78,
    4: 92,
    5: 64,
    6: 53
  };

  const renderSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-4 w-20 mt-2" />
        </div>
      ));
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-8 text-center">
          Premium Manufacturers
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {isLoading ? (
            renderSkeletons()
          ) : error ? (
            <div className="col-span-full text-center p-6">
              <p className="text-red-500">Error loading manufacturers. Please try again later.</p>
            </div>
          ) : manufacturers && manufacturers.length > 0 ? (
            manufacturers.map((manufacturer: any) => (
              <Link key={manufacturer.id} href={`/browse?manufacturer=${manufacturer.id}`}>
                <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center hover:shadow-md transition-shadow cursor-pointer">
                  <div className="w-24 h-24 flex items-center justify-center">
                    {manufacturer.logoUrl ? (
                      <img 
                        src={manufacturer.logoUrl} 
                        alt={manufacturer.name} 
                        className="max-w-full max-h-full" 
                      />
                    ) : (
                      <span className="text-primary font-bold text-xl">{manufacturer.name}</span>
                    )}
                  </div>
                  <p className="text-neutral-600 text-sm mt-2">
                    {vehicleCounts[manufacturer.id as keyof typeof vehicleCounts] || 0} Vehicles
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center p-6">
              <p className="text-muted-foreground">No manufacturers available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedManufacturers;
