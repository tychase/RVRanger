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
    <div className="card-luxury group transform transition-all duration-300 hover:translate-y-[-5px] bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative overflow-hidden">
        <CoachImage 
          src={coach.featuredImage} 
          alt={coach.title} 
          aspectRatio="video"
          objectFit="cover"
          className="w-full h-48 sm:h-56 object-cover transition-all duration-500 group-hover:scale-105"
          fallbackSrc="/images/default-coach.svg"
          priority={false}
        />
        {coach.isFeatured && (
          <span className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-accent-gold text-white text-xs tracking-wider font-semibold px-2 sm:px-3 py-1 rounded-xl shadow-md">
            Featured
          </span>
        )}
        {coach.matchScore !== undefined && (
          <span className={`absolute bottom-2 sm:bottom-3 left-2 sm:left-3 text-white text-xs tracking-wider font-semibold px-2 sm:px-3 py-1 rounded-xl shadow-md ${
            coach.matchScore > 0 
              ? 'bg-accent-gold'
              : 'bg-neutral-dark/70'
          }`}>
            Match: {coach.matchScore}
          </span>
        )}
        <button 
          className={`absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-all ${
            isFavorited ? "text-red-500" : "text-neutral-dark/70"
          }`}
          onClick={handleFavoriteToggle}
        >
          <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
        </button>
      </div>
      <Link href={`/coach/${coach.id}`}>
        <div className="p-3 sm:p-4 md:p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-dark tracking-wide leading-tight line-clamp-2">
              {coach.title}
            </h3>
            <p className="text-accent-gold font-bold text-base sm:text-lg tracking-wide whitespace-nowrap ml-2">
              ${coach.price ? coach.price.toLocaleString() : 'Call'}
            </p>
          </div>
          <p className="text-neutral-dark/70 text-xs sm:text-sm mb-3 sm:mb-4 tracking-wide line-clamp-1">
            {coach.location || 'Location not specified'}
          </p>
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
            {coach.length && (
              <span className="bg-neutral-light text-neutral-dark px-2 sm:px-3 py-1 rounded-xl text-xs font-medium tracking-wide">
                {coach.length} ft
              </span>
            )}
            {coach.fuelType && (
              <span className="bg-neutral-light text-neutral-dark px-2 sm:px-3 py-1 rounded-xl text-xs font-medium tracking-wide">
                {coach.fuelType}
              </span>
            )}
            {coach.bedType && (
              <span className="bg-neutral-light text-neutral-dark px-2 sm:px-3 py-1 rounded-xl text-xs font-medium tracking-wide">
                {coach.bedType}
              </span>
            )}
            {coach.slides !== undefined && (
              <span className="bg-neutral-light text-neutral-dark px-2 sm:px-3 py-1 rounded-xl text-xs font-medium tracking-wide">
                {coach.slides} {coach.slides === 1 ? "Slide" : "Slides"}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-neutral-light pt-2 sm:pt-3">
            <p className="text-xs sm:text-sm text-neutral-dark/70 tracking-wide line-clamp-1">
              {coach.mileage ? `${coach.mileage.toLocaleString()} miles` : 'Mileage not specified'}
            </p>
            <span className="flex items-center text-primary font-medium text-xs sm:text-sm group-hover:translate-x-1 transition-transform duration-300 whitespace-nowrap">
              View Details
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CoachCard;