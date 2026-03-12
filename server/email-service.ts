import { getDb } from "./db";
import { eq, and, gte } from "drizzle-orm";
import { users, reminders, notificationPreferences, bloodPressureReadings, userGoals, emailLogs } from "../drizzle/schema";
import { logEmail, updateEmailLogStatus } from "./db-notifications";
import { getReminderEmailTemplate, getAlertEmailTemplate, getWeeklyDigestEmailTemplate } from "./email-templates";
import { notifyOwner } from "./_core/notification";

/**
 * Enviar e-mail via Forge API
 */
async function sendEmailViaForge(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Email Service] Forge API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email Service] Error sending email:", error);
    return false;
  }
}

/**
 * Processar e-mails pendentes
 */
export async function processPendingEmails() {
  const db = await getDb();
  if (!db) {
    console.warn("[Email Service] Database not available");
    return;
  }

  try {
    // Obter todos os e-mails pendentes
    const pendingEmails = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.status, "pending"))
      .limit(50);

    for (const emailLog of pendingEmails) {
      const success = await sendEmailViaForge(
        emailLog.recipientEmail,
        emailLog.subject,
        ""
      );

      if (success) {
        await updateEmailLogStatus(emailLog.id, "sent");
        console.log(`[Email Service] Email sent: ${emailLog.id}`);
      } else {
        await updateEmailLogStatus(emailLog.id, "failed", "Failed to send via Forge API");
        console.error(`[Email Service] Email failed: ${emailLog.id}`);
      }
    }
  } catch (error) {
    console.error("[Email Service] Error processing pending emails:", error);
  }
}

/**
 * Enviar lembretes de medição
 */
export async function sendReminderNotifications() {
  const db = await getDb();
  if (!db) return;

  try {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;
    const currentDay = now.getDay();

    // Obter lembretes para o horário e dia atual
    const activeReminders = await db
      .select()
      .from(reminders)
      .where(eq(reminders.enabled, 1));

    for (const reminder of activeReminders) {
      // Verificar se o dia está na lista
      const daysArray = reminder.daysOfWeek.split(",").map(Number);
      if (!daysArray.includes(currentDay)) continue;

      // Verificar se o horário coincide (com margem de 5 minutos)
      const reminderHour = reminder.time.split(":")[0];
      const reminderMinute = reminder.time.split(":")[1];
      const timeDiff = Math.abs(
        parseInt(currentHour) * 60 + parseInt(currentMinute) -
          (parseInt(reminderHour) * 60 + parseInt(reminderMinute))
      );

      if (timeDiff > 5) continue; // Só enviar se estiver dentro de 5 minutos

      // Obter usuário
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, reminder.userId))
        .limit(1);

      if (!user.length) continue;

      // Verificar preferências
      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, reminder.userId))
        .limit(1);

      if (prefs.length && prefs[0].reminderNotifications === 0) continue;

      // Enviar e-mail
      const template = getReminderEmailTemplate(
        user[0].name || "Usuário",
        reminder.title,
        reminder.description || undefined
      );

      const emailLog = await logEmail({
        userId: reminder.userId,
        type: "reminder",
        subject: template.subject,
        recipientEmail: user[0].email || "",
        status: "pending",
      });

      console.log(`[Email Service] Reminder email queued: ${emailLog}`);
    }
  } catch (error) {
    console.error("[Email Service] Error sending reminders:", error);
  }
}

/**
 * Enviar resumo semanal
 */
export async function sendWeeklyDigests() {
  const db = await getDb();
  if (!db) return;

  try {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    // Obter usuários com resumo semanal ativado
    const usersWithDigest = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.weeklyDigest, 1));

    for (const pref of usersWithDigest) {
      // Verificar se é o dia e horário correto
      if (pref.weeklyDigestDay !== currentDay) continue;
      if (pref.weeklyDigestTime !== currentTime) continue;

      // Obter usuário
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, pref.userId))
        .limit(1);

      if (!user.length) continue;

      // Obter metas do usuário
      const goals = await db
        .select()
        .from(userGoals)
        .where(eq(userGoals.userId, pref.userId))
        .limit(1);

      // Obter medições da semana
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const readings = await db
        .select()
        .from(bloodPressureReadings)
        .where(
          and(
            eq(bloodPressureReadings.userId, pref.userId),
            gte(bloodPressureReadings.measuredAt, weekAgo)
          )
        );

      // Enviar e-mail
      const defaultGoal = {
        id: 0,
        userId: pref.userId,
        targetSystolic: 130,
        targetDiastolic: 80,
        alertThresholdSystolic: 140,
        alertThresholdDiastolic: 90,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const template = getWeeklyDigestEmailTemplate(
        user[0].name || "Usuário",
        readings,
        goals.length > 0 ? goals[0] : defaultGoal
      );

      const emailLog = await logEmail({
        userId: pref.userId,
        type: "weekly_digest",
        subject: template.subject,
        recipientEmail: user[0].email || "",
        status: "pending",
      });

      console.log(`[Email Service] Weekly digest queued: ${emailLog}`);
    }
  } catch (error) {
    console.error("[Email Service] Error sending weekly digests:", error);
  }
}

/**
 * Enviar alertas de valores fora da meta
 */
export async function sendAlertNotifications() {
  const db = await getDb();
  if (!db) return;

  try {
    // Obter últimas medições não alertadas (últimas 1 hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReadings = await db
      .select()
      .from(bloodPressureReadings)
      .where(gte(bloodPressureReadings.measuredAt, oneHourAgo));

    for (const reading of recentReadings) {
      // Obter preferências
      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, reading.userId))
        .limit(1);

      if (prefs.length && prefs[0].alertNotifications === 0) continue;

      // Obter metas
      const goals = await db
        .select()
        .from(userGoals)
        .where(eq(userGoals.userId, reading.userId))
        .limit(1);

      if (!goals.length) continue;

      const goal = goals[0];

      // Verificar se está fora da meta
      const isAboveAlert =
        reading.systolic >= goal.alertThresholdSystolic ||
        reading.diastolic >= goal.alertThresholdDiastolic;

      if (!isAboveAlert) continue;

      // Obter usuário
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, reading.userId))
        .limit(1);

      if (!user.length) continue;

      // Enviar e-mail
      const template = getAlertEmailTemplate(
        user[0].name || "Usuário",
        reading,
        goal
      );

      const emailLog = await logEmail({
        userId: reading.userId,
        type: "alert",
        subject: template.subject,
        recipientEmail: user[0].email || "",
        status: "pending",
      });

      console.log(`[Email Service] Alert email queued: ${emailLog}`);
    }
  } catch (error) {
    console.error("[Email Service] Error sending alerts:", error);
  }
}

/**
 * Executar todos os jobs de e-mail
 */
export async function runEmailJobs() {
  console.log("[Email Service] Running email jobs...");
  await sendReminderNotifications();
  await sendWeeklyDigests();
  await sendAlertNotifications();
  await processPendingEmails();
  console.log("[Email Service] Email jobs completed");
}
