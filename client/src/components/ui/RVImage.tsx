import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RVImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: "square" | "video" | "wide" | "auto";
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  priority?: boolean;
  className?: string;
}

/**
 * Enhanced RV Image component with error handling and fallbacks
 * 
 * Features:
 * - Handles null/undefined/empty image sources
 * - Provides default fallback for missing images
 * - Shows loading state
 * - Maintains aspect ratio
 * - Supports custom styling
 */
export function RVImage({
  src,
  alt,
  fallbackSrc = "/images/default-rv.svg",
  aspectRatio = "video",
  objectFit = "cover",
  priority = false,
  className,
  ...props
}: RVImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Determine appropriate aspect ratio class
  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    wide: "aspect-[21/9]",
    auto: "aspect-auto"
  }[aspectRatio];

  // Determine appropriate object fit class
  const objectFitClass = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill",
    none: "object-none",
    "scale-down": "object-scale-down"
  }[objectFit];

  useEffect(() => {
    // Reset states when src changes
    setError(false);
    setLoading(true);

    // Handle empty/null/undefined sources
    if (!src) {
      setImgSrc(fallbackSrc);
      setLoading(false);
      return;
    }

    // Check if src is already a proper web path
    if (src.startsWith('/')) {
      setImgSrc(src);
    } 
    // Handle external URLs
    else if (src.startsWith('http')) {
      // Use the proxy-image route for external images
      setImgSrc(`/proxy-image?url=${encodeURIComponent(src)}`);
    } 
    // Handle relative paths that don't start with /
    else {
      setImgSrc(`/images/rv_listings/${src}`);
    }
  }, [src, fallbackSrc]);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
    
    // If the main image fails, use the fallback
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-muted", 
        aspectRatioClass, 
        className
      )} 
      {...props}
    >
      {/* Show a loading skeleton */}
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}

      {/* The actual image */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt}
          className={cn(
            "h-full w-full transition-opacity duration-300",
            objectFitClass,
            loading ? "opacity-0" : "opacity-100"
          )}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Error state indicator */}
      {error && imgSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span className="text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
}