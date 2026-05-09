import { z } from "zod";

import { groupCreateSchema, groupQuerySchema, groupUpdateSchema } from "@/app/(main)/dashboard/crm/schema";
import * as queries from "@/db/crm/queries/groups";

import { publicProcedure, router } from "../../trpc";

export const groupsRouter = router({
  list: publicProcedure.input(groupQuerySchema).query(async ({ input }) => {
    return queries.getGroups(input);
  }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const group = await queries.getGroupById(input.id);
    if (!group) throw new Error("Group not found");
    return group;
  }),

  create: publicProcedure.input(groupCreateSchema).mutation(async ({ input }) => {
    return queries.createGroup(input);
  }),

  update: publicProcedure.input(groupUpdateSchema).mutation(async ({ input }) => {
    return queries.updateGroup(input.id, input.data);
  }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteGroup(input.id);
  }),
});
