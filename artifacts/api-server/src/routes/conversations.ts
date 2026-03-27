import { Router } from "express";
import { db, conversationsTable, conversationParticipantsTable, messagesTable } from "@workspace/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, type AuthPayload } from "../middleware/auth.js";

const router = Router();

router.get("/conversations", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;

  const myConvos = await db
    .select({ conversationId: conversationParticipantsTable.conversationId })
    .from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.userId, userId));

  const convIds = myConvos.map((c) => c.conversationId);
  if (convIds.length === 0) {
    res.json([]);
    return;
  }

  const result = [];
  for (const convId of convIds) {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, convId))
      .limit(1);

    if (!conv) continue;

    const participants = await db
      .select()
      .from(conversationParticipantsTable)
      .where(eq(conversationParticipantsTable.conversationId, convId));

    const lastMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, convId))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);

    const myParticipant = participants.find((p) => p.userId === userId);

    result.push({
      id: conv.id,
      requestId: conv.requestId,
      participants: participants.map((p) => ({ userId: p.userId, userName: p.userName })),
      lastMessage: lastMessages[0]?.text ?? null,
      lastMessageTime: lastMessages[0]?.createdAt ?? null,
      unreadCount: parseInt(myParticipant?.unreadCount ?? "0"),
      createdAt: conv.createdAt,
    });
  }

  result.sort((a, b) => {
    const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return bTime - aTime;
  });

  res.json(result);
});

router.get("/conversations/:id", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { id } = req.params;

  const participant = await db
    .select()
    .from(conversationParticipantsTable)
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, id),
        eq(conversationParticipantsTable.userId, userId)
      )
    )
    .limit(1);

  if (!participant.length) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id))
    .limit(1);

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const participants = await db
    .select()
    .from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.conversationId, id));

  res.json({
    id: conv.id,
    requestId: conv.requestId,
    participants: participants.map((p) => ({ userId: p.userId, userName: p.userName })),
    createdAt: conv.createdAt,
  });
});

router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { id } = req.params;

  const hasAccess = await db
    .select()
    .from(conversationParticipantsTable)
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, id),
        eq(conversationParticipantsTable.userId, userId)
      )
    )
    .limit(1);

  if (!hasAccess.length) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(
      and(
        eq(messagesTable.conversationId, id),
        eq(messagesTable.isRead, false)
      )
    );

  await db
    .update(conversationParticipantsTable)
    .set({ unreadCount: "0" })
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, id),
        eq(conversationParticipantsTable.userId, userId)
      )
    );

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));

  res.json(messages);
});

router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  const { userId, name } = (req as any).user as AuthPayload;
  const { id } = req.params;

  const hasAccess = await db
    .select()
    .from(conversationParticipantsTable)
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, id),
        eq(conversationParticipantsTable.userId, userId)
      )
    )
    .limit(1);

  if (!hasAccess.length) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const schema = z.object({ text: z.string().min(1).max(2000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const [message] = await db.insert(messagesTable).values({
    id: msgId,
    conversationId: id,
    senderId: userId,
    senderName: name,
    text: parsed.data.text,
    isRead: false,
  }).returning();

  const others = await db
    .select()
    .from(conversationParticipantsTable)
    .where(
      and(
        eq(conversationParticipantsTable.conversationId, id),
      )
    );

  for (const p of others) {
    if (p.userId !== userId) {
      await db
        .update(conversationParticipantsTable)
        .set({ unreadCount: String(parseInt(p.unreadCount) + 1) })
        .where(
          and(
            eq(conversationParticipantsTable.conversationId, id),
            eq(conversationParticipantsTable.userId, p.userId)
          )
        );
    }
  }

  res.status(201).json(message);
});

export default router;
