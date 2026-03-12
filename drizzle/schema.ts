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

export const userGoals = mysqlTable("user_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  targetSystolic: int("targetSystolic").notNull().default(130), // Meta de pressão sistólica
  targetDiastolic: int("targetDiastolic").notNull().default(80), // Meta de pressão diastólica
  alertThresholdSystolic: int("alertThresholdSystolic").notNull().default(140), // Limite de alerta
  alertThresholdDiastolic: int("alertThresholdDiastolic").notNull().default(90),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = typeof userGoals.$inferInsert;

export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  time: varchar("time", { length: 5 }).notNull(), // HH:mm format
  daysOfWeek: varchar("daysOfWeek", { length: 20 }).notNull().default("0,1,2,3,4,5,6"), // 0=Sunday, 1=Monday, etc
  enabled: int("enabled").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

// Helper para converter enabled int para boolean
export function isReminderEnabled(reminder: Reminder): boolean {
  return reminder.enabled === 1;
}

// Helper para converter boolean para int
export function reminderEnabledToInt(enabled: boolean): number {
  return enabled ? 1 : 0;
}

export const sharedLinks = mysqlTable("shared_links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  doctorName: varchar("doctorName", { length: 255 }),
  doctorEmail: varchar("doctorEmail", { length: 320 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SharedLink = typeof sharedLinks.$inferSelect;
export type InsertSharedLink = typeof sharedLinks.$inferInsert;