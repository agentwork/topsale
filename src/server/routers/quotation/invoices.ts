import { z } from "zod";

import { invoicePlanSchema } from "@/app/(main)/dashboard/quotation/schema";
import * as queries from "@/db/quotation/queries/invoices";

import { publicProcedure, router } from "../../trpc";

export const invoicesRouter = router({
  getByQuotation: publicProcedure.input(z.object({ quotationId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getInvoicePlansByQuotationId(input.quotationId);
  }),

  create: publicProcedure.input(invoicePlanSchema).mutation(async ({ input }) => {
    return queries.createInvoicePlan(input);
  }),

  update: publicProcedure.input(invoicePlanSchema.extend({ id: z.string().uuid() })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return queries.updateInvoicePlan(id, data);
  }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteInvoicePlan(input.id);
  }),
});
