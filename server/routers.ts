import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createReading,
  deleteReading,
  getLatestReading,
  getReadingsByUser,
  getReadingStats,
  countReadingsByUser,
} from "./db";

const readingInputSchema = z.object({
  systolic: z.number().int().min(50).max(300),
  diastolic: z.number().int().min(30).max(200),
  heartRate: z.number().int().min(30).max(300).optional(),
  notes: z.string().max(500).optional(),
  measuredAt: z.date(),
});

const listInputSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  readings: router({
    create: protectedProcedure
      .input(readingInputSchema)
      .mutation(async ({ ctx, input }) => {
        await createReading({
          userId: ctx.user.id,
          systolic: input.systolic,
          diastolic: input.diastolic,
          heartRate: input.heartRate ?? null,
          notes: input.notes ?? null,
          measuredAt: input.measuredAt,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .input(listInputSchema)
      .query(async ({ ctx, input }) => {
        const [rows, total] = await Promise.all([
          getReadingsByUser(ctx.user.id, {
            from: input.from,
            to: input.to,
            limit: input.limit,
            offset: input.offset,
          }),
          countReadingsByUser(ctx.user.id, {
            from: input.from,
            to: input.to,
          }),
        ]);
        return { rows, total };
      }),

    latest: protectedProcedure.query(async ({ ctx }) => {
      return getLatestReading(ctx.user.id);
    }),

    stats: protectedProcedure
      .input(
        z.object({
          from: z.date().optional(),
          to: z.date().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return getReadingStats(ctx.user.id, {
          from: input.from,
          to: input.to,
        });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await deleteReading(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
