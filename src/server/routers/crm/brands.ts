import { z } from "zod";

import { brandCreateSchema, brandQuerySchema, brandUpdateSchema } from "@/app/(main)/dashboard/crm/schema";
import * as queries from "@/db/crm/queries/brands";

import { publicProcedure, router } from "../../trpc";

export const brandsRouter = router({
  list: publicProcedure.input(brandQuerySchema).query(async ({ input }) => {
    return queries.getBrands(input);
  }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const brand = await queries.getBrandById(input.id);
    if (!brand) throw new Error("Brand not found");
    return brand;
  }),

  create: publicProcedure.input(brandCreateSchema).mutation(async ({ input }) => {
    return queries.createBrand(input);
  }),

  update: publicProcedure.input(brandUpdateSchema).mutation(async ({ input }) => {
    return queries.updateBrand(input.id, input.data);
  }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteBrand(input.id);
  }),

  getClientBrands: publicProcedure.query(async () => {
    return queries.getClientBrands();
  }),
});
