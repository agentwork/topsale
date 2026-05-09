import { z } from "zod";

import {
  quotationCreateSchema,
  quotationQuerySchema,
  quotationUpdateSchema,
} from "@/app/(main)/dashboard/quotation/schema";
import * as queries from "@/db/quotation/queries/quotations";

import { publicProcedure, router } from "../../trpc";

export const quotationsRouter = router({
  list: publicProcedure.input(quotationQuerySchema).query(async ({ input }) => {
    return queries.listQuotations(input);
  }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    return queries.getQuotationById(input.id);
  }),

  create: publicProcedure.input(quotationCreateSchema).mutation(async ({ input }) => {
    return queries.createQuotation(input);
  }),

  update: publicProcedure.input(quotationUpdateSchema.extend({ id: z.string().uuid() })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    return queries.updateQuotation(id, data);
  }),

  confirm: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.confirmQuotation(input.id);
  }),

  withdraw: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.withdrawQuotation(input.id);
  }),

  close: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.closeQuotation(input.id);
  }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteQuotation(input.id);
  }),

  submitForApproval: publicProcedure
    .input(z.object({ id: z.string().uuid(), remark: z.string().optional() }))
    .mutation(async ({ input }) => {
      return queries.submitForApproval(input.id, input.remark);
    }),

  exportPdf: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return {
      downloadUrl: `/api/quotation/${input.id}/pdf`,
      fileName: `quotation-${input.id}.pdf`,
    };
  }),
});
