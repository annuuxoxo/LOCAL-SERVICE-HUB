import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, type AuthPayload } from "../middleware/auth.js";

const router = Router();

router.get("/notifications", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const notifs = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(notifs);
});

router.patch("/notifications/:id/read", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { id } = req.params;

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id));

  res.json({ success: true });
});

router.patch("/notifications/read-all", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, userId));
  res.json({ success: true });
});

export default router;
