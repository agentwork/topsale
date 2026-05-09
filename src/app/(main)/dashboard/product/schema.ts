import { z } from "zod";

import { mainCodeEnum, pricingUnitEnum, productStatusEnum } from "@/db/product/schema";

export const productCreateSchema = z.object({
  productCode: z.string().optional(),
  ragicId: z.string().optional(),
  mainCode: z.enum(mainCodeEnum),
  subCategory: z.string().min(1, "銷售子類別為必填"),
  productName: z.string().min(1, "產品名稱為必填"),
  productNameEn: z.string().optional(),
  description: z.string().optional(),
  pricingUnit: z.enum(pricingUnitEnum),
  unitPrice: z.number().int().min(0, "單價必須大於等於 0"),
  priority: z.number().int().default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const productUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    productName: z.string().min(1).optional(),
    productNameEn: z.string().optional(),
    description: z.string().optional(),
    pricingUnit: z.enum(pricingUnitEnum).optional(),
    unitPrice: z.number().int().min(0).optional(),
    priority: z.number().int().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(productStatusEnum).optional(),
  }),
});

export const productFilterSchema = z.object({
  mainCode: z.enum(mainCodeEnum).optional(),
  subCategory: z.string().optional(),
  status: z.enum(productStatusEnum).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export const productCloneSchema = z.object({
  id: z.string().uuid(),
  newProductCode: z.string(),
  clonedBy: z.string(),
});

export const productPublishSchema = z.object({
  id: z.string().uuid(),
  publishedBy: z.string(),
});

export const productDeactivateSchema = z.object({
  id: z.string().uuid(),
  deactivatedBy: z.string(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
