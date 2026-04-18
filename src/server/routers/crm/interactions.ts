import { z } from "zod";

import * as queries from "@/db/crm/queries/interactions";

import { publicProcedure, router } from "../../trpc";

export const interactionsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        accountId: z.string().uuid().optional(),
        brandId: z.string().uuid().optional(),
        contactId: z.string().uuid().optional(),
        interactionType: z.enum(["meeting", "call", "email", "message", "event", "sales_progress"]).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
    )
    .query(async ({ input }) => {
      return queries.getInteractions(input);
    }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const interaction = await queries.getInteractionById(input.id);
    if (!interaction) throw new Error("Interaction not found");
    return interaction;
  }),

  create: publicProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        brandId: z.string().uuid().optional(),
        contactIds: z.array(z.string().uuid()).optional(),
        quotationId: z.string().uuid().optional(),
        interactionType: z.enum(["meeting", "call", "email", "message", "event", "sales_progress"]),
        note: z.string().optional(),
        createdBy: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.createInteraction(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          accountId: z.string().uuid().optional(),
          brandId: z.string().uuid().optional().nullable(),
          contactIds: z.array(z.string().uuid()).optional(),
          quotationId: z.string().uuid().optional().nullable(),
          interactionType: z.enum(["meeting", "call", "email", "message", "event", "sales_progress"]).optional(),
          note: z.string().optional(),
          updatedBy: z.string().uuid().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.updateInteraction(input.id, input.data);
    }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteInteraction(input.id);
  }),
});
