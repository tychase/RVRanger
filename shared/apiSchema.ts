/**
 * API Contract Definitions
 * Shared types between frontend and backend for type safety
 */
import { z } from "zod";

// Search Parameters Schema
export const searchParamsSchema = z.object({
  q: z.string().optional(),
  make: z.string().optional(), // manufacturerId
  model: z.string().optional(), // relates to chassis model
  year_min: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  year_max: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  price_min: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  price_max: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  chassis: z.string().optional(), // chassis type
  length_min: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  length_max: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  slides: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  mileage_max: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  features: z.array(z.string()).optional(),
});

// Type for search parameters
export type SearchParams = z.infer<typeof searchParamsSchema>;

// Manufacturer aggregation for faceted search
export const manufacturerAggregationSchema = z.object({
  id: z.number(),
  name: z.string(),
  count: z.number(),
});

// Chassis type aggregation for faceted search
export const chassisAggregationSchema = z.object({
  id: z.number(),
  name: z.string(),
  count: z.number(),
});

// Year aggregation for faceted search
export const yearAggregationSchema = z.object({
  year: z.number(),
  count: z.number(),
});

// Search Response Schema
export const searchResponseSchema = z.object({
  total: z.number(),
  results: z.array(z.any()), // Using any here as we'll use the actual RvListing type from schema.ts
  aggregations: z.object({
    manufacturers: z.array(manufacturerAggregationSchema),
    chassis: z.array(chassisAggregationSchema),
    years: z.array(yearAggregationSchema),
  }),
});

// Type for search response
export type SearchResponse = z.infer<typeof searchResponseSchema>;