import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getUserGoals,
  upsertUserGoals,
  getRemindersByUser,
  createReminder,
  updateReminder,
  deleteReminder,
  createSharedLink,
  getSharedLinkByToken,
  getSharedLinksByUser,
  deleteSharedLink,
} from "./db-additional";
import { getReadingsByUser } from "./db";

// ─── Goals Router ────────────────────────────────────────────────────────────

export const goalsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getUserGoals(ctx.user.id);
  }),

  update: protectedProcedure
    .input(
      z.object({
        targetSystolic: z.number().int().min(100).max(200),
        targetDiastolic: z.number().int().min(60).max(130),
        alertThresholdSystolic: z.number().int().min(100).max(220),
        alertThresholdDiastolic: z.number().int().min(60).max(150),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertUserGoals({
        userId: ctx.user.id,
        targetSystolic: input.targetSystolic,
        targetDiastolic: input.targetDiastolic,
        alertThresholdSystolic: input.alertThresholdSystolic,
        alertThresholdDiastolic: input.alertThresholdDiastolic,
      });
      return { success: true };
    }),
});

// ─── Reminders Router ────────────────────────────────────────────────────────

export const remindersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getRemindersByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        daysOfWeek: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createReminder({
        userId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        time: input.time,
        daysOfWeek: input.daysOfWeek.join(","),
        enabled: 1,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional(),
        time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: any = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.time !== undefined) updates.time = input.time;
      if (input.daysOfWeek !== undefined) updates.daysOfWeek = input.daysOfWeek.join(",");
      if (input.enabled !== undefined) updates.enabled = input.enabled ? 1 : 0;
      
      await updateReminder(input.id, ctx.user.id, updates);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteReminder(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Sharing Router ────────────────────────────────────────────────────────────

export const sharingRouter = router({
  createLink: protectedProcedure
    .input(
      z.object({
        doctorName: z.string().min(1).max(255).optional(),
        doctorEmail: z.string().email().optional(),
        expiresInDays: z.number().int().min(1).max(365).default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

      const token = await createSharedLink({
        userId: ctx.user.id,
        doctorName: input.doctorName ?? null,
        doctorEmail: input.doctorEmail ?? null,
        expiresAt,
      });

      return { token, expiresAt };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getSharedLinksByUser(ctx.user.id);
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await deleteSharedLink(input.id, ctx.user.id);
      return { success: true };
    }),

  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const link = await getSharedLinkByToken(input.token);
      if (!link) return null;

      const readings = await getReadingsByUser(link.userId, { limit: 200 });
      return { link, readings };
    }),
});
