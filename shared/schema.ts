import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// RV Manufacturers
export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
  description: text("description"),
});

// RV Types/Categories
export const rvTypes = pgTable("rv_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
});

// RV Listings
export const rvListings = pgTable("rv_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  year: integer("year").notNull(),
  price: doublePrecision("price").notNull(),
  manufacturerId: integer("manufacturer_id").notNull(),
  typeId: integer("type_id").notNull(),
  length: doublePrecision("length"),
  mileage: integer("mileage"),
  location: text("location").notNull(),
  fuelType: text("fuel_type"),
  bedType: text("bed_type"),
  slides: integer("slides"),
  featuredImage: text("featured_image").notNull(),
  isFeatured: boolean("is_featured").default(false),
  sellerId: integer("seller_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RV Images
export const rvImages = pgTable("rv_images", {
  id: serial("id").primaryKey(),
  rvId: integer("rv_id").notNull(),
  imageUrl: text("image_url").notNull(),
  isPrimary: boolean("is_primary").default(false),
});

// Favorites/Saved RVs
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rvId: integer("rv_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inquiries
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  rvId: integer("rv_id").notNull(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  createdAt: true,
});

export const insertManufacturerSchema = createInsertSchema(manufacturers).omit({
  id: true,
});

export const insertRvTypeSchema = createInsertSchema(rvTypes).omit({
  id: true,
});

export const insertRvListingSchema = createInsertSchema(rvListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRvImageSchema = createInsertSchema(rvImages).omit({
  id: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// Create types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Manufacturer = typeof manufacturers.$inferSelect;
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;

export type RvType = typeof rvTypes.$inferSelect;
export type InsertRvType = z.infer<typeof insertRvTypeSchema>;

export type RvListing = typeof rvListings.$inferSelect;
export type InsertRvListing = z.infer<typeof insertRvListingSchema>;

export type RvImage = typeof rvImages.$inferSelect;
export type InsertRvImage = z.infer<typeof insertRvImageSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
