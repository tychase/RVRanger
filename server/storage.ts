import {
  users, manufacturers, rvTypes, rvListings, rvImages, favorites, inquiries, converters, chassisTypes,
  type User, type InsertUser,
  type Manufacturer, type InsertManufacturer,
  type RvType, type InsertRvType,
  type RvListing, type InsertRvListing,
  type RvImage, type InsertRvImage,
  type Favorite, type InsertFavorite,
  type Inquiry, type InsertInquiry,
  type Converter, type InsertConverter,
  type ChassisType, type InsertChassisType
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
  
  // Converter operations
  getAllConverters(): Promise<Converter[]>;
  getConverter(id: number): Promise<Converter | undefined>;
  createConverter(converter: InsertConverter): Promise<Converter>;
  updateConverter(id: number, converter: Partial<InsertConverter>): Promise<Converter | undefined>;
  deleteConverter(id: number): Promise<boolean>;
  
  // Chassis Type operations
  getAllChassisTypes(): Promise<ChassisType[]>;
  getChassisType(id: number): Promise<ChassisType | undefined>;
  createChassisType(chassisType: InsertChassisType): Promise<ChassisType>;
  updateChassisType(id: number, chassisType: Partial<InsertChassisType>): Promise<ChassisType | undefined>;
  deleteChassisType(id: number): Promise<boolean>;

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

import { db } from "./db";
import { eq, and, gte, lte, sql, asc, desc, or, ilike } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Manufacturer operations
  async getAllManufacturers(): Promise<Manufacturer[]> {
    return await db.select().from(manufacturers);
  }

  async getManufacturer(id: number): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.select().from(manufacturers).where(eq(manufacturers.id, id));
    return manufacturer;
  }

  async createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer> {
    const [newManufacturer] = await db.insert(manufacturers).values(manufacturer).returning();
    return newManufacturer;
  }

  async updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer | undefined> {
    const [updatedManufacturer] = await db
      .update(manufacturers)
      .set(manufacturer)
      .where(eq(manufacturers.id, id))
      .returning();
    return updatedManufacturer;
  }

  async deleteManufacturer(id: number): Promise<boolean> {
    const result = await db
      .delete(manufacturers)
      .where(eq(manufacturers.id, id))
      .returning({ id: manufacturers.id });
    return result.length > 0;
  }
  
  // Converter operations
  async getAllConverters(): Promise<Converter[]> {
    return await db.select().from(converters);
  }

  async getConverter(id: number): Promise<Converter | undefined> {
    const [converter] = await db.select().from(converters).where(eq(converters.id, id));
    return converter;
  }

  async createConverter(converter: InsertConverter): Promise<Converter> {
    const [newConverter] = await db.insert(converters).values(converter).returning();
    return newConverter;
  }

  async updateConverter(id: number, converter: Partial<InsertConverter>): Promise<Converter | undefined> {
    const [updatedConverter] = await db
      .update(converters)
      .set(converter)
      .where(eq(converters.id, id))
      .returning();
    return updatedConverter;
  }

  async deleteConverter(id: number): Promise<boolean> {
    const result = await db
      .delete(converters)
      .where(eq(converters.id, id))
      .returning({ id: converters.id });
    return result.length > 0;
  }
  
  // Chassis Type operations
  async getAllChassisTypes(): Promise<ChassisType[]> {
    return await db.select().from(chassisTypes);
  }

  async getChassisType(id: number): Promise<ChassisType | undefined> {
    const [chassisType] = await db.select().from(chassisTypes).where(eq(chassisTypes.id, id));
    return chassisType;
  }

  async createChassisType(chassisType: InsertChassisType): Promise<ChassisType> {
    const [newChassisType] = await db.insert(chassisTypes).values(chassisType).returning();
    return newChassisType;
  }

  async updateChassisType(id: number, chassisType: Partial<InsertChassisType>): Promise<ChassisType | undefined> {
    const [updatedChassisType] = await db
      .update(chassisTypes)
      .set(chassisType)
      .where(eq(chassisTypes.id, id))
      .returning();
    return updatedChassisType;
  }

  async deleteChassisType(id: number): Promise<boolean> {
    const result = await db
      .delete(chassisTypes)
      .where(eq(chassisTypes.id, id))
      .returning({ id: chassisTypes.id });
    return result.length > 0;
  }

  // RV Type operations
  async getAllRvTypes(): Promise<RvType[]> {
    return await db.select().from(rvTypes);
  }

  async getRvType(id: number): Promise<RvType | undefined> {
    const [rvType] = await db.select().from(rvTypes).where(eq(rvTypes.id, id));
    return rvType;
  }

  async createRvType(rvType: InsertRvType): Promise<RvType> {
    const [newRvType] = await db.insert(rvTypes).values(rvType).returning();
    return newRvType;
  }

  async updateRvType(id: number, rvType: Partial<InsertRvType>): Promise<RvType | undefined> {
    const [updatedRvType] = await db
      .update(rvTypes)
      .set(rvType)
      .where(eq(rvTypes.id, id))
      .returning();
    return updatedRvType;
  }

  async deleteRvType(id: number): Promise<boolean> {
    const result = await db
      .delete(rvTypes)
      .where(eq(rvTypes.id, id))
      .returning({ id: rvTypes.id });
    return result.length > 0;
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
    minMileage?: number;
    maxMileage?: number;
    minLength?: number;
    maxLength?: number;
    bedType?: string;
    fuelType?: string;
    slides?: number;
    featured?: boolean;
    searchTerm?: string;
  }): Promise<RvListing[]> {
    // Explicitly specify columns that exist in the database
    // This avoids issues with schema changes that haven't been migrated yet
    let query = db.select({
      id: rvListings.id,
      title: rvListings.title,
      description: rvListings.description,
      year: rvListings.year,
      price: rvListings.price,
      manufacturerId: rvListings.manufacturerId,
      converterId: rvListings.converterId,
      chassisTypeId: rvListings.chassisTypeId,
      typeId: rvListings.typeId,
      length: rvListings.length,
      mileage: rvListings.mileage,
      location: rvListings.location,
      fuelType: rvListings.fuelType,
      bedType: rvListings.bedType,
      slides: rvListings.slides,
      featuredImage: rvListings.featuredImage,
      isFeatured: rvListings.isFeatured,
      sellerId: rvListings.sellerId,
      createdAt: rvListings.createdAt,
      updatedAt: rvListings.updatedAt
    }).from(rvListings);
    
    if (options) {
      let conditions = [];
      
      if (options.manufacturerId) {
        conditions.push(eq(rvListings.manufacturerId, options.manufacturerId));
      }
      
      if (options.typeId) {
        conditions.push(eq(rvListings.typeId, options.typeId));
      }
      
      if (options.year) {
        conditions.push(eq(rvListings.year, options.year));
      }
      
      if (options.minPrice) {
        conditions.push(gte(rvListings.price, options.minPrice));
      }
      
      if (options.maxPrice) {
        conditions.push(lte(rvListings.price, options.maxPrice));
      }
      
      if (options.minMileage !== undefined) {
        conditions.push(gte(rvListings.mileage, options.minMileage));
      }
      
      if (options.maxMileage !== undefined) {
        conditions.push(lte(rvListings.mileage, options.maxMileage));
      }
      
      if (options.minLength !== undefined) {
        conditions.push(gte(rvListings.length, options.minLength));
      }
      
      if (options.maxLength !== undefined) {
        conditions.push(lte(rvListings.length, options.maxLength));
      }
      
      if (options.bedType) {
        conditions.push(eq(rvListings.bedType, options.bedType));
      }
      
      if (options.fuelType) {
        conditions.push(eq(rvListings.fuelType, options.fuelType));
      }
      
      if (options.slides !== undefined) {
        conditions.push(eq(rvListings.slides, options.slides));
      }
      
      if (options.featured !== undefined) {
        conditions.push(eq(rvListings.isFeatured, options.featured));
      }
      
      // Text search on title and description
      if (options.searchTerm) {
        conditions.push(or(
          ilike(rvListings.title, `%${options.searchTerm}%`),
          ilike(rvListings.description, `%${options.searchTerm}%`)
        ));
      }
      
      if (conditions.length > 0) {
        // Apply all conditions with AND
        query = query.where(and(...conditions));
      }
      
      // Apply order by (newest first)
      query = query.orderBy(desc(rvListings.id));
      
      // Apply pagination
      if (options.limit !== undefined) {
        query = query.limit(options.limit);
      }
      
      if (options.offset !== undefined) {
        query = query.offset(options.offset);
      }
    }
    
    const result = await query;
    return result;
  }

  async getRvListing(id: number): Promise<RvListing | undefined> {
    const [listing] = await db.select({
      id: rvListings.id,
      title: rvListings.title,
      description: rvListings.description,
      year: rvListings.year,
      price: rvListings.price,
      manufacturerId: rvListings.manufacturerId,
      converterId: rvListings.converterId,
      chassisTypeId: rvListings.chassisTypeId,
      typeId: rvListings.typeId,
      length: rvListings.length,
      mileage: rvListings.mileage,
      location: rvListings.location,
      fuelType: rvListings.fuelType,
      bedType: rvListings.bedType,
      slides: rvListings.slides,
      featuredImage: rvListings.featuredImage,
      isFeatured: rvListings.isFeatured,
      sellerId: rvListings.sellerId,
      createdAt: rvListings.createdAt,
      updatedAt: rvListings.updatedAt
    }).from(rvListings).where(eq(rvListings.id, id));
    return listing;
  }

  async getRvListingsByUser(userId: number): Promise<RvListing[]> {
    return await db
      .select({
        id: rvListings.id,
        title: rvListings.title,
        description: rvListings.description,
        year: rvListings.year,
        price: rvListings.price,
        manufacturerId: rvListings.manufacturerId,
        converterId: rvListings.converterId,
        chassisTypeId: rvListings.chassisTypeId,
        typeId: rvListings.typeId,
        length: rvListings.length,
        mileage: rvListings.mileage,
        location: rvListings.location,
        fuelType: rvListings.fuelType,
        bedType: rvListings.bedType,
        slides: rvListings.slides,
        featuredImage: rvListings.featuredImage,
        isFeatured: rvListings.isFeatured,
        sellerId: rvListings.sellerId,
        createdAt: rvListings.createdAt,
        updatedAt: rvListings.updatedAt
      })
      .from(rvListings)
      .where(eq(rvListings.sellerId, userId));
  }

  async createRvListing(rvListing: InsertRvListing): Promise<RvListing> {
    const [newListing] = await db.insert(rvListings).values(rvListing).returning();
    return newListing;
  }

  async updateRvListing(id: number, rvListing: Partial<InsertRvListing>): Promise<RvListing | undefined> {
    const [updatedListing] = await db
      .update(rvListings)
      .set({
        ...rvListing,
        updatedAt: new Date()
      })
      .where(eq(rvListings.id, id))
      .returning();
    return updatedListing;
  }

  async deleteRvListing(id: number): Promise<boolean> {
    const result = await db
      .delete(rvListings)
      .where(eq(rvListings.id, id))
      .returning({ id: rvListings.id });
    return result.length > 0;
  }

  // RV Images operations
  async getRvImages(rvId: number): Promise<RvImage[]> {
    return await db
      .select()
      .from(rvImages)
      .where(eq(rvImages.rvId, rvId));
  }

  async addRvImage(rvImage: InsertRvImage): Promise<RvImage> {
    const [newImage] = await db.insert(rvImages).values(rvImage).returning();
    return newImage;
  }

  async deleteRvImage(id: number): Promise<boolean> {
    const result = await db
      .delete(rvImages)
      .where(eq(rvImages.id, id))
      .returning({ id: rvImages.id });
    return result.length > 0;
  }

  // Favorites operations
  async getUserFavorites(userId: number): Promise<RvListing[]> {
    const userFavorites = await db
      .select({
        rvId: favorites.rvId
      })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    const favoriteRvIds = userFavorites.map(fav => fav.rvId);
    
    if (favoriteRvIds.length === 0) {
      return [];
    }
    
    return await db
      .select({
        id: rvListings.id,
        title: rvListings.title,
        description: rvListings.description,
        year: rvListings.year,
        price: rvListings.price,
        manufacturerId: rvListings.manufacturerId,
        converterId: rvListings.converterId,
        chassisTypeId: rvListings.chassisTypeId,
        typeId: rvListings.typeId,
        length: rvListings.length,
        mileage: rvListings.mileage,
        location: rvListings.location,
        fuelType: rvListings.fuelType,
        bedType: rvListings.bedType,
        slides: rvListings.slides,
        featuredImage: rvListings.featuredImage,
        isFeatured: rvListings.isFeatured,
        sellerId: rvListings.sellerId,
        createdAt: rvListings.createdAt,
        updatedAt: rvListings.updatedAt
      })
      .from(rvListings)
      .where(
        sql`${rvListings.id} IN (${favoriteRvIds.join(',')})`
      );
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: number, rvId: number): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.rvId, rvId)
        )
      )
      .returning({ id: favorites.id });
    return result.length > 0;
  }

  async isFavorited(userId: number, rvId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.rvId, rvId)
        )
      );
    return !!favorite;
  }

  // Inquiry operations
  async getRvInquiries(rvId: number): Promise<Inquiry[]> {
    return await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.rvId, rvId));
  }

  async getUserInquiries(userId: number): Promise<Inquiry[]> {
    return await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.userId, userId));
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [newInquiry] = await db.insert(inquiries).values(inquiry).returning();
    return newInquiry;
  }

  async markInquiryAsRead(id: number): Promise<boolean> {
    const [updatedInquiry] = await db
      .update(inquiries)
      .set({ isRead: true })
      .where(eq(inquiries.id, id))
      .returning();
    return !!updatedInquiry;
  }

  // Seed initial data if database is empty
  async seedInitialData(): Promise<void> {
    // Check if manufacturers exist
    const existingManufacturers = await this.getAllManufacturers();
    if (existingManufacturers.length === 0) {
      // Seed manufacturers
      const manufacturerNames = ["Prevost", "Newmar", "Entegra", "Tiffin", "Foretravel", "Marathon"];
      for (const name of manufacturerNames) {
        await this.createManufacturer({
          name,
          logoUrl: "",
          description: `${name} is a leading manufacturer of luxury RVs.`
        });
      }
    }

    // Check if RV types exist
    const existingTypes = await this.getAllRvTypes();
    if (existingTypes.length === 0) {
      // Seed RV Types
      const typeData = [
        { name: "Class A Motorhomes", description: "Premium luxury diesel pushers", imageUrl: "" },
        { name: "Luxury Fifth Wheels", description: "High-end towable RVs", imageUrl: "" },
        { name: "Class B Campervans", description: "Compact luxury for adventures", imageUrl: "" },
        { name: "Super C Motorhomes", description: "Power and luxury combined", imageUrl: "" }
      ];
      
      for (const type of typeData) {
        await this.createRvType(type);
      }
    }
    
    // Check if converters exist
    const existingConverters = await this.getAllConverters();
    if (existingConverters.length === 0) {
      // Seed Converters (companies that customize RV chassis)
      const converterData = [
        { name: "Marathon", description: "Marathon Coach is one of the world's largest luxury bus converter" },
        { name: "Liberty", description: "Liberty Coach is a premier luxury motorcoach manufacturer" },
        { name: "Millennium", description: "Millennium Luxury Coaches creates custom Prevost conversions" },
        { name: "Featherlite", description: "Featherlite Coaches builds luxury motorcoaches on Prevost chassis" },
        { name: "Emerald", description: "Emerald Luxury Coaches specializes in Prevost conversions" },
        { name: "Newell", description: "Newell Coach builds custom luxury motorhomes" }
      ];
      
      for (const converter of converterData) {
        await this.createConverter(converter);
      }
      console.log("Created seed converter companies");
    }
    
    // Check if chassis types exist - add more if needed
    const existingChassisTypes = await this.getAllChassisTypes();
    if (existingChassisTypes.length === 0) {
      // Seed Chassis Types for Prevost
      const chassisTypeData = [
        { name: "H3", description: "H3 chassis model." },
        { name: "X", description: "X chassis model." }
      ];
      
      for (const chassisType of chassisTypeData) {
        await this.createChassisType(chassisType);
      }
      console.log("Created seed chassis types");
    }
    
    // Check if admin user exists
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      // Create a demo admin user
      await this.createUser({
        username: "admin",
        email: "admin@example.com",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true
      });
      console.log("Created demo admin user - username: admin, password: admin123");
    }
  }
}

export const storage = new DatabaseStorage();
