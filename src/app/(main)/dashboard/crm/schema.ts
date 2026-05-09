import { z } from "zod";

import {
  accountTypeEnum,
  agencyTierEnum,
  allianceEnum,
  assignmentRoleEnum,
  contactLevelEnum,
  contactStatusEnum,
  interactionTypeEnum,
  paymentTermEnum,
} from "@/db/crm/schema";

export const groupCreateSchema = z.object({
  groupName: z.string().min(1, "集團名稱為必填"),
});

export const groupUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    groupName: z.string().min(1).optional(),
  }),
});

export const groupQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export const accountCreateSchema = z
  .object({
    accountName: z.string().min(1, "客戶名稱為必填"),
    shortName: z.string().min(1, "客戶簡稱為必填"),
    taxId: z.string().optional(),
    personalId: z.string().optional(),
    address: z.string().min(1, "地址為必填"),
    groupId: z.string().uuid().optional(),
    accountType: z.enum(accountTypeEnum),
    agencyTier: z.enum(agencyTierEnum),
    paymentTerm: z.enum(paymentTermEnum),
    accountOwner: z.string().optional(),
    primaryContactId: z.string().uuid().optional(),
    customerPreference: z.string().optional(),
    internalPolitics: z.string().optional(),
    alliance: z.enum(allianceEnum).optional(),
    isBlacklist: z.boolean().optional(),
  })
  .refine((data) => data.taxId || data.personalId, {
    message: "統一編號或身分字號至少需要填寫一個",
    path: ["taxId"],
  });

export const accountUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    accountName: z.string().min(1).optional(),
    shortName: z.string().min(1).optional(),
    taxId: z.string().optional(),
    personalId: z.string().optional(),
    address: z.string().min(1).optional(),
    groupId: z.string().uuid().optional().nullable(),
    accountType: z.enum(accountTypeEnum).optional(),
    agencyTier: z.enum(agencyTierEnum).optional().nullable(),
    paymentTerm: z.enum(paymentTermEnum).optional(),
    accountOwner: z.string().optional().nullable(),
    primaryContactId: z.string().uuid().optional().nullable(),
    customerPreference: z.string().optional(),
    internalPolitics: z.string().optional(),
    alliance: z.enum(allianceEnum).optional().nullable(),
    isBlacklist: z.boolean().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const accountQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  accountType: z.enum(accountTypeEnum).optional(),
  agencyTier: z.enum(agencyTierEnum).optional(),
  groupId: z.string().uuid().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const brandCreateSchema = z.object({
  brandName: z.string().min(1, "品牌名稱為必填"),
  accountId: z.string().uuid(),
  industryCategory: z.string().min(1, "產業類別為必填"),
  mediaRequirement: z.array(z.string()).optional(),
  deliveryNotes: z.string().optional(),
  cooperationNotes: z.string().optional(),
});

export const brandUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    brandName: z.string().min(1).optional(),
    accountId: z.string().uuid().optional(),
    industryCategory: z.string().optional(),
    mediaRequirement: z.array(z.string()).optional(),
    deliveryNotes: z.string().optional(),
    cooperationNotes: z.string().optional(),
  }),
});

export const brandQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  accountId: z.string().uuid().optional(),
  industryCategory: z.string().optional(),
});

export const contactCreateSchema = z.object({
  accountId: z.string().uuid(),
  name: z.string().min(1, "姓名為必填"),
  englishName: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  tel: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(contactStatusEnum).default("active"),
  level: z.array(z.enum(contactLevelEnum)).optional(),
});

export const contactUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    accountId: z.string().uuid().optional(),
    name: z.string().min(1).optional(),
    englishName: z.string().optional(),
    title: z.string().optional(),
    department: z.string().optional(),
    tel: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().email().optional(),
    status: z.enum(contactStatusEnum).optional(),
    level: z.array(z.enum(contactLevelEnum)).optional(),
  }),
});

export const contactQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  accountId: z.string().uuid().optional(),
  status: z.enum(contactStatusEnum).optional(),
  level: z.enum(contactLevelEnum).optional(),
});

export const contactAssignSchema = z.object({
  contactId: z.string().uuid(),
  brandId: z.string().uuid(),
  role: z.enum(assignmentRoleEnum),
});

export const contactRemoveSchema = z.object({
  contactId: z.string().uuid(),
  brandId: z.string().uuid(),
});

export const interactionCreateSchema = z.object({
  accountId: z.string().uuid(),
  brandId: z.string().uuid().optional(),
  contactIds: z.array(z.string().uuid()).optional(),
  quotationId: z.string().uuid().optional(),
  interactionType: z.enum(interactionTypeEnum),
  note: z.string().optional(),
  createdBy: z.string().uuid(),
});

export const interactionUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    accountId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional().nullable(),
    contactIds: z.array(z.string().uuid()).optional(),
    quotationId: z.string().uuid().optional().nullable(),
    interactionType: z.enum(interactionTypeEnum).optional(),
    note: z.string().optional(),
    updatedBy: z.string().uuid().optional(),
  }),
});

export const interactionQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  accountId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  interactionType: z.enum(interactionTypeEnum).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
