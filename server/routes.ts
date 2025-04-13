import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertRvListingSchema, insertInquirySchema, insertFavoriteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const apiRouter = app.use("/api", (req, res, next) => {
    next();
  });

  // Manufacturers endpoints
  app.get("/api/manufacturers", async (req, res) => {
    const manufacturers = await storage.getAllManufacturers();
    res.json(manufacturers);
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
    const { limit, offset, manufacturerId, typeId, year, minPrice, maxPrice, featured } = req.query;
    
    const options: any = {};
    
    if (limit) options.limit = parseInt(limit as string);
    if (offset) options.offset = parseInt(offset as string);
    if (manufacturerId) options.manufacturerId = parseInt(manufacturerId as string);
    if (typeId) options.typeId = parseInt(typeId as string);
    if (year) options.year = parseInt(year as string);
    if (minPrice) options.minPrice = parseFloat(minPrice as string);
    if (maxPrice) options.maxPrice = parseFloat(maxPrice as string);
    if (featured === 'true') options.featured = true;
    
    const listings = await storage.getAllRvListings(options);
    res.json(listings);
  });

  app.get("/api/listings/featured", async (req, res) => {
    const listings = await storage.getAllRvListings({ featured: true, limit: 8 });
    res.json(listings);
  });

  app.get("/api/listings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    const listing = await storage.getRvListing(id);
    if (!listing) {
      return res.status(404).json({ message: "RV listing not found" });
    }

    res.json(listing);
  });

  app.post("/api/listings", async (req, res) => {
    try {
      const validated = insertRvListingSchema.parse(req.body);
      const listing = await storage.createRvListing(validated);
      res.status(201).json(listing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid listing data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create listing" });
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
    
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // In a real app, we would set up a session here
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
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

  const httpServer = createServer(app);

  return httpServer;
}
