import express from 'express';
import fs from 'fs';
import path from 'path';
import { storage } from '../../storage';

const router = express.Router();
const publicDir = path.join(process.cwd(), 'public');

// Return listings with image issues (missing, external, etc.)
router.get('/', async (req, res) => {
  try {
    // Fetch all listings from the database
    const listings = await storage.getAllRvListings();
    
    // Map each listing to include image status information
    const data = await Promise.all(listings.map(async (listing) => {
      const isExternal = listing.featuredImage?.startsWith('http');
      let fileExists = true;
      
      // Check if the featured image exists on disk
      if (!isExternal && listing.featuredImage) {
        // strip leading slash if any
        const rel = listing.featuredImage.startsWith('/') 
          ? listing.featuredImage.slice(1)
          : listing.featuredImage;
        fileExists = fs.existsSync(path.join(publicDir, rel));
      }
      
      // Get all images for this listing
      const images = await storage.getRvImages(listing.id);
      
      // Check for missing or external images in the gallery
      const galleryExternalImages = images.filter(img => img.imageUrl?.startsWith('http'));
      const galleryMissingFiles = images.filter(img => {
        if (!img.imageUrl || img.imageUrl.startsWith('http')) return false;
        
        const rel = img.imageUrl.startsWith('/') 
          ? img.imageUrl.slice(1)
          : img.imageUrl;
        return !fs.existsSync(path.join(publicDir, rel));
      });
      
      return {
        id: listing.id,
        title: listing.title,
        featuredImage: listing.featuredImage,
        isExternal,
        fileExists,
        galleryImages: images.length,
        galleryExternalImages: galleryExternalImages.length,
        galleryMissingFiles: galleryMissingFiles.length,
        hasIssues: isExternal || !fileExists || galleryExternalImages.length > 0 || galleryMissingFiles.length > 0
      };
    }));
    
    // Filter to only include listings with issues
    const problemListings = data.filter(l => l.hasIssues);
    
    res.json(problemListings);
  } catch (error) {
    console.error('Error in broken-images endpoint:', error);
    res.status(500).json({ 
      message: "Failed to check broken images", 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;