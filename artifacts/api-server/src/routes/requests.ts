import { Router } from "express";
import { db, serviceRequestsTable, listingsTable, notificationsTable, conversationsTable, conversationParticipantsTable } from "@workspace/db";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, type AuthPayload } from "../middleware/auth.js";

const router = Router();

router.get("/requests", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;

  const requests = await db
    .select()
    .from(serviceRequestsTable)
    .where(or(
      eq(serviceRequestsTable.seekerId, userId),
      eq(serviceRequestsTable.providerId, userId)
    ))
    .orderBy(desc(serviceRequestsTable.createdAt));

  res.json(requests);
});

router.get("/requests/:id", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { id } = req.params;

  const [request] = await db
    .select()
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.id, id))
    .limit(1);

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (request.seekerId !== userId && request.providerId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  res.json(request);
});

router.post("/requests", requireAuth, async (req, res) => {
  const { userId, name } = (req as any).user as AuthPayload;

  const schema = z.object({
    listingId: z.string(),
    providerId: z.string(),
    message: z.string().min(5),
    scheduledDate: z.string().optional(),
    price: z.number().positive(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }

  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, parsed.data.listingId))
    .limit(1);

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const txnId = `txn_${Date.now()}`;

  const [request] = await db.insert(serviceRequestsTable).values({
    id: reqId,
    listingId: parsed.data.listingId,
    seekerId: userId,
    providerId: parsed.data.providerId,
    seekerName: name,
    providerName: listing.providerName,
    serviceTitle: listing.title,
    serviceCategory: listing.category,
    status: "pending",
    message: parsed.data.message,
    scheduledDate: parsed.data.scheduledDate ?? null,
    price: parsed.data.price,
    escrowAmount: parsed.data.price,
    escrowStatus: "held",
    escrowTransactionId: txnId,
  }).returning();

  const convId = `conv_${reqId}`;
  await db.insert(conversationsTable).values({
    id: convId,
    requestId: reqId,
  });
  await db.insert(conversationParticipantsTable).values([
    { conversationId: convId, userId, userName: name, unreadCount: "0" },
    { conversationId: convId, userId: parsed.data.providerId, userName: listing.providerName, unreadCount: "0" },
  ]);

  const notifId = `notif_${Date.now()}`;
  await db.insert(notificationsTable).values({
    id: notifId,
    userId: parsed.data.providerId,
    type: "request_received",
    title: "New Service Request",
    body: `${name} sent a request for "${listing.title}"`,
    data: { requestId: reqId },
  });

  res.status(201).json(request);
});

router.patch("/requests/:id/status", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { id } = req.params;

  const schema = z.object({
    status: z.enum(["accepted", "in_progress", "completed", "cancelled", "disputed"]),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const [existing] = await db
    .select()
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.id, id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const { status } = parsed.data;
  const isProvider = existing.providerId === userId;
  const isSeeker = existing.seekerId === userId;

  if (!isProvider && !isSeeker) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  let escrowStatus = existing.escrowStatus;
  if (status === "completed") escrowStatus = "released";
  if (status === "cancelled") escrowStatus = "refunded";

  const [updated] = await db
    .update(serviceRequestsTable)
    .set({ status, escrowStatus, updatedAt: new Date() })
    .where(eq(serviceRequestsTable.id, id))
    .returning();

  const notifUserId = isProvider ? existing.seekerId : existing.providerId;
  const notifId = `notif_${Date.now()}`;
  await db.insert(notificationsTable).values({
    id: notifId,
    userId: notifUserId,
    type: status === "accepted" ? "request_accepted" : status === "completed" ? "request_completed" : "payment",
    title: status === "accepted"
      ? "Request Accepted!"
      : status === "completed"
        ? "Service Completed"
        : "Request Updated",
    body: status === "accepted"
      ? `Your request for "${existing.serviceTitle}" was accepted`
      : status === "completed"
        ? `Payment of ₹${existing.price} released from escrow`
        : `Request status changed to ${status}`,
    data: { requestId: id },
  });

  res.json(updated);
});

export default router;
