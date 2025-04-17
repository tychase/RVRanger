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
import { CoachImage } from "@/components/ui/CoachImage";

interface CoachImage {
  id: number;
  imageUrl: string;
  rvId: number;
  isPrimary?: boolean | null;
}

interface CoachDetailGalleryProps {
  images: CoachImage[];
  title: string;
}

const CoachDetailGallery = ({ images, title }: CoachDetailGalleryProps) => {
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
          <div className="relative cursor-pointer mb-4">
            <CoachImage
              src={images[selectedImageIndex].imageUrl}
              alt={`${title} - Image ${selectedImageIndex + 1}`}
              aspectRatio="video"
              objectFit="cover"
              className="rounded-lg hover:scale-105 transition-transform duration-300"
              fallbackSrc="/images/default-coach.svg"
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
                    <CoachImage
                      src={image.imageUrl}
                      alt={`${title} - Image ${index + 1}`}
                      aspectRatio="auto"
                      objectFit="contain"
                      className="max-w-full max-h-[80vh]"
                      fallbackSrc="/images/default-coach.svg"
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
      <div className="grid grid-cols-4 gap-2 relative">
        {images.slice(0, 4).map((image, index) => (
          <div 
            key={image.id}
            className={`cursor-pointer ${
              index === selectedImageIndex ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleThumbnailClick(index)}
          >
            <CoachImage 
              src={image.imageUrl}
              alt={`${title} - Thumbnail ${index + 1}`}
              aspectRatio="video"
              objectFit="cover"
              className="rounded-md hover:brightness-90 transition-all"
              fallbackSrc="/images/default-coach.svg"
            />
          </div>
        ))}
        
        {/* Additional images count badge */}
        {images.length > 4 && (
          <div
            className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded cursor-pointer z-10"
            onClick={() => setIsFullscreen(true)}
          >
            +{images.length - 4} more
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachDetailGallery;