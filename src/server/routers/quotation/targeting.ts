import { z } from "zod";

import { targetingUpsertSchema } from "@/app/(main)/dashboard/quotation/schema";
import * as queries from "@/db/quotation/queries/targeting";

import { publicProcedure, router } from "../../trpc";

export const targetingRouter = router({
  getByQuotation: publicProcedure.input(z.object({ quotationId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getTargetingByQuotationId(input.quotationId);
  }),

  upsert: publicProcedure.input(targetingUpsertSchema).mutation(async ({ input }) => {
    return queries.upsertTargeting(input);
  }),
});
