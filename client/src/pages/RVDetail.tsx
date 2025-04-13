import { useState, useEffect, useContext } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Share2, ArrowLeft } from "lucide-react";
import InquiryForm from "@/components/rv/InquiryForm";
import RVDetailGallery from "@/components/rv/RVDetailGallery";
import { AuthContext } from "../main";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RvListing, RvImage } from "@shared/schema";

const RVDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useContext(AuthContext);
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Fetch RV details
  const { data: rv, isLoading, error } = useQuery({
    queryKey: [`/api/listings/${id}`],
  });

  // Fetch RV images
  const { data: images } = useQuery({
    queryKey: [`/api/listings/${id}/images`],
    enabled: !!rv,
  });
  
  // Fetch manufacturer details
  const { data: manufacturer } = useQuery({
    queryKey: ["/api/manufacturers", rv?.manufacturerId],
    queryFn: async () => {
      if (!rv?.manufacturerId) return null;
      const res = await fetch(`/api/manufacturers/${rv.manufacturerId}`);
      if (!res.ok) throw new Error("Failed to fetch manufacturer");
      return res.json();
    },
    enabled: !!rv?.manufacturerId,
  });
  
  // Fetch RV type details
  const { data: rvType } = useQuery({
    queryKey: ["/api/types", rv?.typeId],
    queryFn: async () => {
      if (!rv?.typeId) return null;
      const res = await fetch(`/api/types/${rv.typeId}`);
      if (!res.ok) throw new Error("Failed to fetch RV type");
      return res.json();
    },
    enabled: !!rv?.typeId,
  });
  
  // Check if RV is favorited
  useEffect(() => {
    if (isAuthenticated && rv && user) {
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
  }, [isAuthenticated, rv, user, id]);

  useEffect(() => {
    if (rv) {
      document.title = `${rv.title} - LuxuryRV Market`;
    } else {
      document.title = "RV Details - LuxuryRV Market";
    }
  }, [rv]);
  
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
        description: "This RV has been added to your favorites",
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
        description: "This RV has been removed from your favorites",
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
    if (navigator.share) {
      navigator.share({
        title: rv.title,
        text: `Check out this ${rv.year} ${rv.title} on LuxuryRV Market!`,
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

  if (error || !rv) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading RV Details</h1>
          <p className="text-neutral-600 mb-6">We couldn't find the RV you're looking for.</p>
          <Button onClick={() => navigate("/browse")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  const galleryImages = images?.length > 0 
    ? images 
    : [{ id: 0, imageUrl: rv.featuredImage, isPrimary: true }];

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
              <RVDetailGallery images={galleryImages} title={rv.title} />
            </div>
            
            {/* RV details */}
            <div>
              <div className="flex flex-wrap items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-neutral-800">{rv.title}</h1>
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
                  ${rv.price ? rv.price.toLocaleString() : 'Price on request'}
                </h2>
                <Badge variant="outline" className="ml-3">{rv.year}</Badge>
                {rv.isFeatured && (
                  <Badge className="ml-2 bg-primary">Featured</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-neutral-500">Location</p>
                  <p className="font-medium">{rv.location}</p>
                </div>
                {rv.mileage !== undefined && rv.mileage !== null && (
                  <div>
                    <p className="text-sm text-neutral-500">Mileage</p>
                    <p className="font-medium">{rv.mileage.toLocaleString()} miles</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-neutral-500">Type</p>
                  <p className="font-medium">{rvType?.name || "Loading..."}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Manufacturer</p>
                  <p className="font-medium">{manufacturer?.name || "Loading..."}</p>
                </div>
                {rv.length && (
                  <div>
                    <p className="text-sm text-neutral-500">Length</p>
                    <p className="font-medium">{rv.length} ft</p>
                  </div>
                )}
                {rv.fuelType && (
                  <div>
                    <p className="text-sm text-neutral-500">Fuel Type</p>
                    <p className="font-medium">{rv.fuelType}</p>
                  </div>
                )}
                {rv.slides !== undefined && (
                  <div>
                    <p className="text-sm text-neutral-500">Slides</p>
                    <p className="font-medium">{rv.slides}</p>
                  </div>
                )}
                {rv.bedType && (
                  <div>
                    <p className="text-sm text-neutral-500">Bed Type</p>
                    <p className="font-medium">{rv.bedType}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button className="flex-1">Contact Seller</Button>
                <Button variant="outline" className="flex-1">
                  Get Financing Options
                </Button>
              </div>
              
              <InquiryForm rvId={parseInt(id)} />
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
                  <p>{rv.description}</p>
                </div>
              </TabsContent>
              <TabsContent value="specifications" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-neutral-50 p-4 rounded-md">
                    <h3 className="font-semibold mb-2 text-lg">Dimensions</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Length:</span>
                        <span className="font-medium">{rv.length || "N/A"} ft</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Slides:</span>
                        <span className="font-medium">{rv.slides || "N/A"}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-md">
                    <h3 className="font-semibold mb-2 text-lg">Performance</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Fuel Type:</span>
                        <span className="font-medium">{rv.fuelType || "N/A"}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Mileage:</span>
                        <span className="font-medium">{rv.mileage ? rv.mileage.toLocaleString() : 'N/A'} {rv.mileage ? 'miles' : ''}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-neutral-50 p-4 rounded-md">
                    <h3 className="font-semibold mb-2 text-lg">Interior</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-neutral-600">Bed Type:</span>
                        <span className="font-medium">{rv.bedType || "N/A"}</span>
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
                        <span>LED exterior lighting</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Power awnings</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">Interior Features</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Smart home automation system</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Premium sound system</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Residential appliances</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
                        <span>Custom cabinetry</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Related RVs section would go here */}
      </div>
    </div>
  );
};

export default RVDetail;
