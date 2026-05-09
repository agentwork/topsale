import { z } from "zod";

import {
  productCloneSchema,
  productCreateSchema,
  productDeactivateSchema,
  productFilterSchema,
  productPublishSchema,
  productUpdateSchema,
} from "@/app/(main)/dashboard/product/schema";
import * as queries from "@/db/product/queries/products";

import { publicProcedure, router } from "../../trpc";

export const productRouter = router({
  create: publicProcedure.input(productCreateSchema).mutation(async ({ input }) => {
    return queries.createProduct(input);
  }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    return queries.getProductById(input.id);
  }),

  getByCode: publicProcedure.input(z.object({ productCode: z.string() })).query(async ({ input }) => {
    return queries.getProductByCode(input.productCode);
  }),

  list: publicProcedure.input(productFilterSchema).query(async ({ input }) => {
    return queries.listProducts(input);
  }),

  getActive: publicProcedure.query(async () => {
    return queries.getActiveProducts();
  }),

  update: publicProcedure.input(productUpdateSchema).mutation(async ({ input }) => {
    return queries.updateProduct(input.id, input.data);
  }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteProduct(input.id);
  }),

  clone: publicProcedure.input(productCloneSchema).mutation(async ({ input }) => {
    return queries.cloneProduct(input.id, input.newProductCode, input.clonedBy);
  }),

  publish: publicProcedure.input(productPublishSchema).mutation(async ({ input }) => {
    return queries.publishProduct(input.id, input.publishedBy);
  }),

  deactivate: publicProcedure.input(productDeactivateSchema).mutation(async ({ input }) => {
    return queries.deactivateProduct(input.id, input.deactivatedBy);
  }),

  getHistory: publicProcedure.input(z.object({ productId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getProductHistory(input.productId);
  }),
});
