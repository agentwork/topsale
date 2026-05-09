import { z } from "zod";

import {
  interactionCreateSchema,
  interactionQuerySchema,
  interactionUpdateSchema,
} from "@/app/(main)/dashboard/crm/schema";
import * as queries from "@/db/crm/queries/interactions";

import { publicProcedure, router } from "../../trpc";

export const interactionsRouter = router({
  list: publicProcedure.input(interactionQuerySchema).query(async ({ input }) => {
    return queries.getInteractions(input);
  }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const interaction = await queries.getInteractionById(input.id);
    if (!interaction) throw new Error("Interaction not found");
    return interaction;
  }),

  create: publicProcedure.input(interactionCreateSchema).mutation(async ({ input }) => {
    return queries.createInteraction(input);
  }),

  update: publicProcedure.input(interactionUpdateSchema).mutation(async ({ input }) => {
    return queries.updateInteraction(input.id, input.data);
  }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteInteraction(input.id);
  }),
});
