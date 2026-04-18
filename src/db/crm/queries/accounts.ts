import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";

import { db } from "@/db";

import { type Account, accountHistory, accounts, brands, contacts, type NewAccount } from "../schema";

export interface AccountsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  accountType?: "agency" | "client";
  agencyTier?: "tier1" | "tier2" | "tier3";
  groupId?: string;
  status?: "active" | "inactive";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function getAccounts(params: AccountsQueryParams = {}): Promise<PaginatedResult<Account>> {
  const { page = 1, pageSize = 20, search, accountType, agencyTier, groupId, status } = params;

  const whereConditions = [];

  if (search?.trim()) {
    whereConditions.push(or(like(accounts.accountName, `%${search}%`), like(accounts.shortName, `%${search}%`)));
  }

  if (accountType) {
    whereConditions.push(eq(accounts.accountType, accountType));
  }

  if (agencyTier) {
    whereConditions.push(eq(accounts.agencyTier, agencyTier));
  }

  if (groupId) {
    whereConditions.push(eq(accounts.groupId, groupId));
  }

  if (status) {
    whereConditions.push(eq(accounts.status, status));
  }

  const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(accounts).where(where).orderBy(desc(accounts.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(accounts).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return { data, total, page, pageSize, pageCount };
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const result = await db.select().from(accounts).where(eq(accounts.id, id));
  return result[0];
}

export async function getAccountsWithoutGroup(params: AccountsQueryParams = {}): Promise<PaginatedResult<Account>> {
  const { page = 1, pageSize = 20, search, accountType, status } = params;

  const conditions: (ReturnType<typeof eq> | ReturnType<typeof isNull> | ReturnType<typeof or>)[] = [
    isNull(accounts.groupId),
  ];

  if (search?.trim()) {
    conditions.push(or(like(accounts.accountName, `%${search}%`), like(accounts.shortName, `%${search}%`)));
  }

  if (accountType) {
    conditions.push(eq(accounts.accountType, accountType));
  }

  if (status) {
    conditions.push(eq(accounts.status, status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(accounts)
      .where(where ?? undefined)
      .orderBy(desc(accounts.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(accounts)
      .where(where ?? undefined),
  ]);

  const total = countResult[0]?.count ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return { data, total, page, pageSize, pageCount };
}

export async function createAccount(data: NewAccount): Promise<Account> {
  const result = await db.insert(accounts).values(data).returning();
  return result[0];
}

export async function updateAccount(id: string, data: Partial<NewAccount>): Promise<Account | undefined> {
  const result = await db
    .update(accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(accounts.id, id))
    .returning();
  return result[0];
}

export async function deleteAccount(id: string): Promise<boolean> {
  const result = await db.delete(accounts).where(eq(accounts.id, id));
  return (result.rowCount ?? 0) > 0;
}

export async function getBrandsByAccountId(accountId: string) {
  return db.select().from(brands).where(eq(brands.accountId, accountId));
}

export async function getContactsByAccountId(accountId: string) {
  return db.select().from(contacts).where(eq(contacts.accountId, accountId));
}

export async function createAccountHistory(data: {
  accountId: string;
  changedField: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
}) {
  return db.insert(accountHistory).values(data).returning();
}

export async function getAccountHistory(accountId: string) {
  return db
    .select()
    .from(accountHistory)
    .where(eq(accountHistory.accountId, accountId))
    .orderBy(desc(accountHistory.changedAt));
}
