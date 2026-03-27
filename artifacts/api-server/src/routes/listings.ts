import { Router } from "express";
import { db, listingsTable, usersTable } from "@workspace/db";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, type AuthPayload } from "../middleware/auth.js";

const router = Router();

router.get("/listings", async (req, res) => {
  const { category, search, sort = "distance" } = req.query as Record<string, string>;

  let conditions: any[] = [eq(listingsTable.isActive, true)];
  if (category && category !== "all") {
    conditions.push(eq(listingsTable.category, category as any));
  }
  if (search) {
    conditions.push(
      or(
        ilike(listingsTable.title, `%${search}%`),
        ilike(listingsTable.description, `%${search}%`),
        ilike(listingsTable.providerName, `%${search}%`),
      )
    );
  }

  const orderBy = sort === "rating" ? desc(listingsTable.providerRating) : asc(listingsTable.createdAt);

  const listings = await db
    .select()
    .from(listingsTable)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(50);

  res.json(listings);
});

router.get("/listings/:id", async (req, res) => {
  const { id } = req.params;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }
  res.json(listing);
});

router.post("/listings", requireAuth, async (req, res) => {
  const { userId, name, role } = (req as any).user as AuthPayload;
  if (role !== "provider") {
    res.status(403).json({ error: "Only providers can create listings" });
    return;
  }

  const schema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(10).max(1000),
    category: z.enum(["tutoring", "tailoring", "homefood", "repair", "cleaning", "beauty", "gardening", "plumbing"]),
    price: z.number().positive(),
    priceType: z.enum(["hourly", "fixed", "negotiable"]).default("hourly"),
    location: z.string().min(2),
    latitude: z.number(),
    longitude: z.number(),
    availabilityDays: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }

  const id = `lst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const [listing] = await db.insert(listingsTable).values({
    id,
    providerId: userId,
    providerName: name,
    providerRating: 0,
    ...parsed.data,
  }).returning();

  res.status(201).json(listing);
});

router.patch("/listings/:id", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { id } = req.params;

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing || existing.providerId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const schema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    priceType: z.enum(["hourly", "fixed", "negotiable"]).optional(),
    location: z.string().optional(),
    availabilityDays: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const [updated] = await db
    .update(listingsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(listingsTable.id, id))
    .returning();

  res.json(updated);
});

router.delete("/listings/:id", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { id } = req.params;

  const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
  if (!existing || existing.providerId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(listingsTable).where(eq(listingsTable.id, id));
  res.json({ success: true });
});

router.get("/listings/provider/:providerId", async (req, res) => {
  const { providerId } = req.params;
  const listings = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.providerId, providerId))
    .orderBy(desc(listingsTable.createdAt));
  res.json(listings);
});

export default router;
