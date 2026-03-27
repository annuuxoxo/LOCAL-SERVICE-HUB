import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth, signToken, type AuthPayload } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["seeker", "provider"]).default("seeker"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const { name, email, password, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const [user] = await db.insert(usersTable).values({
    id,
    name,
    email,
    passwordHash,
    role,
  }).returning();

  const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role, name: user.name };
  const token = signToken(payload);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      rating: user.rating,
      reviewCount: user.reviewCount,
      isVerified: user.isVerified,
      completedJobs: user.completedJobs,
      earnings: user.earnings,
      joinedAt: user.createdAt,
    },
  });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role, name: user.name };
  const token = signToken(payload);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      location: user.location,
      phone: user.phone,
      rating: user.rating,
      reviewCount: user.reviewCount,
      isVerified: user.isVerified,
      completedJobs: user.completedJobs,
      earnings: user.earnings,
      joinedAt: user.createdAt,
    },
  });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    location: user.location,
    phone: user.phone,
    rating: user.rating,
    reviewCount: user.reviewCount,
    isVerified: user.isVerified,
    completedJobs: user.completedJobs,
    earnings: user.earnings,
    joinedAt: user.createdAt,
  });
});

router.patch("/auth/me", requireAuth, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const updateSchema = z.object({
    name: z.string().min(2).optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
  });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    location: user.location,
    phone: user.phone,
    rating: user.rating,
    reviewCount: user.reviewCount,
    isVerified: user.isVerified,
    completedJobs: user.completedJobs,
    earnings: user.earnings,
    joinedAt: user.createdAt,
  });
});

export default router;
