import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
  getEmailLogs,
} from "./db-notifications";

export const notificationsRouter = router({
  /**
   * Obter preferências de notificação do usuário
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await getNotificationPreferences(ctx.user.id);
    return (
      prefs || {
        userId: ctx.user.id,
        reminderNotifications: true,
        weeklyDigest: true,
        alertNotifications: true,
        weeklyDigestDay: 1,
        weeklyDigestTime: "09:00",
      }
    );
  }),

  /**
   * Atualizar preferências de notificação
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        reminderNotifications: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        alertNotifications: z.boolean().optional(),
        weeklyDigestDay: z.number().int().min(0).max(6).optional(),
        weeklyDigestTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: any = {};
      if (input.reminderNotifications !== undefined) {
        data.reminderNotifications = input.reminderNotifications ? 1 : 0;
      }
      if (input.weeklyDigest !== undefined) {
        data.weeklyDigest = input.weeklyDigest ? 1 : 0;
      }
      if (input.alertNotifications !== undefined) {
        data.alertNotifications = input.alertNotifications ? 1 : 0;
      }
      if (input.weeklyDigestDay !== undefined) {
        data.weeklyDigestDay = input.weeklyDigestDay;
      }
      if (input.weeklyDigestTime !== undefined) {
        data.weeklyDigestTime = input.weeklyDigestTime;
      }

      const updated = await upsertNotificationPreferences(ctx.user.id, data);
      return updated;
    }),

  /**
   * Obter histórico de e-mails enviados
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await getEmailLogs(ctx.user.id, input.limit, input.offset);
      return logs.map((log) => ({
        ...log,
        status: log.status as "pending" | "sent" | "failed",
      }));
    }),
});
