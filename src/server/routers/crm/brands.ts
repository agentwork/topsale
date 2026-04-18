import { z } from "zod";

import * as queries from "@/db/crm/queries/brands";

import { publicProcedure, router } from "../../trpc";

export const brandsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        accountId: z.string().uuid().optional(),
        industryCategory: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return queries.getBrands(input);
    }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const brand = await queries.getBrandById(input.id);
    if (!brand) throw new Error("Brand not found");
    return brand;
  }),

  create: publicProcedure
    .input(
      z.object({
        brandName: z.string().min(1),
        accountId: z.string().uuid(),
        industryCategory: z.string(),
        mediaRequirement: z.array(z.string()).optional(),
        deliveryNotes: z.string().optional(),
        cooperationNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.createBrand(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          brandName: z.string().min(1).optional(),
          accountId: z.string().uuid().optional(),
          industryCategory: z.string().optional(),
          mediaRequirement: z.array(z.string()).optional(),
          deliveryNotes: z.string().optional(),
          cooperationNotes: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      return queries.updateBrand(input.id, input.data);
    }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteBrand(input.id);
  }),

  getClientBrands: publicProcedure.query(async () => {
    return queries.getClientBrands();
  }),
});
