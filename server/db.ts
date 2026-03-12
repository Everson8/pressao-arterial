import { and, avg, desc, eq, gte, lte, max, min, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bloodPressureReadings, InsertBloodPressureReading } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Blood Pressure Readings ────────────────────────────────────────────────

export async function createReading(data: InsertBloodPressureReading) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bloodPressureReadings).values(data);
  return result;
}

export async function getReadingsByUser(
  userId: number,
  options?: { from?: Date; to?: Date; limit?: number; offset?: number }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(bloodPressureReadings.userId, userId)];
  if (options?.from) conditions.push(gte(bloodPressureReadings.measuredAt, options.from));
  if (options?.to) conditions.push(lte(bloodPressureReadings.measuredAt, options.to));

  const rows = await db
    .select()
    .from(bloodPressureReadings)
    .where(and(...conditions))
    .orderBy(desc(bloodPressureReadings.measuredAt))
    .limit(options?.limit ?? 100)
    .offset(options?.offset ?? 0);

  return rows;
}

export async function countReadingsByUser(
  userId: number,
  options?: { from?: Date; to?: Date }
) {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [eq(bloodPressureReadings.userId, userId)];
  if (options?.from) conditions.push(gte(bloodPressureReadings.measuredAt, options.from));
  if (options?.to) conditions.push(lte(bloodPressureReadings.measuredAt, options.to));

  const result = await db
    .select({ total: count() })
    .from(bloodPressureReadings)
    .where(and(...conditions));

  return result[0]?.total ?? 0;
}

export async function getLatestReading(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(bloodPressureReadings)
    .where(eq(bloodPressureReadings.userId, userId))
    .orderBy(desc(bloodPressureReadings.measuredAt))
    .limit(1);

  return result[0] ?? null;
}

export async function getReadingStats(
  userId: number,
  options?: { from?: Date; to?: Date }
) {
  const db = await getDb();
  if (!db) return null;

  const conditions = [eq(bloodPressureReadings.userId, userId)];
  if (options?.from) conditions.push(gte(bloodPressureReadings.measuredAt, options.from));
  if (options?.to) conditions.push(lte(bloodPressureReadings.measuredAt, options.to));

  const result = await db
    .select({
      avgSystolic: avg(bloodPressureReadings.systolic),
      avgDiastolic: avg(bloodPressureReadings.diastolic),
      avgHeartRate: avg(bloodPressureReadings.heartRate),
      minSystolic: min(bloodPressureReadings.systolic),
      maxSystolic: max(bloodPressureReadings.systolic),
      minDiastolic: min(bloodPressureReadings.diastolic),
      maxDiastolic: max(bloodPressureReadings.diastolic),
      total: count(),
    })
    .from(bloodPressureReadings)
    .where(and(...conditions));

  const row = result[0];
  if (!row || row.total === 0) return null;

  return {
    avgSystolic: Math.round(Number(row.avgSystolic)),
    avgDiastolic: Math.round(Number(row.avgDiastolic)),
    avgHeartRate: row.avgHeartRate ? Math.round(Number(row.avgHeartRate)) : null,
    minSystolic: Number(row.minSystolic),
    maxSystolic: Number(row.maxSystolic),
    minDiastolic: Number(row.minDiastolic),
    maxDiastolic: Number(row.maxDiastolic),
    totalReadings: row.total,
  };
}

export async function deleteReading(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(bloodPressureReadings)
    .where(and(eq(bloodPressureReadings.id, id), eq(bloodPressureReadings.userId, userId)));
}
