import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Tv, Sofa, LayoutGrid, Utensils } from "lucide-react";

const FeaturedInterior = () => {
  const interiorImages = [
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8UlYgaW50ZXJpb3JzfHx8fHx8MTcwNzEwMjkxNg&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080",
    "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8UlYgaW50ZXJpb3JzfHx8fHx8MTcwNzEwMjk0OQ&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080",
    "https://images.unsplash.com/photo-1592840331052-16e15c2c6f95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8UlYgaW50ZXJpb3JzfHx8fHx8MTcwNzEwMjk3NQ&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080",
    "https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8UlYgZGFzaGJvYXJkIGZlYXR1cmVzfHx8fHx8MTcwNzEwMjk5Nw&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080"
  ];

  const features = [
    { icon: <Tv className="text-accent-foreground mr-2 h-5 w-5" />, text: "Smart Home Integration" },
    { icon: <Sofa className="text-accent-foreground mr-2 h-5 w-5" />, text: "Custom Furnishings" },
    { icon: <LayoutGrid className="text-accent-foreground mr-2 h-5 w-5" />, text: "Spacious Floorplans" },
    { icon: <Utensils className="text-accent-foreground mr-2 h-5 w-5" />, text: "Gourmet Kitchens" }
  ];

  return (
    <section className="py-12 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Experience Unmatched Luxury</h2>
            <p className="text-neutral-100 mb-6">
              Discover recreational vehicles with premium interiors that rival luxury homes. From handcrafted cabinetry to state-of-the-art entertainment systems, find the perfect mobile mansion for your lifestyle.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  {feature.icon}
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
            
            <Link href="/browse">
              <Button variant="secondary" className="bg-white text-primary hover:bg-neutral-100 px-6 py-3">
                Browse Luxury Interiors
              </Button>
            </Link>
          </div>
          
          <div className="md:w-1/2 grid grid-cols-2 gap-4">
            {interiorImages.map((image, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`Luxury RV Interior ${index + 1}`} 
                  className="w-full h-40 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedInterior;
