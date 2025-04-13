import {
  users, manufacturers, rvTypes, rvListings, rvImages, favorites, inquiries,
  type User, type InsertUser,
  type Manufacturer, type InsertManufacturer,
  type RvType, type InsertRvType,
  type RvListing, type InsertRvListing,
  type RvImage, type InsertRvImage,
  type Favorite, type InsertFavorite,
  type Inquiry, type InsertInquiry
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Manufacturer operations
  getAllManufacturers(): Promise<Manufacturer[]>;
  getManufacturer(id: number): Promise<Manufacturer | undefined>;
  createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer>;
  updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer | undefined>;
  deleteManufacturer(id: number): Promise<boolean>;

  // RV Type operations
  getAllRvTypes(): Promise<RvType[]>;
  getRvType(id: number): Promise<RvType | undefined>;
  createRvType(rvType: InsertRvType): Promise<RvType>;
  updateRvType(id: number, rvType: Partial<InsertRvType>): Promise<RvType | undefined>;
  deleteRvType(id: number): Promise<boolean>;

  // RV Listing operations
  getAllRvListings(options?: { 
    limit?: number; 
    offset?: number; 
    manufacturerId?: number; 
    typeId?: number; 
    year?: number;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  }): Promise<RvListing[]>;
  getRvListing(id: number): Promise<RvListing | undefined>;
  getRvListingsByUser(userId: number): Promise<RvListing[]>;
  createRvListing(rvListing: InsertRvListing): Promise<RvListing>;
  updateRvListing(id: number, rvListing: Partial<InsertRvListing>): Promise<RvListing | undefined>;
  deleteRvListing(id: number): Promise<boolean>;
  
  // RV Images operations
  getRvImages(rvId: number): Promise<RvImage[]>;
  addRvImage(rvImage: InsertRvImage): Promise<RvImage>;
  deleteRvImage(id: number): Promise<boolean>;
  
  // Favorites operations
  getUserFavorites(userId: number): Promise<RvListing[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, rvId: number): Promise<boolean>;
  isFavorited(userId: number, rvId: number): Promise<boolean>;
  
  // Inquiry operations
  getRvInquiries(rvId: number): Promise<Inquiry[]>;
  getUserInquiries(userId: number): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  markInquiryAsRead(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private manufacturers: Map<number, Manufacturer>;
  private rvTypes: Map<number, RvType>;
  private rvListings: Map<number, RvListing>;
  private rvImages: Map<number, RvImage>;
  private favorites: Map<number, Favorite>;
  private inquiries: Map<number, Inquiry>;

  private userId: number;
  private manufacturerId: number;
  private rvTypeId: number;
  private rvListingId: number;
  private rvImageId: number;
  private favoriteId: number;
  private inquiryId: number;

  constructor() {
    this.users = new Map();
    this.manufacturers = new Map();
    this.rvTypes = new Map();
    this.rvListings = new Map();
    this.rvImages = new Map();
    this.favorites = new Map();
    this.inquiries = new Map();

    this.userId = 1;
    this.manufacturerId = 1;
    this.rvTypeId = 1;
    this.rvListingId = 1;
    this.rvImageId = 1;
    this.favoriteId = 1;
    this.inquiryId = 1;

    // Initialize with seed data
    this.seedData();
  }

  private seedData() {
    // Seed manufacturers
    const manufacturerNames = ["Prevost", "Newmar", "Entegra", "Tiffin", "Foretravel", "Marathon"];
    manufacturerNames.forEach(name => {
      this.createManufacturer({
        name,
        logoUrl: "",
        description: `${name} is a leading manufacturer of luxury RVs.`
      });
    });

    // Seed RV Types
    const typeData = [
      { name: "Class A Motorhomes", description: "Premium luxury diesel pushers", imageUrl: "" },
      { name: "Luxury Fifth Wheels", description: "High-end towable RVs", imageUrl: "" },
      { name: "Class B Campervans", description: "Compact luxury for adventures", imageUrl: "" },
      { name: "Super C Motorhomes", description: "Power and luxury combined", imageUrl: "" }
    ];
    
    typeData.forEach(type => {
      this.createRvType(type);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Manufacturer operations
  async getAllManufacturers(): Promise<Manufacturer[]> {
    return Array.from(this.manufacturers.values());
  }

  async getManufacturer(id: number): Promise<Manufacturer | undefined> {
    return this.manufacturers.get(id);
  }

  async createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer> {
    const id = this.manufacturerId++;
    const newManufacturer: Manufacturer = { ...manufacturer, id };
    this.manufacturers.set(id, newManufacturer);
    return newManufacturer;
  }

  async updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer | undefined> {
    const existingManufacturer = this.manufacturers.get(id);
    if (!existingManufacturer) return undefined;
    
    const updatedManufacturer = { ...existingManufacturer, ...manufacturer };
    this.manufacturers.set(id, updatedManufacturer);
    return updatedManufacturer;
  }

  async deleteManufacturer(id: number): Promise<boolean> {
    return this.manufacturers.delete(id);
  }

  // RV Type operations
  async getAllRvTypes(): Promise<RvType[]> {
    return Array.from(this.rvTypes.values());
  }

  async getRvType(id: number): Promise<RvType | undefined> {
    return this.rvTypes.get(id);
  }

  async createRvType(rvType: InsertRvType): Promise<RvType> {
    const id = this.rvTypeId++;
    const newRvType: RvType = { ...rvType, id };
    this.rvTypes.set(id, newRvType);
    return newRvType;
  }

  async updateRvType(id: number, rvType: Partial<InsertRvType>): Promise<RvType | undefined> {
    const existingRvType = this.rvTypes.get(id);
    if (!existingRvType) return undefined;
    
    const updatedRvType = { ...existingRvType, ...rvType };
    this.rvTypes.set(id, updatedRvType);
    return updatedRvType;
  }

  async deleteRvType(id: number): Promise<boolean> {
    return this.rvTypes.delete(id);
  }

  // RV Listing operations
  async getAllRvListings(options?: { 
    limit?: number; 
    offset?: number; 
    manufacturerId?: number; 
    typeId?: number; 
    year?: number;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  }): Promise<RvListing[]> {
    let listings = Array.from(this.rvListings.values());
    
    if (options) {
      if (options.manufacturerId) {
        listings = listings.filter(rv => rv.manufacturerId === options.manufacturerId);
      }
      
      if (options.typeId) {
        listings = listings.filter(rv => rv.typeId === options.typeId);
      }
      
      if (options.year) {
        listings = listings.filter(rv => rv.year === options.year);
      }
      
      if (options.minPrice) {
        listings = listings.filter(rv => rv.price >= options.minPrice!);
      }
      
      if (options.maxPrice) {
        listings = listings.filter(rv => rv.price <= options.maxPrice!);
      }
      
      if (options.featured !== undefined) {
        listings = listings.filter(rv => rv.isFeatured === options.featured);
      }
      
      // Apply pagination
      if (options.offset) {
        listings = listings.slice(options.offset);
      }
      
      if (options.limit) {
        listings = listings.slice(0, options.limit);
      }
    }
    
    return listings;
  }

  async getRvListing(id: number): Promise<RvListing | undefined> {
    return this.rvListings.get(id);
  }

  async getRvListingsByUser(userId: number): Promise<RvListing[]> {
    return Array.from(this.rvListings.values()).filter(
      rv => rv.sellerId === userId
    );
  }

  async createRvListing(rvListing: InsertRvListing): Promise<RvListing> {
    const id = this.rvListingId++;
    const now = new Date();
    const newRvListing: RvListing = { 
      ...rvListing, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.rvListings.set(id, newRvListing);
    return newRvListing;
  }

  async updateRvListing(id: number, rvListing: Partial<InsertRvListing>): Promise<RvListing | undefined> {
    const existingRvListing = this.rvListings.get(id);
    if (!existingRvListing) return undefined;
    
    const now = new Date();
    const updatedRvListing = { 
      ...existingRvListing, 
      ...rvListing,
      updatedAt: now
    };
    this.rvListings.set(id, updatedRvListing);
    return updatedRvListing;
  }

  async deleteRvListing(id: number): Promise<boolean> {
    return this.rvListings.delete(id);
  }

  // RV Images operations
  async getRvImages(rvId: number): Promise<RvImage[]> {
    return Array.from(this.rvImages.values()).filter(
      img => img.rvId === rvId
    );
  }

  async addRvImage(rvImage: InsertRvImage): Promise<RvImage> {
    const id = this.rvImageId++;
    const newRvImage: RvImage = { ...rvImage, id };
    this.rvImages.set(id, newRvImage);
    return newRvImage;
  }

  async deleteRvImage(id: number): Promise<boolean> {
    return this.rvImages.delete(id);
  }

  // Favorites operations
  async getUserFavorites(userId: number): Promise<RvListing[]> {
    const userFavorites = Array.from(this.favorites.values()).filter(
      fav => fav.userId === userId
    );
    
    const favoriteRvIds = userFavorites.map(fav => fav.rvId);
    
    return Array.from(this.rvListings.values()).filter(
      rv => favoriteRvIds.includes(rv.id)
    );
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const id = this.favoriteId++;
    const now = new Date();
    const newFavorite: Favorite = { 
      ...favorite, 
      id, 
      createdAt: now
    };
    this.favorites.set(id, newFavorite);
    return newFavorite;
  }

  async removeFavorite(userId: number, rvId: number): Promise<boolean> {
    const favoriteToRemove = Array.from(this.favorites.values()).find(
      fav => fav.userId === userId && fav.rvId === rvId
    );
    
    if (!favoriteToRemove) return false;
    
    return this.favorites.delete(favoriteToRemove.id);
  }

  async isFavorited(userId: number, rvId: number): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      fav => fav.userId === userId && fav.rvId === rvId
    );
  }

  // Inquiry operations
  async getRvInquiries(rvId: number): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).filter(
      inquiry => inquiry.rvId === rvId
    );
  }

  async getUserInquiries(userId: number): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).filter(
      inquiry => inquiry.userId === userId
    );
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.inquiryId++;
    const now = new Date();
    const newInquiry: Inquiry = { 
      ...inquiry, 
      id, 
      createdAt: now,
      isRead: false
    };
    this.inquiries.set(id, newInquiry);
    return newInquiry;
  }

  async markInquiryAsRead(id: number): Promise<boolean> {
    const inquiry = this.inquiries.get(id);
    if (!inquiry) return false;
    
    const updatedInquiry = { ...inquiry, isRead: true };
    this.inquiries.set(id, updatedInquiry);
    return true;
  }
}

export const storage = new MemStorage();
