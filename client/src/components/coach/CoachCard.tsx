import { useState, useContext } from "react";
import { Link } from "wouter";
import { Heart } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { AuthContext } from "../../main";
import { useToast } from "@/hooks/use-toast";
import { CoachImage } from "@/components/ui/CoachImage";

interface CoachCardProps {
  coach: {
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
    matchScore?: number;
  };
}

const CoachCard = ({ coach }: CoachCardProps) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [isFavorited, setIsFavorited] = useState(false);
  const { toast } = useToast();

  // Check if coach is favorited on component mount
  // In a real app, we would fetch the favorite status from the server
  
  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/favorites", {
        userId: user?.id,
        rvId: coach.id,
      });
    },
    onSuccess: () => {
      setIsFavorited(true);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/favorites`] });
      toast({
        title: "Added to favorites",
        description: "This Coach has been added to your favorites",
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
        rvId: coach.id,
      });
    },
    onSuccess: () => {
      setIsFavorited(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/favorites`] });
      toast({
        title: "Removed from favorites",
        description: "This Coach has been removed from your favorites",
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
      <div className="relative">
        <CoachImage 
          src={coach.featuredImage} 
          alt={coach.title} 
          aspectRatio="video"
          objectFit="cover"
          className="w-full"
          fallbackSrc="/images/default-coach.svg"
        />
        {coach.isFeatured && (
          <span className="absolute top-2 left-2 bg-primary text-white text-xs font-semibold px-2 py-1 rounded">
            Featured
          </span>
        )}
        {coach.matchScore !== undefined && (
          <span className={`absolute bottom-2 left-2 text-white text-xs font-semibold px-2 py-1 rounded-full shadow ${
            coach.matchScore > 0 
              ? 'bg-gradient-to-r from-green-500 to-blue-500'
              : 'bg-gray-500'
          }`}>
            Match Score: {coach.matchScore}
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
      <Link href={`/coach/${coach.id}`}>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-neutral-800 mb-1">{coach.title}</h3>
            <p className="text-accent-foreground font-bold">${coach.price ? coach.price.toLocaleString() : '0'}</p>
          </div>
          <p className="text-neutral-500 text-sm mb-3">{coach.location || 'Location not specified'}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {coach.length && (
              <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-xs font-medium">
                {coach.length} ft
              </span>
            )}
            {coach.fuelType && (
              <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-xs font-medium">
                {coach.fuelType}
              </span>
            )}
            {coach.bedType && (
              <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-xs font-medium">
                {coach.bedType}
              </span>
            )}
            {coach.slides !== undefined && (
              <span className="bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md text-xs font-medium">
                {coach.slides} {coach.slides === 1 ? "Slide" : "Slides"}
              </span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-500">
              {coach.mileage ? `${coach.mileage.toLocaleString()} miles` : 'Mileage not specified'}
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

export default CoachCard;