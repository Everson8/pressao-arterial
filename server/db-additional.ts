import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { userGoals, reminders, sharedLinks, InsertUserGoal, InsertReminder, InsertSharedLink } from "../drizzle/schema";
import { nanoid } from "nanoid";

// ─── User Goals ────────────────────────────────────────────────────────────

export async function getUserGoals(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userGoals).where(eq(userGoals.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertUserGoals(data: InsertUserGoal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserGoals(data.userId);
  if (existing) {
    await db.update(userGoals)
      .set({
        targetSystolic: data.targetSystolic,
        targetDiastolic: data.targetDiastolic,
        alertThresholdSystolic: data.alertThresholdSystolic,
        alertThresholdDiastolic: data.alertThresholdDiastolic,
        updatedAt: new Date(),
      })
      .where(eq(userGoals.userId, data.userId));
  } else {
    await db.insert(userGoals).values(data);
  }
}

// ─── Reminders ────────────────────────────────────────────────────────────

export async function getRemindersByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reminders).where(eq(reminders.userId, userId));
}

export async function createReminder(data: InsertReminder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(reminders).values(data);
}

export async function updateReminder(id: number, userId: number, data: Partial<InsertReminder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reminders)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
}

export async function deleteReminder(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
}

// ─── Shared Links ────────────────────────────────────────────────────────────

export async function createSharedLink(data: Omit<InsertSharedLink, "token">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const token = nanoid(32);
  await db.insert(sharedLinks).values({ ...data, token });
  return token;
}

export async function getSharedLinkByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(sharedLinks).where(eq(sharedLinks.token, token)).limit(1);
  const link = result[0];
  
  if (!link) return null;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null; // Expired
  
  return link;
}

export async function getSharedLinksByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sharedLinks).where(eq(sharedLinks.userId, userId));
}

export async function deleteSharedLink(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sharedLinks)
    .where(and(eq(sharedLinks.id, id), eq(sharedLinks.userId, userId)));
}
