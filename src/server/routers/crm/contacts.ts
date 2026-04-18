import { z } from "zod";

import * as queries from "@/db/crm/queries/contacts";

import { publicProcedure, router } from "../../trpc";

export const contactsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        accountId: z.string().uuid().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        level: z.enum(["decision_maker", "influencer", "executor"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      return queries.getContacts(input);
    }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const contact = await queries.getContactById(input.id);
    if (!contact) throw new Error("Contact not found");
    return contact;
  }),

  create: publicProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        name: z.string().min(1),
        englishName: z.string().optional(),
        title: z.string().optional(),
        department: z.string().optional(),
        tel: z.string().optional(),
        mobile: z.string().optional(),
        email: z.string().email().optional(),
        status: z.enum(["active", "inactive"]).default("active"),
        level: z.array(z.enum(["decision_maker", "influencer", "executor"])).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.createContact(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          accountId: z.string().uuid().optional(),
          name: z.string().min(1).optional(),
          englishName: z.string().optional(),
          title: z.string().optional(),
          department: z.string().optional(),
          tel: z.string().optional(),
          mobile: z.string().optional(),
          email: z.string().email().optional(),
          status: z.enum(["active", "inactive"]).optional(),
          level: z.array(z.enum(["decision_maker", "influencer", "executor"])).optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.updateContact(input.id, input.data);
    }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteContact(input.id);
  }),

  getBrandsByContact: publicProcedure.input(z.object({ contactId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getContactBrandAssignments(input.contactId);
  }),

  assignToBrand: publicProcedure
    .input(
      z.object({
        contactId: z.string().uuid(),
        brandId: z.string().uuid(),
        role: z.enum(["primary", "daily", "finance"]),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.assignContactToBrand(input.contactId, input.brandId, input.role);
    }),

  removeFromBrand: publicProcedure
    .input(
      z.object({
        contactId: z.string().uuid(),
        brandId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.removeContactFromBrand(input.contactId, input.brandId);
    }),
});
