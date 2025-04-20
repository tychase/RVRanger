import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertRvListingSchema, insertInquirySchema, insertFavoriteSchema, insertRvImageSchema } from "@shared/schema";
import { z } from "zod";
import express from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import scrapeDetailPages from "./scraper/detailScraper";
import { setupSearchEndpoint } from "./routes/searchListings";

export async function registerRoutes(app: Express): Promise<Server> {
  // Explicitly serve static files from the public directory
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
  // Image proxy route to fetch external images
  app.get('/api/proxy-image', async (req, res) => {
    try {
      const imageUrl = req.query.url as string;
      
      if (!imageUrl) {
        return res.redirect('/images/default-rv.svg');
      }
      
      // Special handling for prevost-stuff.com
      // We don't redirect to default anymore since we fixed the URL structure in the scraper
      
      // Set proper headers for requesting external resources
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': new URL(imageUrl).origin
      };
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers,
        validateStatus: function (status) {
          return status === 200; // Only accept 200 responses
        },
        timeout: 5000 // Set a timeout to avoid hanging requests
      });
      
      // Set appropriate content type
      const contentType = response.headers['content-type'];
      res.setHeader('Content-Type', contentType);
      
      // Send the image data
      res.send(response.data);
    } catch (error) {
      console.log('Redirecting to default image due to error or invalid URL:', error);
      // Redirect to default image on error
      res.redirect('/images/default-rv.svg');
    }
  });
  // prefix all routes with /api
  const apiRouter = app.use("/api", (req, res, next) => {
    next();
  });
  
  // Broken images endpoints implemented directly in routes.ts

  // Manufacturers endpoints
  app.get("/api/manufacturers", async (req, res) => {
    try {
      const manufacturers = await storage.getAllManufacturers();
      res.json(manufacturers);
    } catch (error) {
      console.error('[GET /api/manufacturers] Error:', error);
      res.status(500).json({ message: "Failed to fetch manufacturers" });
    }
  });
  
  // Converters endpoints
  app.get("/api/converters", async (req, res) => {
    try {
      const converters = await storage.getAllConverters();
      res.json(converters);
    } catch (error) {
      console.error('[GET /api/converters] Error:', error);
      res.status(500).json({ 
        message: "Failed to fetch converters",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Chassis types endpoints
  app.get("/api/chassis-types", async (req, res) => {
    try {
      const chassisTypes = await storage.getAllChassisTypes();
      res.json(chassisTypes);
    } catch (error) {
      console.error('[GET /api/chassis-types] Error:', error);
      res.status(500).json({ 
        message: "Failed to fetch chassis types",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/manufacturers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid manufacturer ID" });
    }

    const manufacturer = await storage.getManufacturer(id);
    if (!manufacturer) {
      return res.status(404).json({ message: "Manufacturer not found" });
    }

    res.json(manufacturer);
  });

  // RV Types endpoints
  app.get("/api/types", async (req, res) => {
    const types = await storage.getAllRvTypes();
    res.json(types);
  });
  
  // Detail Scraper endpoint
  app.post("/api/scrape", async (req, res) => {
    try {
      console.log('[POST /api/scrape] Running detail page scraper...');
      await scrapeDetailPages();
      console.log('[POST /api/scrape] Scraper completed successfully');
      res.json({ ok: true, message: "Scraper completed successfully" });
    } catch (error) {
      console.error('[POST /api/scrape] Error:', error);
      res.status(500).json({ 
        ok: false, 
        message: "Scraper failed to complete", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.get("/api/types/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid type ID" });
    }

    const type = await storage.getRvType(id);
    if (!type) {
      return res.status(404).json({ message: "RV type not found" });
    }

    res.json(type);
  });

  // RV Listings endpoints
  app.get("/api/listings", async (req, res) => {
    try {
      const { 
        limit, offset, manufacturerId, typeId, year, 
        minPrice, maxPrice, minMileage, maxMileage, 
        minLength, maxLength, bedType, fuelType, slides, 
        featured, searchTerm 
      } = req.query;
      
      const options: any = {};
      
      // Pagination params
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      
      // Basic filter params
      if (manufacturerId) options.manufacturerId = parseInt(manufacturerId as string);
      if (typeId) options.typeId = parseInt(typeId as string);
      if (year) options.year = parseInt(year as string);
      
      // Price range
      if (minPrice) options.minPrice = parseFloat(minPrice as string);
      if (maxPrice) options.maxPrice = parseFloat(maxPrice as string);
      
      // Mileage range
      if (minMileage) options.minMileage = parseInt(minMileage as string);
      if (maxMileage) options.maxMileage = parseInt(maxMileage as string);
      
      // Length range
      if (minLength) options.minLength = parseFloat(minLength as string);
      if (maxLength) options.maxLength = parseFloat(maxLength as string);
      
      // Feature filters
      if (bedType) options.bedType = bedType as string;
      if (fuelType) options.fuelType = fuelType as string;
      if (slides) options.slides = parseInt(slides as string);
      
      // Boolean flags
      if (featured === 'true') options.featured = true;
      
      // Search text
      if (searchTerm) options.searchTerm = searchTerm as string;
      
      console.log(`[GET /api/listings] Fetching listings with options:`, options);
      const listings = await storage.getAllRvListings(options);
      
      console.log(`[GET /api/listings] Found ${listings.length} listings`);
      res.json(listings);
    } catch (error) {
      console.error('[GET /api/listings] Error:', error);
      res.status(500).json({ 
        message: "Failed to retrieve listings", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/listings/featured", async (req, res) => {
    try {
      console.log('[GET /api/listings/featured] Fetching featured listings');
      const listings = await storage.getAllRvListings({ featured: true, limit: 8 });
      
      console.log(`[GET /api/listings/featured] Found ${listings.length} featured listings`);
      res.json(listings);
    } catch (error) {
      console.error('[GET /api/listings/featured] Error:', error);
      res.status(500).json({ 
        message: "Failed to retrieve featured listings", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Direct implementation of broken images endpoint
  app.get("/api/listings/broken-images", async (req, res) => {
    try {
      console.log('[GET /api/listings/broken-images] Checking for broken images');
      
      // Fetch all listings from the database
      const listings = await storage.getAllRvListings();
      const publicDir = path.join(process.cwd(), 'public');
      
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
      
      console.log(`[GET /api/listings/broken-images] Found ${problemListings.length} listings with issues`);
      res.json(problemListings);
    } catch (error) {
      console.error('Error in broken-images endpoint:', error);
      res.status(500).json({ 
        message: "Failed to check broken images", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/listings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }

      console.log(`[GET /api/listings/${id}] Fetching listing details`);
      const listing = await storage.getRvListing(id);
      
      if (!listing) {
        console.log(`[GET /api/listings/${id}] Listing not found`);
        return res.status(404).json({ message: "RV listing not found" });
      }

      console.log(`[GET /api/listings/${id}] Successfully retrieved listing`);
      res.json(listing);
    } catch (error) {
      console.error(`[GET /api/listings/:id] Error:`, error);
      res.status(500).json({ 
        message: "Failed to retrieve listing", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/listings", async (req, res) => {
    try {
      console.log('[POST /api/listings] Creating new listing with data:', JSON.stringify(req.body));
      
      const validated = insertRvListingSchema.parse(req.body);
      
      // Ensure manufacturer and type exist
      if (validated.manufacturerId) {
        const manufacturer = await storage.getManufacturer(validated.manufacturerId);
        if (!manufacturer) {
          return res.status(400).json({ message: `Manufacturer with ID ${validated.manufacturerId} not found` });
        }
      }
      
      if (validated.typeId) {
        const type = await storage.getRvType(validated.typeId);
        if (!type) {
          return res.status(400).json({ message: `RV type with ID ${validated.typeId} not found` });
        }
      }
      
      const listing = await storage.createRvListing(validated);
      console.log(`[POST /api/listings] Successfully created listing with ID ${listing.id}`);
      
      res.status(201).json({
        message: "RV listing created successfully",
        data: listing 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[POST /api/listings] Validation error:', error.errors);
        return res.status(400).json({ 
          message: "Invalid listing data", 
          errors: error.errors 
        });
      }
      
      console.error('[POST /api/listings] Error:', error);
      res.status(500).json({ 
        message: "Failed to create listing", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/listings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    try {
      const validated = insertRvListingSchema.partial().parse(req.body);
      const updated = await storage.updateRvListing(id, validated);
      
      if (!updated) {
        return res.status(404).json({ message: "RV listing not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid listing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  app.delete("/api/listings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    const success = await storage.deleteRvListing(id);
    if (!success) {
      return res.status(404).json({ message: "RV listing not found" });
    }

    res.status(204).end();
  });

  // RV Images endpoints
  app.get("/api/listings/:id/images", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    const images = await storage.getRvImages(id);
    res.json(images);
  });
  
  app.post("/api/listings/:id/images", async (req, res) => {
    try {
      console.log('[POST /api/listings/:id/images] Adding new image:', JSON.stringify(req.body));
      
      const rvId = parseInt(req.params.id);
      if (isNaN(rvId)) {
        return res.status(400).json({ message: "Invalid listing ID" });
      }
      
      // Check if the RV listing exists
      const listing = await storage.getRvListing(rvId);
      if (!listing) {
        return res.status(404).json({ message: "RV listing not found" });
      }
      
      // Create object with rvId from params
      const imageData = {
        ...req.body,
        rvId // Set the rvId from the URL parameter
      };
      
      // Validate the data
      const validated = insertRvImageSchema.parse(imageData);
      
      // Add the image
      const image = await storage.addRvImage(validated);
      
      console.log(`[POST /api/listings/:id/images] Successfully added image with ID ${image.id}`);
      res.status(201).json({
        message: "Image added successfully",
        data: image
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[POST /api/listings/:id/images] Validation error:', error.errors);
        return res.status(400).json({ 
          message: "Invalid image data", 
          errors: error.errors 
        });
      }
      
      console.error('[POST /api/listings/:id/images] Error:', error);
      res.status(500).json({ 
        message: "Failed to add image", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // User endpoints
  app.post("/api/users/register", async (req, res) => {
    try {
      const validated = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validated.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(validated.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
      
      // In a real app, we would hash the password here
      const user = await storage.createUser(validated);
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/users/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    // Special case for admin user - hardcoded credentials for testing
    if (username === "admin" && password === "admin123") {
      // Return a hardcoded admin user for simplicity
      return res.json({
        id: 1,
        username: "admin",
        email: "admin@example.com",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        role: "admin" // Include both formats for maximum compatibility
      });
    }
    
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // In a real app, we would set up a session here
    const { password: _, ...userWithoutPassword } = user;
    
    // Add role property for backward compatibility with client code
    const userWithRole = {
      ...userWithoutPassword,
      role: userWithoutPassword.isAdmin ? "admin" : "user"
    };
    
    res.json(userWithRole);
  });

  // User's RV listings
  app.get("/api/users/:id/listings", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const listings = await storage.getRvListingsByUser(id);
    res.json(listings);
  });

  // Favorites endpoints
  app.get("/api/users/:id/favorites", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const favorites = await storage.getUserFavorites(id);
    res.json(favorites);
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const validated = insertFavoriteSchema.parse(req.body);
      
      // Check if already favorited
      const isAlreadyFavorited = await storage.isFavorited(validated.userId, validated.rvId);
      if (isAlreadyFavorited) {
        return res.status(409).json({ message: "RV is already in favorites" });
      }
      
      const favorite = await storage.addFavorite(validated);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites", async (req, res) => {
    const { userId, rvId } = req.body;
    
    if (!userId || !rvId) {
      return res.status(400).json({ message: "User ID and RV ID are required" });
    }
    
    const success = await storage.removeFavorite(userId, rvId);
    if (!success) {
      return res.status(404).json({ message: "Favorite not found" });
    }
    
    res.status(204).end();
  });

  // Ranked Search endpoint
  app.post("/api/search", async (req, res) => {
    try {
      console.log('[POST /api/search] Received filters:', JSON.stringify(req.body));
      const filters = req.body;
      
      // Create filter options for basic filtering
      const filterOptions: any = {};
      
      // Apply price range filtering if provided
      if (filters.minPrice) {
        filterOptions.minPrice = parseFloat(filters.minPrice);
      }
      if (filters.maxPrice) {
        filterOptions.maxPrice = parseFloat(filters.maxPrice);
      }
      
      // Get all listings with basic filters applied
      console.log('[POST /api/search] Fetching listings with filter options:', filterOptions);
      const listings = await storage.getAllRvListings(filterOptions);
      
      // Get manufacturers to help with matching
      const manufacturers = await storage.getAllManufacturers();
      
      // Get converters and chassis types for more accurate matching
      const converters = await storage.getAllConverters();
      const chassisTypes = await storage.getAllChassisTypes();
      
      // Calculate match scores for each listing
      const results = listings.map((listing) => {
        let score = 0;
        
        // Manufacturer matching (chassis manufacturer like Prevost)
        if (filters.manufacturer && filters.manufacturer !== "all") {
          // Check direct match by ID or name
          const targetManufacturer = manufacturers.find(m => 
            m.name.toLowerCase() === filters.manufacturer.toLowerCase() || 
            m.id.toString() === filters.manufacturer
          );
          
          let manufacturerMatched = false;
          
          // Check if manufacturer ID matches
          if (targetManufacturer && targetManufacturer.id === listing.manufacturerId) {
            manufacturerMatched = true;
          }
          
          if (manufacturerMatched) {
            score += 1;
            console.log(`[Match] Listing ${listing.id} matched manufacturer "${filters.manufacturer}"`);
          }
        }
        
        // Converter matching (like Marathon, Liberty)
        if (filters.converter && filters.converter !== "all") {
          // First try to match by converter ID in the database
          if (listing.converterId) {
            const targetConverter = converters.find(c => 
              c.name.toLowerCase() === filters.converter.toLowerCase() || 
              c.id.toString() === filters.converter
            );
            
            if (targetConverter && targetConverter.id === listing.converterId) {
              score += 1;
              console.log(`[Match] Listing ${listing.id} matched converter "${filters.converter}" by ID`);
            }
          } 
          // Fallback to title search if converter ID doesn't match
          else if (listing.title && typeof filters.converter === 'string') {
            const converterName = filters.converter.toLowerCase();
            if (listing.title.toLowerCase().includes(converterName)) {
              score += 1;
              console.log(`[Match] Listing ${listing.id} matched converter "${filters.converter}" in title`);
            }
          }
        }
        
        // Chassis matching (H345, X345, etc)
        if (filters.chassis && filters.chassis !== "all") {
          // First try to match by chassis type ID in the database
          if (listing.chassisTypeId) {
            const targetChassis = chassisTypes.find(c => 
              c.name.toLowerCase() === filters.chassis.toLowerCase() || 
              c.id.toString() === filters.chassis
            );
            
            if (targetChassis && targetChassis.id === listing.chassisTypeId) {
              score += 1;
              console.log(`[Match] Listing ${listing.id} matched chassis "${filters.chassis}" by ID`);
            }
          }
          // Fallback to title search if chassis ID doesn't match
          else if (listing.title && typeof filters.chassis === 'string') {
            const chassisName = filters.chassis.toLowerCase();
            if (listing.title.toLowerCase().includes(chassisName)) {
              score += 1;
              console.log(`[Match] Listing ${listing.id} matched chassis "${filters.chassis}" in title`);
            }
          }
        }
        
        // Slides matching
        if (filters.slides && filters.slides !== "all" && 
            listing.slides === parseInt(filters.slides)) {
          score += 1;
          console.log(`[Match] Listing ${listing.id} matched slides: ${filters.slides}`);
        }
        
        // Features matching
        if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
          // We don't have features in the database yet, so we'll check the description
          // This is a temporary solution until we add the features column
          if (listing.description) {
            const matchCount = filters.features.filter((feature: string) => 
              listing.description.toLowerCase().includes(feature.toLowerCase())
            ).length;
            
            if (matchCount > 0) {
              score += matchCount;
              console.log(`[Match] Listing ${listing.id} matched ${matchCount} features in description`);
            }
          }
          
          // Future implementation when features column is added:
          // const listingFeatures = listing.features || [];
          // const matchCount = filters.features.filter(feature => 
          //   listingFeatures.includes(feature)
          // ).length;
          // 
          // if (matchCount > 0) {
          //   score += matchCount;
          //   console.log(`[Match] Listing ${listing.id} matched ${matchCount} features`);
          // }
        }
        
        return { ...listing, matchScore: score };
      });
      
      // Sort by match score (highest first)
      const sorted = results.sort((a, b) => b.matchScore - a.matchScore);
      
      console.log(`[POST /api/search] Returning ${sorted.length} ranked listings`);
      res.json(sorted);
    } catch (error) {
      console.error('[POST /api/search] Error:', error);
      res.status(500).json({ 
        message: "Failed to perform ranked search", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Inquiry endpoints
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validated = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validated);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.get("/api/listings/:id/inquiries", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    const inquiries = await storage.getRvInquiries(id);
    res.json(inquiries);
  });

  app.put("/api/inquiries/:id/read", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid inquiry ID" });
    }

    const success = await storage.markInquiryAsRead(id);
    if (!success) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    res.status(204).end();
  });

  // Debug route to verify listings and their featuredImage paths
  app.get("/debug/listings", async (req, res) => {
    try {
      console.log('[GET /debug/listings] Fetching all listings for debugging');
      
      // Use the storage API to get all listings
      const listings = await storage.getAllRvListings();
      
      // Check if each featuredImage exists in the filesystem
      
      // Format the result to show only the essential info
      const debugInfo = listings.map(listing => {
        let exists = false;
        let isExternal = false;
        
        // Check if it's an external URL or a local path
        if (listing.featuredImage && listing.featuredImage.startsWith('http')) {
          isExternal = true;
        }
        // Check if the file exists locally
        else if (listing.featuredImage) {
          const localPath = path.join(process.cwd(), 'public', listing.featuredImage);
          exists = fs.existsSync(localPath);
        }
        
        return {
          id: listing.id,
          title: listing.title,
          featuredImage: listing.featuredImage,
          isExternal, // Renamed isExternalUrl to isExternal
          fileExists: exists
        };
      });
      
      // Log the results
      console.log(`[GET /debug/listings] Found ${debugInfo.length} listings`);
      
      // Get a list of example images from the filesystem
      const imageDir = path.join(process.cwd(), 'public/images/rv_listings');
      let sampleImages = [];
      
      if (fs.existsSync(imageDir)) {
        try {
          // Get first 5 images in the directory
          const allFiles = fs.readdirSync(imageDir);
          sampleImages = allFiles.slice(0, 5).map(file => `/images/rv_listings/${file}`);
        } catch (err) {
          console.error('Error reading image directory:', err);
        }
      }
      
      res.json(debugInfo);
    } catch (error) {
      console.error('[GET /debug/listings] Error:', error);
      res.status(500).json({ 
        message: "Failed to retrieve debug listings", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
