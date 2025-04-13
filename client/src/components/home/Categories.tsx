import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

const Categories = () => {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["/api/types"],
  });

  // Stock images for categories
  const categoryImages = [
    "https://images.unsplash.com/photo-1604544203037-cdf6d3e1ea24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8bHV4dXJ5IFJWIGV4dGVyaW9yc3x8fHx8fDE3MDcxMDI4MDA&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080",
    "https://images.unsplash.com/photo-1520365626416-7658e4a9aa8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8UlYgaW50ZXJpb3JzfHx8fHx8MTcwNzEwMjgxNg&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080",
    "https://images.unsplash.com/photo-1594495894542-a46cc73e081a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8UlYgaW50ZXJpb3JzfHx8fHx8MTcwNzEwMjgzNA&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080",
    "https://images.unsplash.com/photo-1627531640977-ef119eb15ec4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8UlYgZGFzaGJvYXJkIGZlYXR1cmVzfHx8fHx8MTcwNzEwMjg2NA&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080"
  ];

  // Placeholder listing counts
  const listingCounts = {
    1: 245,
    2: 182,
    3: 124,
    4: 97
  };

  const renderSkeletons = () => {
    return Array(4)
      .fill(0)
      .map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
          <Skeleton className="w-full h-40" />
          <div className="p-4 text-center">
            <Skeleton className="h-6 w-36 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      ));
  };

  return (
    <section className="py-12 bg-neutral-100">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-8 text-center">
          Browse By Category
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            renderSkeletons()
          ) : error ? (
            <div className="col-span-full text-center p-6">
              <p className="text-red-500">Error loading categories. Please try again later.</p>
            </div>
          ) : categories && categories.length > 0 ? (
            categories.map((category: any, index: number) => (
              <Link key={category.id} href={`/browse?type=${category.id}`}>
                <div className="bg-white rounded-lg shadow overflow-hidden group cursor-pointer">
                  <div className="relative pb-[60%]">
                    <img 
                      src={category.imageUrl || categoryImages[index % categoryImages.length]} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      alt={category.name}
                    />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-bold text-neutral-800">{category.name}</h3>
                    <p className="text-neutral-600 text-sm mt-1">{category.description}</p>
                    <span className="inline-block mt-3 text-primary font-medium">
                      Browse {listingCounts[category.id as keyof typeof listingCounts] || "all"} listings
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center p-6">
              <p className="text-muted-foreground">No categories available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;
