import { z } from "zod";

import { accountCreateSchema, accountQuerySchema, accountUpdateSchema } from "@/app/(main)/dashboard/crm/schema";
import * as queries from "@/db/crm/queries/accounts";
import type { NewAccount } from "@/db/crm/schema";

import { publicProcedure, router } from "../../trpc";

export const accountsRouter = router({
  list: publicProcedure.input(accountQuerySchema).query(async ({ input }) => {
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
