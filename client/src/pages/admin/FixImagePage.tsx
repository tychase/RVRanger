import { useState, useEffect, useContext } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AuthContext } from "../../main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CoachImage } from "@/components/ui/CoachImage";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileWarning, Image, Upload } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RVImage {
  id: number;
  rvId: number;
  imageUrl: string;
  isPrimary?: boolean | null;
}

interface RVListing {
  id: number;
  title: string;
  featuredImage: string;
  year: number;
  [key: string]: any;  // Allow other properties
}

const FixImagePage = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useContext(AuthContext);
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [localImagePath, setLocalImagePath] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Check if user is admin
  const isAdmin = isAuthenticated && user?.role === "admin";

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/admin");
    } else if (!isAdmin) {
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Fetch RV listing details
  const { data: listing, isLoading: isListingLoading } = useQuery<RVListing>({
    queryKey: [`/api/listings/${id}`],
    enabled: !!id && isAdmin,
  });

  // Fetch RV images
  const { data: images, isLoading: isImagesLoading } = useQuery<RVImage[]>({
    queryKey: [`/api/listings/${id}/images`],
    enabled: !!id && isAdmin,
  });

  // Determine if there are external images
  const hasExternalImages = listing?.featuredImage && !listing.featuredImage.startsWith('/images/') || 
    images?.some(img => !img.imageUrl.startsWith('/images/'));

  // Update featured image mutation
  const updateFeaturedImageMutation = useMutation({
    mutationFn: async (newImagePath: string) => {
      return await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featuredImage: newImagePath
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update featured image');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${id}`] });
      toast({
        title: "Featured image updated",
        description: "The featured image path has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating featured image",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Update image path mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({ imageId, newPath }: { imageId: number, newPath: string }) => {
      return await fetch(`/api/images/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: newPath
        }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to update image path');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${id}/images`] });
      toast({
        title: "Image path updated",
        description: "The image path has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating image path",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Simulate file upload
  const handleUpload = () => {
    if (!localImagePath) {
      toast({
        title: "No image path provided",
        description: "Please enter a valid image path",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);

      // If we have a selected image from the list
      if (selectedImage === "featuredImage" && listing) {
        updateFeaturedImageMutation.mutate(localImagePath);
      } else if (selectedImage && selectedImage.startsWith("image_") && images) {
        const imageId = parseInt(selectedImage.replace("image_", ""));
        const image = images.find(img => img.id === imageId);
        if (image) {
          updateImageMutation.mutate({ imageId, newPath: localImagePath });
        }
      }

      setLocalImagePath("");
      setTimeout(() => setUploadSuccess(false), 3000);
    }, 1500);
  };

  // If not authenticated or not admin, don't render the page
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">
            You need administrator privileges to access this page.
          </p>
          <Button onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (isListingLoading || isImagesLoading) {
    return (
      <div className="p-8 min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate("/admin")} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-6">
                <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
                <span className="ml-3">Loading listing information...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin")} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <h1 className="text-2xl font-bold">Fix Images for "{listing?.title}"</h1>
        </div>

        <Tabs defaultValue="images">
          <TabsList>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="details">Listing Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Image Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {/* Featured Image Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Featured Image</h3>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-24 relative">
                        <CoachImage 
                          src={listing?.featuredImage || ""}
                          alt={listing?.title || "Featured image"}
                          aspectRatio="video"
                          objectFit="cover"
                          fallbackSrc="/images/default-coach.svg"
                          className="rounded-md border"
                        />
                        {listing?.featuredImage && !listing.featuredImage.startsWith('/images/') && (
                          <span className="absolute bottom-0 right-0 bg-amber-500 rounded-full p-1">
                            <FileWarning size={14} className="text-white" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">Current path:</p>
                        <code className="bg-gray-100 text-xs block p-2 rounded mb-2 overflow-x-auto">
                          {listing?.featuredImage || 'No image path'}
                        </code>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedImage("featuredImage");
                              setLocalImagePath(listing?.featuredImage || "");
                            }}
                          >
                            <Image className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                          <Button 
                            size="sm" 
                            variant={hasExternalImages ? "default" : "outline"}
                            onClick={() => {
                              if (listing && listing.featuredImage) {
                                const path = listing.featuredImage.replace(/^.*\//, "/images/rv_listings/");
                                updateFeaturedImageMutation.mutate(path);
                              }
                            }}
                          >
                            Fix Path
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other Images Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Gallery Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {images && images.length > 0 ? (
                        images.map(image => (
                          <div key={image.id} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start gap-4">
                              <div className="w-32 h-24 relative">
                                <CoachImage 
                                  src={image.imageUrl}
                                  alt={`Image ${image.id}`}
                                  aspectRatio="video"
                                  objectFit="cover"
                                  fallbackSrc="/images/default-coach.svg"
                                  className="rounded-md border"
                                />
                                {image.imageUrl && !image.imageUrl.startsWith('/images/') && (
                                  <span className="absolute bottom-0 right-0 bg-amber-500 rounded-full p-1">
                                    <FileWarning size={14} className="text-white" />
                                  </span>
                                )}
                                {image.isPrimary && (
                                  <span className="absolute top-0 left-0 bg-primary rounded-full p-1">
                                    <CheckCircle2 size={14} className="text-white" />
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm mb-1">Image ID: {image.id}</p>
                                <code className="bg-gray-100 text-xs block p-2 rounded mb-2 overflow-x-auto">
                                  {image.imageUrl || 'No image path'}
                                </code>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedImage(`image_${image.id}`);
                                      setLocalImagePath(image.imageUrl);
                                    }}
                                  >
                                    <Image className="h-4 w-4 mr-1" />
                                    Update
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant={!image.imageUrl.startsWith('/images/') ? "default" : "outline"}
                                    onClick={() => {
                                      if (image.imageUrl) {
                                        const path = image.imageUrl.replace(/^.*\//, "/images/rv_listings/");
                                        updateImageMutation.mutate({ imageId: image.id, newPath: path });
                                      }
                                    }}
                                  >
                                    Fix Path
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No additional images found for this listing.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Path Update Form */}
                  {selectedImage && (
                    <div className="bg-blue-50 p-4 rounded-lg mt-4">
                      <h3 className="text-lg font-medium mb-2">
                        Update Image Path
                        {selectedImage === "featuredImage" 
                          ? " (Featured Image)" 
                          : selectedImage.startsWith("image_") 
                            ? ` (Image ID: ${selectedImage.replace("image_", "")})` 
                            : ""}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="localPath">Local Image Path</Label>
                          <div className="flex mt-1">
                            <Input 
                              id="localPath"
                              value={localImagePath}
                              onChange={(e) => setLocalImagePath(e.target.value)}
                              placeholder="/images/rv_listings/your-image-filename.jpg"
                              className="flex-1"
                            />
                            <Button 
                              className="ml-2" 
                              onClick={handleUpload}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                  Updating...
                                </>
                              ) : uploadSuccess ? (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Updated!
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Update Path
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the correct local path to the image file
                          </p>
                        </div>
                        
                        <RadioGroup defaultValue="option-one" className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="option-one" id="option-one" />
                            <Label htmlFor="option-one">Fix this image only</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="option-two" id="option-two" disabled />
                            <Label htmlFor="option-two" className="text-gray-400">Fix all images (Pro feature)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Listing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {listing && (
                    <>
                      <div>
                        <Label>Title</Label>
                        <Input value={listing.title} readOnly className="bg-gray-50" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea 
                          value={listing.description || "No description available"} 
                          readOnly 
                          className="bg-gray-50 min-h-[100px]" 
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Year</Label>
                          <Input value={listing.year} readOnly className="bg-gray-50" />
                        </div>
                        <div>
                          <Label>Price</Label>
                          <Input value={`$${listing.price?.toLocaleString() || 'N/A'}`} readOnly className="bg-gray-50" />
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input value={listing.location || 'N/A'} readOnly className="bg-gray-50" />
                        </div>
                        <div>
                          <Label>Featured</Label>
                          <Input value={listing.isFeatured ? 'Yes' : 'No'} readOnly className="bg-gray-50" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => navigate(`/coach/${id}`)}>
                  View Public Listing
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FixImagePage;