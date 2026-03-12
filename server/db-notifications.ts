import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { notificationPreferences, emailLogs, InsertNotificationPreference, InsertEmailLog } from "../drizzle/schema";

/**
 * Obter preferências de notificação do usuário
 */
export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Criar ou atualizar preferências de notificação
 */
export async function upsertNotificationPreferences(
  userId: number,
  data: Partial<InsertNotificationPreference>
) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getNotificationPreferences(userId);

  if (existing) {
    await db
      .update(notificationPreferences)
      .set(data)
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db
      .insert(notificationPreferences)
      .values({
        userId,
        ...data,
      });
  }

  return getNotificationPreferences(userId);
}

/**
 * Registrar envio de e-mail
 */
export async function logEmail(data: InsertEmailLog) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(emailLogs).values(data);
  return result;
}

/**
 * Atualizar status de e-mail
 */
export async function updateEmailLogStatus(
  emailLogId: number,
  status: "sent" | "failed",
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) return null;

  const updateData: any = {
    status,
    sentAt: new Date(),
  };

  if (errorMessage) {
    updateData.errorMessage = errorMessage;
  }

  await db
    .update(emailLogs)
    .set(updateData)
    .where(eq(emailLogs.id, emailLogId));
}

/**
 * Obter histórico de e-mails enviados
 */
export async function getEmailLogs(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(emailLogs)
    .where(eq(emailLogs.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Obter e-mails pendentes para envio
 */
export async function getPendingEmails(limit = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(emailLogs)
    .where(eq(emailLogs.status, "pending"))
    .limit(limit);

  return result;
}
