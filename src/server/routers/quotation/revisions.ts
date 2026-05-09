import { z } from "zod";

import { revisionCreateSchema } from "@/app/(main)/dashboard/quotation/schema";
import * as queries from "@/db/quotation/queries/revisions";

import { publicProcedure, router } from "../../trpc";

export const revisionsRouter = router({
  getByQuotation: publicProcedure.input(z.object({ quotationId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getRevisionsByQuotationId(input.quotationId);
  }),

  create: publicProcedure.input(revisionCreateSchema).mutation(async ({ input }) => {
    return queries.createRevision(input);
  }),
});
