import { pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceRequestsTable = pgTable("service_requests", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  seekerId: text("seeker_id").notNull(),
  providerId: text("provider_id").notNull(),
  seekerName: text("seeker_name").notNull(),
  providerName: text("provider_name").notNull(),
  serviceTitle: text("service_title").notNull(),
  serviceCategory: text("service_category").notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "in_progress", "completed", "cancelled", "disputed"],
  }).notNull().default("pending"),
  message: text("message").notNull(),
  scheduledDate: text("scheduled_date"),
  price: real("price").notNull(),
  escrowAmount: real("escrow_amount").notNull(),
  escrowStatus: text("escrow_status", { enum: ["held", "released", "refunded"] }).notNull().default("held"),
  escrowTransactionId: text("escrow_transaction_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequestsTable).omit({
  id: true,
  seekerId: true,
  seekerName: true,
  providerName: true,
  escrowStatus: true,
  escrowTransactionId: true,
  createdAt: true,
  updatedAt: true,
});

export type ServiceRequest = typeof serviceRequestsTable.$inferSelect;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
