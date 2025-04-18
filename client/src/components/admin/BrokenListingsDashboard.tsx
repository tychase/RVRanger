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

  // Use our new API endpoint to check for image issues
  useEffect(() => {
    const checkListings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/listings/broken-images');
        
        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }
        
        const problemListings = await response.json();
        
        // Transform the data to match our component's expected format
        const results: ImageCheckResult[] = await Promise.all(
          problemListings.map(async (item: any) => {
            // Fetch images for this listing to show in UI
            const imagesResponse = await fetch(`/api/listings/${item.id}/images`);
            const images: RVImage[] = await imagesResponse.json();
            
            // Get the listing details to get the year
            const listingResponse = await fetch(`/api/listings/${item.id}`);
            const listing = await listingResponse.json();
            
            return {
              id: item.id,
              title: item.title,
              year: listing.year || 0,
              featuredImage: item.featuredImage || '',
              images,
              hasExternalImages: item.isExternal,
              hasMissingImages: !item.fileExists || item.galleryMissingFiles > 0,
              hasBrokenImages: !item.fileExists // For now, treat missing files as broken
            };
          })
        );
        
        setListings(results);
      } catch (err) {
        console.error('Error checking listings:', err);
        setError("Failed to check listings: " + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    checkListings();
  }, []);

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