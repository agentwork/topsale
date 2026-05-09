import { z } from "zod";

export const quotationStatusEnum = [
  "draft",
  "pending_approval",
  "approved",
  "confirmed",
  "closed",
  "withdrawn",
] as const;
export const ticketTypeEnum = [
  "am_strategy",
  "am_data",
  "pm_custom",
  "as_material_confirm",
  "ds_proposal",
  "ds_material",
  "rd_tech_support",
  "mb_media_purchase",
] as const;
export const ticketStatusEnum = ["pending", "accepted", "processing", "completed", "rejected"] as const;
export const changeTypeEnum = ["top-up", "reduction"] as const;

export const quotationCreateSchema = z.object({
  campaignName: z.string().min(1, "Campaign Name 為必填"),
  quotationDate: z.string(),
  agencyId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid("請選擇有效客戶"),
  brandIds: z.array(z.string().uuid()).min(1, "請至少選擇一個品牌"),
  ownerId: z.string().uuid().optional().nullable(),
  contactPhone: z.string().optional(),
  isRushOrder: z.boolean().optional().default(false),
  isSpecialCase: z.boolean().optional().default(false),
});

export const quotationUpdateSchema = z.object({
  campaignName: z.string().min(1).optional(),
  agencyId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional(),
  brandIds: z.array(z.string().uuid()).optional(),
  contactPhone: z.string().optional(),
  isRushOrder: z.boolean().optional(),
  isSpecialCase: z.boolean().optional(),
  finalNet: z.number().int().optional().nullable(),
  larkApprovalId: z.string().optional().nullable(),
});

export const quotationQuerySchema = z.object({
  status: z.enum(quotationStatusEnum).optional(),
  customerId: z.string().uuid().optional(),
  agencyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const lineItemCreateSchema = z.object({
  quotationId: z.string().uuid(),
  productId: z.string().uuid(),
  displayName: z.string().min(1, "產品名稱為必填"),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
  budget: z.number().int().min(0),
  estImpressions: z.number().int().optional().nullable(),
  estClicks: z.number().int().optional().nullable(),
  estViews: z.number().int().optional().nullable(),
  estCtr: z.number().int().optional().nullable(),
});

export const lineItemUpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.number().int().min(1).optional(),
  unitPrice: z.number().int().min(0).optional(),
  budget: z.number().int().min(0).optional(),
  estImpressions: z.number().int().optional().nullable(),
  estClicks: z.number().int().optional().nullable(),
  estViews: z.number().int().optional().nullable(),
  estCtr: z.number().int().optional().nullable(),
});

export const targetingUpsertSchema = z.object({
  quotationId: z.string().uuid(),
  mediaCat: z.array(z.string()).optional().nullable(),
  demoAge: z.array(z.string()).optional().nullable(),
  demoGender: z.string().optional().nullable(),
  geoLocation: z.array(z.string()).optional().nullable(),
  income: z.array(z.string()).optional().nullable(),
  family: z.array(z.string()).optional().nullable(),
  occupation: z.array(z.string()).optional().nullable(),
  interests: z.array(z.string()).optional().nullable(),
  fpSiteType: z.string().optional().nullable(),
  fpSiteUrl: z.string().optional().nullable(),
  fpAppCategory: z.string().optional().nullable(),
  fpApps: z.string().optional().nullable(),
  consumerData: z.string().optional().nullable(),
  interactAd: z.string().optional().nullable(),
  interactSite: z.string().optional().nullable(),
  interactApp: z.string().optional().nullable(),
  audiencePkg: z.string().optional().nullable(),
  crmAdid: z.string().optional().nullable(),
  contextKeywords: z.string().optional().nullable(),
  brandSafety: z.string().optional().nullable(),
  thirdPartyAudit: z.array(z.string()).optional().nullable(),
  dataLoop: z.array(z.string()).optional().nullable(),
});

export const ticketCreateSchema = z.object({
  quotationId: z.string().uuid(),
  ticketType: z.enum(ticketTypeEnum),
});

export const ticketSyncSchema = z.object({
  larkTicketId: z.string(),
  ticketStatus: z.enum(ticketStatusEnum),
});

export const invoicePlanSchema = z.object({
  quotationId: z.string().uuid(),
  estMonth: z.string().min(1, "預計開立月份為必填"),
  estAmount: z.number().int().min(0, "金額必須大於等於 0"),
});

export const revisionCreateSchema = z.object({
  quotationId: z.string().uuid(),
  revisionNo: z.number().int().min(1),
  changeType: z.enum(changeTypeEnum),
  oldAmount: z.number().int(),
  newAmount: z.number().int(),
  larkApprovalId: z.string().optional().nullable(),
});
