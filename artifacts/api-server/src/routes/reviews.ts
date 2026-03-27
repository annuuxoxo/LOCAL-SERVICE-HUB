import { Router } from "express";
import { db, reviewsTable, listingsTable, usersTable, serviceRequestsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, type AuthPayload } from "../middleware/auth.js";

const router = Router();

router.get("/reviews/provider/:providerId", async (req, res) => {
  const { providerId } = req.params;
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.providerId, providerId))
    .orderBy(desc(reviewsTable.createdAt));
  res.json(reviews);
});

router.get("/reviews/listing/:listingId", async (req, res) => {
  const { listingId } = req.params;
  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.listingId, listingId))
    .orderBy(desc(reviewsTable.createdAt));
  res.json(reviews);
});

router.post("/reviews", requireAuth, async (req, res) => {
  const { userId, name } = (req as any).user as AuthPayload;

  const schema = z.object({
    providerId: z.string(),
    listingId: z.string(),
    requestId: z.string(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(5).max(1000),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }

  const existing = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.requestId, parsed.data.requestId))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Review already submitted for this request" });
    return;
  }

  const revId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const [review] = await db.insert(reviewsTable).values({
    id: revId,
    providerId: parsed.data.providerId,
    seekerId: userId,
    seekerName: name,
    listingId: parsed.data.listingId,
    requestId: parsed.data.requestId,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  }).returning();

  const allProviderReviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.providerId, parsed.data.providerId));

  const avgRating = allProviderReviews.reduce((sum, r) => sum + r.rating, 0) / allProviderReviews.length;
  const roundedAvg = Math.round(avgRating * 10) / 10;

  await db
    .update(usersTable)
    .set({ rating: roundedAvg, reviewCount: allProviderReviews.length, updatedAt: new Date() })
    .where(eq(usersTable.id, parsed.data.providerId));

  await db
    .update(listingsTable)
    .set({
      providerRating: roundedAvg,
      reviewCount: allProviderReviews.length,
      updatedAt: new Date(),
    })
    .where(eq(listingsTable.providerId, parsed.data.providerId));

  await db.update(serviceRequestsTable)
    .set({ updatedAt: new Date() })
    .where(eq(serviceRequestsTable.id, parsed.data.requestId));

  res.status(201).json(review);
});

export default router;
