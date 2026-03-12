import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// TODO: Add your tables here

export const bloodPressureReadings = mysqlTable("blood_pressure_readings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  systolic: int("systolic").notNull(), // mmHg - pressão sistólica
  diastolic: int("diastolic").notNull(), // mmHg - pressão diastólica
  heartRate: int("heartRate"), // bpm - frequência cardíaca (opcional)
  notes: text("notes"), // observações opcionais
  measuredAt: timestamp("measuredAt").notNull(), // data/hora da medição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BloodPressureReading = typeof bloodPressureReadings.$inferSelect;
export type InsertBloodPressureReading = typeof bloodPressureReadings.$inferInsert;