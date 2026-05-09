import { z } from "zod";

import {
  contactAssignSchema,
  contactCreateSchema,
  contactQuerySchema,
  contactRemoveSchema,
  contactUpdateSchema,
} from "@/app/(main)/dashboard/crm/schema";
import * as queries from "@/db/crm/queries/contacts";

import { publicProcedure, router } from "../../trpc";

export const contactsRouter = router({
  list: publicProcedure.input(contactQuerySchema).query(async ({ input }) => {
    return queries.getContacts(input);
  }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const contact = await queries.getContactById(input.id);
    if (!contact) throw new Error("Contact not found");
    return contact;
  }),

  create: publicProcedure.input(contactCreateSchema).mutation(async ({ input }) => {
    return queries.createContact(input);
  }),

  update: publicProcedure.input(contactUpdateSchema).mutation(async ({ input }) => {
    return queries.updateContact(input.id, input.data);
  }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteContact(input.id);
  }),

  getBrandsByContact: publicProcedure.input(z.object({ contactId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getContactBrandAssignments(input.contactId);
  }),

  assignToBrand: publicProcedure.input(contactAssignSchema).mutation(async ({ input }) => {
    return queries.assignContactToBrand(input.contactId, input.brandId, input.role);
  }),

  removeFromBrand: publicProcedure.input(contactRemoveSchema).mutation(async ({ input }) => {
    return queries.removeContactFromBrand(input.contactId, input.brandId);
  }),
});
