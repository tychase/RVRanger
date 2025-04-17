import { useState, useEffect, useContext } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Share2, ArrowLeft } from "lucide-react";
import CoachInquiryForm from "@/components/coach/CoachInquiryForm";
import CoachDetailGallery from "@/components/coach/CoachDetailGallery";
import { AuthContext } from "../main";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RvListing, RvImage } from "@shared/schema";

const CoachDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useContext(AuthContext);
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Fetch coach details
  const { data: coach, isLoading, error } = useQuery<RvListing>({
    queryKey: [`/api/listings/${id}`],
  });

  // Fetch coach images
  const { data: images } = useQuery<RvImage[]>({
    queryKey: [`/api/listings/${id}/images`],
    enabled: !!coach,
  });
  
  // Fetch manufacturer details
  const { data: manufacturer } = useQuery({
    queryKey: ["/api/manufacturers", coach?.manufacturerId],
    queryFn: async () => {
      if (!coach?.manufacturerId) return null;
      const res = await fetch(`/api/manufacturers/${coach.manufacturerId}`);
      if (!res.ok) throw new Error("Failed to fetch manufacturer");
      return res.json();
    },
    enabled: !!coach?.manufacturerId,
  });
  
  // Fetch coach type details
  const { data: coachType } = useQuery({
    queryKey: ["/api/types", coach?.typeId],
    queryFn: async () => {
      if (!coach?.typeId) return null;
      const res = await fetch(`/api/types/${coach.typeId}`);
      if (!res.ok) throw new Error("Failed to fetch coach type");
      return res.json();
    },
    enabled: !!coach?.typeId,
  });
  
  // Check if coach is favorited
  useEffect(() => {
    if (isAuthenticated && coach && user) {
      // In a real app we would fetch the favorite status from the API
      const checkFavoriteStatus = async () => {
        try {
          // This would be replaced with a real API call
          const isFav = await queryClient.fetchQuery({
            queryKey: [`/api/users/${user.id}/favorites`],
            queryFn: async () => {
              const res = await fetch(`/api/users/${user.id}/favorites`);
              if (!res.ok) throw new Error("Failed to fetch favorites");
              return res.json();
            }
          });
          
          setIsFavorited(isFav.some((fav: any) => fav.id === parseInt(id)));
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      };
      
      checkFavoriteStatus();
    }
  }, [isAuthenticated, coach, user, id]);

  useEffect(() => {
    if (coach) {
      document.title = `${coach.title} - Luxury Coach Market`;
    } else {
      document.title = "Coach Details - Luxury Coach Market";
    }
  }, [coach]);
  
  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/favorites", {
        userId: user?.id,
        rvId: parseInt(id),
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
    onError: () => {
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
        rvId: parseInt(id),
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteToggle = () => {
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
  
  const handleShare = () => {
    if (!coach) return;
    
    if (navigator.share) {
      navigator.share({
        title: coach.title || 'Coach Listing',
        text: `Check out this ${coach.year || ''} ${coach.title || 'Coach'} on Luxury Coach Market!`,
        url: window.location.href,
      }).catch(err => console.error('Error sharing', err));
    } else {
      // Fallback copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link copied to clipboard",
          description: "You can now share this listing with others",
        });
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Skeleton className="h-96 w-full mb-4" />
              <div className="grid grid-cols-4 gap-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-10 w-48 mb-4" />
              <Skeleton className="h-6 w-32 mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-6" />
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Coach Details</h1>
          <p className="text-neutral-600 mb-6">We couldn't find the Coach you're looking for.</p>
          <Button onClick={() => navigate("/browse")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  // Debug information
  console.log("Coach Data:", coach);
  console.log("Featured Image:", coach.featuredImage);
  console.log("Images:", images);
  
  // Create a fallback image if no images are available
  const galleryImages: RvImage[] = (images && images.length > 0) 
    ? (images as RvImage[])
    : [{ 
        id: 0, 
        imageUrl: coach.featuredImage && !coach.featuredImage.includes("prevost-stuff.com")
            ? coach.featuredImage
            : "/images/default-coach.svg", 
        rvId: parseInt(id), 
        isPrimary: true 
      } as RvImage];
      
  console.log("Gallery Images to display:", galleryImages);

  return (
    <div className="bg-neutral-100 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb navigation */}
        <div className="mb-6">
          <Link href="/browse" className="flex items-center text-primary hover:underline font-medium">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to results
          </Link>
        </div>
        
        {/* Main content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image gallery */}
            <div>
              <CoachDetailGallery images={galleryImages} title={coach.title} />
            </div>
            
            {/* Coach details */}
            <div>
              <div className="flex flex-wrap items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-neutral-800">{coach.title}</h1>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={isFavorited ? "text-red-500" : ""}
                    onClick={handleFavoriteToggle}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center mb-6">
                <h2 className="text-2xl text-accent-foreground font-bold">
                  ${coach.price ? coach.price.toLocaleString() : 'Price on request'}
                </h2>
                <Badge variant="outline" className="ml-3">{coach.year}</Badge>
                {coach.isFeatured && (
                  <Badge className="ml-2 bg-primary">Featured</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-neutral-500">Location</p>
                  <p className="font-medium">{coach.location}</p>
                </div>
                {coach.mileage !== undefined && coach.mileage !== null && (
                  <div>
                    <p className="text-sm text-neutral-500">Mileage</p>
                    <p className="font-medium">{coach.mileage.toLocaleString()} miles</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-neutral-500">Type</p>
                  <p className="font-medium">{coachType?.name || "Loading..."}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Manufacturer</p>
                  <p className="font-medium">{manufacturer?.name || "Loading..."}</p>
                </div>
                {coach.length && (
                  <div>
                    <p className="text-sm text-neutral-500">Length</p>
                    <p className="font-medium">{coach.length} ft</p>
                  </div>
                )}
                {coach.fuelType && (
                  <div>
                    <p className="text-sm text-neutral-500">Fuel Type</p>
                    <p className="font-medium">{coach.fuelType}</p>
                  </div>
                )}
                {coach.slides !== undefined && (
                  <div>
                    <p className="text-sm text-neutral-500">Slides</p>
                    <p className="font-medium">{coach.slides}</p>
                  </div>
                )}
                {coach.bedType && (
                  <div>
                    <p className="text-sm text-neutral-500">Bed Type</p>
                    <p className="font-medium">{coach.bedType}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button className="flex-1">Contact Seller</Button>
                <Button variant="outline" className="flex-1">
                  Get Financing Options
                </Button>
              </div>
              
              <CoachInquiryForm coachId={parseInt(id)} />
            </div>
          </div>

          {/* Tabbed content area */}
          <div className="mt-12">
            <Tabs defaultValue="description">
              <TabsList className="mb-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="specifications">Specifications</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="pt-4">
                <div className="prose max-w-none">
                  <p>{coach.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="specifications" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-neutral-50 p-4 rounded-md">
                    <h3 className="font-semibold mb-2 text-lg">Dimensions</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Length:</span>
                        <span className="font-medium">{coach.length || "N/A"} ft</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Slides:</span>
                        <span className="font-medium">{coach.slides || "N/A"}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-md">
                    <h3 className="font-semibold mb-2 text-lg">Performance</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Fuel Type:</span>
                        <span className="font-medium">{coach.fuelType || "N/A"}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Mileage:</span>
                        <span className="font-medium">{coach.mileage ? coach.mileage.toLocaleString() : 'N/A'} {coach.mileage ? 'miles' : ''}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-md">
                    <h3 className="font-semibold mb-2 text-lg">Interior</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Bed Type:</span>
                        <span className="font-medium">{coach.bedType || "N/A"}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="features" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Exterior Features</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Automatic leveling system</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Exterior entertainment center</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Power awnings</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Outdoor shower</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Slide-out storage compartments</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Interior Features</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Premium leather seating</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Full kitchen with upscale appliances</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Satellite TV system</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Washer and dryer</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Smart home automation</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Related Coaches section would go here */}
      </div>
    </div>
  );
};

export default CoachDetail;