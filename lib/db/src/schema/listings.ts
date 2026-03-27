import { boolean, integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  providerName: text("provider_name").notNull(),
  providerRating: real("provider_rating").notNull().default(0),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", {
    enum: ["tutoring", "tailoring", "homefood", "repair", "cleaning", "beauty", "gardening", "plumbing"],
  }).notNull(),
  price: real("price").notNull(),
  priceType: text("price_type", { enum: ["hourly", "fixed", "negotiable"] }).notNull().default("hourly"),
  location: text("location").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  availabilityDays: text("availability_days").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
  providerId: true,
  providerName: true,
  providerRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

export type Listing = typeof listingsTable.$inferSelect;
export type InsertListing = z.infer<typeof insertListingSchema>;
