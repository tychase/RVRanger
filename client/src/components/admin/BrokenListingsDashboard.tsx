import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { CoachImage } from "@/components/ui/CoachImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileWarning, Image, AlertCircle, CheckCircle2 } from "lucide-react";

interface RVListing {
  id: number;
  title: string;
  featuredImage: string;
  year: number;
}

interface RVImage {
  id: number;
  rvId: number;
  imageUrl: string;
  isPrimary?: boolean | null;
}

interface ImageCheckResult {
  id: number;
  title: string;
  year: number;
  featuredImage: string;
  images: RVImage[];
  hasExternalImages: boolean;
  hasMissingImages: boolean;
  hasBrokenImages: boolean;
}

const BrokenListingsDashboard = () => {
  const [listings, setListings] = useState<ImageCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all listings
  const { data: allListings } = useQuery<RVListing[]>({
    queryKey: ["/api/listings"],
    queryFn: async () => {
      // We need to fetch all listings, so we'll make multiple requests if needed
      const fetchListings = async (offset = 0, limit = 100) => {
        const response = await fetch(`/api/listings?limit=${limit}&offset=${offset}`);
        if (!response.ok) throw new Error("Failed to fetch listings");
        return response.json();
      };
      
      // First batch
      const firstBatch = await fetchListings();
      
      // If we got a full batch, there might be more
      if (firstBatch.length === 100) {
        const secondBatch = await fetchListings(100);
        return [...firstBatch, ...secondBatch];
      }
      
      return firstBatch;
    }
  });

  // Check all listings for image issues
  useEffect(() => {
    if (!allListings) return;
    
    const checkListings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const results: ImageCheckResult[] = [];
        
        for (const listing of allListings) {
          // Fetch images for this listing
          const imagesResponse = await fetch(`/api/listings/${listing.id}/images`);
          const images: RVImage[] = await imagesResponse.json();
          
          // Check for external images (not starting with /images/)
          const hasExternalImages = listing.featuredImage && !listing.featuredImage.startsWith('/images/') ||
            images.some(img => !img.imageUrl.startsWith('/images/'));
          
          // Check for missing images (empty URLs)
          const hasMissingImages = !listing.featuredImage || 
            images.some(img => !img.imageUrl);
          
          // For now, we'll assume broken images would be detected on the client side
          // We could enhance this with a server-side check in the future
          const hasBrokenImages = false;
          
          // Add to results if there are any issues
          if (hasExternalImages || hasMissingImages || hasBrokenImages) {
            results.push({
              id: listing.id,
              title: listing.title,
              year: listing.year,
              featuredImage: listing.featuredImage,
              images,
              hasExternalImages,
              hasMissingImages,
              hasBrokenImages
            });
          }
        }
        
        setListings(results);
      } catch (err) {
        setError("Failed to check listings: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    checkListings();
  }, [allListings]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checking Listings...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
            <span className="ml-3">Analyzing image references...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-red-600">
            <AlertCircle className="mr-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="border-green-300">
        <CardHeader>
          <CardTitle className="text-green-600">All Clear!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="mr-2" />
            <p>No listings with image issues found. Everything looks good!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Listings with Image Issues ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Featured Image</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>{listing.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-sm text-neutral-500">{listing.year}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-20 h-16 relative">
                      <CoachImage 
                        src={listing.featuredImage}
                        alt={listing.title}
                        aspectRatio="video"
                        objectFit="cover"
                        fallbackSrc="/images/default-coach.svg"
                        className="rounded-md"
                      />
                      {listing.hasExternalImages && (
                        <span className="absolute bottom-0 right-0 bg-amber-500 rounded-full p-1">
                          <ExternalLink size={14} className="text-white" />
                        </span>
                      )}
                      {listing.hasMissingImages && (
                        <span className="absolute bottom-0 left-0 bg-red-500 rounded-full p-1">
                          <FileWarning size={14} className="text-white" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {listing.hasExternalImages && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
                          External Images
                        </Badge>
                      )}
                      {listing.hasMissingImages && (
                        <Badge variant="outline" className="bg-red-50 text-red-800 hover:bg-red-100">
                          Missing Images
                        </Badge>
                      )}
                      {listing.hasBrokenImages && (
                        <Badge variant="outline" className="bg-red-50 text-red-800 hover:bg-red-100">
                          Broken Images
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/coach/${listing.id}`}>
                        <Button variant="outline" size="sm">
                          <Image className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/admin/fix-images/${listing.id}`}>
                        <Button size="sm" variant="default">
                          Fix Issues
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-neutral-500">
            Showing {listings.length} listings with image issues
          </div>
          <Button>
            Fix All Issues
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BrokenListingsDashboard;