import { useState, useContext } from "react";
import { Link } from "wouter";
import { Heart } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { AuthContext } from "../../main";
import { useToast } from "@/hooks/use-toast";

interface RVCardProps {
  rv: {
    id: number;
    title: string;
    price?: number | null;
    location?: string;
    mileage?: number | null;
    length?: number | null;
    fuelType?: string | null;
    bedType?: string | null;
    slides?: number | null;
    featuredImage?: string | null;
    isFeatured?: boolean;
  };
}

const RVCard = ({ rv }: RVCardProps) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [isFavorited, setIsFavorited] = useState(false);
  const { toast } = useToast();

  // Check if RV is favorited on component mount
  // In a real app, we would fetch the favorite status from the server
  
  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/favorites", {
        userId: user?.id,
        rvId: rv.id,
      });
    },
    onSuccess: () => {
      setIsFavorited(true);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/favorites`] });
      toast({
        title: "Added to favorites",
        description: "This RV has been added to your favorites",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", "/api/favorites", {
        userId: user?.id,
        rvId: rv.id,
      });
    },
    onSuccess: () => {
      setIsFavorited(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/favorites`] });
      toast({
        title: "Removed from favorites",
        description: "This RV has been removed from your favorites",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save favorites",
      });
      return;
    }
    
    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative pb-[70%]">
        <img 
          src={
            rv.featuredImage && !rv.featuredImage.includes("prevost-stuff.com") 
              ? rv.featuredImage 
              : "/images/default-rv.jpg"
          } 
          alt={rv.title} 
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/images/default-rv.jpg";
          }}
        />
        {rv.isFeatured && (
          <span className="absolute top-2 left-2 bg-primary text-white text-xs font-semibold px-2 py-1 rounded">
            Featured
          </span>
        )}
        <button 
          className={`absolute top-2 right-2 bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition-all ${
            isFavorited ? "text-red-500" : "text-gray-400"
          }`}
          onClick={handleFavoriteToggle}
        >
          <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
        </button>
      </div>
      <Link href={`/rv/${rv.id}`}>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-neutral-800 mb-1">{rv.title}</h3>
            <p className="text-accent-foreground font-bold">${rv.price ? rv.price.toLocaleString() : '0'}</p>
          </div>
          <p className="text-neutral-500 text-sm mb-3">{rv.location || 'Location not specified'}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {rv.length && (
              <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-xs font-medium">
                {rv.length} ft
              </span>
            )}
            {rv.fuelType && (
              <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-xs font-medium">
                {rv.fuelType}
              </span>
            )}
            {rv.bedType && (
              <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-xs font-medium">
                {rv.bedType}
              </span>
            )}
            {rv.slides !== undefined && (
              <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-xs font-medium">
                {rv.slides} {rv.slides === 1 ? "Slide" : "Slides"}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-500">
              {rv.mileage ? `${rv.mileage.toLocaleString()} miles` : 'Mileage not specified'}
            </p>
            <span className="text-primary font-medium text-sm hover:underline">
              View Details
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default RVCard;
