import { z } from "zod";

import * as queries from "@/db/crm/queries/groups";

import { publicProcedure, router } from "../../trpc";

export const groupsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return queries.getGroups(input);
    }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const group = await queries.getGroupById(input.id);
    if (!group) throw new Error("Group not found");
    return group;
  }),

  create: publicProcedure
    .input(
      z.object({
        groupName: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.createGroup(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          groupName: z.string().min(1).optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.updateGroup(input.id, input.data);
    }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteGroup(input.id);
  }),
});
