import { z } from "zod";

import * as queries from "@/db/crm/queries/accounts";
import type { NewAccount } from "@/db/crm/schema";

import { publicProcedure, router } from "../../trpc";

const accountCreateSchema = z
  .object({
    accountName: z.string().min(1),
    shortName: z.string().min(1),
    taxId: z.string().optional(),
    personalId: z.string().optional(),
    address: z.string().min(1),
    groupId: z.string().uuid().optional(),
    accountType: z.enum(["agency", "client"]),
    agencyTier: z.enum(["tier1", "tier2", "tier3"]),
    paymentTerm: z.enum(["net30", "net60", "net90", "within30", "within45", "prepaid"]),
    accountOwner: z.string().optional(),
    primaryContactId: z.string().uuid().optional(),
    customerPreference: z.string().optional(),
    internalPolitics: z.string().optional(),
    alliance: z.enum(["apex", "omnet"]).optional(),
    isBlacklist: z.boolean().optional(),
  })
  .refine((data) => data.taxId || data.personalId, { message: "統一編號或身分字號至少需要填寫一個", path: ["taxId"] });

const accountUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    accountName: z.string().min(1).optional(),
    shortName: z.string().min(1).optional(),
    taxId: z.string().optional(),
    personalId: z.string().optional(),
    address: z.string().min(1).optional(),
    groupId: z.string().uuid().optional().nullable(),
    accountType: z.enum(["agency", "client"]).optional(),
    agencyTier: z.enum(["tier1", "tier2", "tier3"]).optional().nullable(),
    paymentTerm: z.enum(["net30", "net60", "net90", "within30", "within45", "prepaid"]).optional(),
    accountOwner: z.string().optional().nullable(),
    primaryContactId: z.string().uuid().optional().nullable(),
    customerPreference: z.string().optional(),
    internalPolitics: z.string().optional(),
    alliance: z.enum(["apex", "omnet"]).optional().nullable(),
    isBlacklist: z.boolean().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

export const accountsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        accountType: z.enum(["agency", "client"]).optional(),
        agencyTier: z.enum(["tier1", "tier2", "tier3"]).optional(),
        groupId: z.string().uuid().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      return queries.getAccounts(input);
    }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const account = await queries.getAccountById(input.id);
    if (!account) throw new Error("Account not found");
    return account;
  }),

  create: publicProcedure.input(accountCreateSchema).mutation(async ({ input }) => {
    return queries.createAccount(input);
  }),

  update: publicProcedure.input(accountUpdateSchema).mutation(async ({ input }) => {
    const oldAccount = await queries.getAccountById(input.id);

    const updateData: Record<string, unknown> = { ...input.data };
    if (input.data.agencyTier === null) {
      updateData.agencyTier = null;
    }
    if (input.data.groupId === null) {
      updateData.groupId = null;
    }
    if (input.data.alliance === null) {
      updateData.alliance = null;
    }

    const result = await queries.updateAccount(input.id, updateData as Partial<NewAccount>);

    if (oldAccount && input.data.paymentTerm !== undefined && oldAccount.paymentTerm !== input.data.paymentTerm) {
      await queries.createAccountHistory({
        accountId: input.id,
        changedField: "paymentTerm",
        oldValue: oldAccount.paymentTerm,
        newValue: input.data.paymentTerm,
        changedBy: input.data.accountOwner || "system",
      });
    }

    if (oldAccount && input.data.alliance !== undefined && oldAccount.alliance !== input.data.alliance) {
      await queries.createAccountHistory({
        accountId: input.id,
        changedField: "alliance",
        oldValue: oldAccount.alliance || "",
        newValue: input.data.alliance || "",
        changedBy: input.data.accountOwner || "system",
      });
    }

    return result;
  }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteAccount(input.id);
  }),

  getBrandsByAccount: publicProcedure.input(z.object({ accountId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getBrandsByAccountId(input.accountId);
  }),

  getContactsByAccount: publicProcedure.input(z.object({ accountId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getContactsByAccountId(input.accountId);
  }),

  getHistory: publicProcedure.input(z.object({ accountId: z.string().uuid() })).query(async ({ input }) => {
    return queries.getAccountHistory(input.accountId);
  }),
});
