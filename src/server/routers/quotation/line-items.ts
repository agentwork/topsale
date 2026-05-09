import { z } from "zod";

import { lineItemCreateSchema, lineItemUpdateSchema } from "@/app/(main)/dashboard/quotation/schema";
import * as queries from "@/db/quotation/queries/line-items";

import { publicProcedure, router } from "../../trpc";

export const lineItemsRouter = router({
  getByQuotation: publicProcedure.input(z.object({ quotationId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getLineItemsByQuotationId(input.quotationId);
  }),

  create: publicProcedure.input(lineItemCreateSchema).mutation(async ({ input }) => {
    const result = await queries.createLineItem(input);
    await queries.recalculateTotals(input.quotationId);
    return result;
  }),

  update: publicProcedure
    .input(lineItemUpdateSchema.extend({ id: z.string().uuid(), quotationId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const { id, quotationId, ...data } = input;
      const result = await queries.updateLineItem(id, data);
      await queries.recalculateTotals(quotationId);
      return result;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid(), quotationId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const result = await queries.deleteLineItem(input.id);
      await queries.recalculateTotals(input.quotationId);
      return result;
    }),
});
