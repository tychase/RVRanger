import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RVImage {
  id: number;
  imageUrl: string;
  rvId: number;
  isPrimary?: boolean | null;
}

interface RVDetailGalleryProps {
  images: RVImage[];
  title: string;
}

const RVDetailGallery = ({ images, title }: RVDetailGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Find the primary image, or use the first image
  const primaryImageIndex = images.findIndex(img => img.isPrimary) !== -1 
    ? images.findIndex(img => img.isPrimary) 
    : 0;
  
  // Set primary image as initial selected image
  useState(() => {
    setSelectedImageIndex(primaryImageIndex);
  });

  const handleThumbnailClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div>
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogTrigger asChild>
          <div 
            className="relative overflow-hidden rounded-lg cursor-pointer mb-4"
            style={{ paddingBottom: "66.67%" }}
          >
            <img 
              src={images[selectedImageIndex].imageUrl && !images[selectedImageIndex].imageUrl.includes("prevost-stuff.com") 
                  ? images[selectedImageIndex].imageUrl 
                  : "/images/default-rv.svg"}
              alt={`${title} - Image ${selectedImageIndex + 1}`}
              className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = "/images/default-rv.svg";
              }}
            />
            <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded">
              Click to expand
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-5xl p-0 border-none bg-transparent">
          <Carousel className="w-full">
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={image.id}>
                  <div className="flex items-center justify-center">
                    <img 
                      src={image.imageUrl && !image.imageUrl.includes("prevost-stuff.com") 
                          ? image.imageUrl 
                          : "/images/default-rv.svg"}
                      alt={`${title} - Image ${index + 1}`}
                      className="max-w-full max-h-[80vh] object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/images/default-rv.svg";
                      }}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        </DialogContent>
      </Dialog>
      
      {/* Thumbnail gallery */}
      <div className="grid grid-cols-4 gap-2">
        {images.slice(0, 4).map((image, index) => (
          <div 
            key={image.id}
            className={`relative cursor-pointer overflow-hidden rounded-md ${
              index === selectedImageIndex ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleThumbnailClick(index)}
            style={{ paddingBottom: "66.67%" }}
          >
            <img 
              src={image.imageUrl && !image.imageUrl.includes("prevost-stuff.com") 
                  ? image.imageUrl 
                  : "/images/default-rv.svg"}
              alt={`${title} - Thumbnail ${index + 1}`}
              className="absolute inset-0 w-full h-full object-cover hover:brightness-90 transition-all"
              onError={(e) => {
                e.currentTarget.src = "/images/default-rv.svg";
              }}
            />
          </div>
        ))}
        
        {/* Additional images count badge */}
        {images.length > 4 && (
          <div
            className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded"
            onClick={() => setIsFullscreen(true)}
          >
            +{images.length - 4} more
          </div>
        )}
      </div>
    </div>
  );
};

export default RVDetailGallery;
