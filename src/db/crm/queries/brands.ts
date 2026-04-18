import { and, desc, eq, like, sql } from "drizzle-orm";

import { db } from "@/db";

import { accounts, type Brand, brands, type NewBrand } from "../schema";

export interface BrandsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  accountId?: string;
  industryCategory?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function getBrands(params: BrandsQueryParams = {}): Promise<PaginatedResult<Brand>> {
  const { page = 1, pageSize = 20, search, accountId, industryCategory } = params;

  const whereConditions = [];

  if (search?.trim()) {
    whereConditions.push(like(brands.brandName, `%${search}%`));
  }

  if (accountId) {
    whereConditions.push(eq(brands.accountId, accountId));
  }

  if (industryCategory) {
    whereConditions.push(eq(brands.industryCategory, industryCategory));
  }

  const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(brands).where(where).orderBy(desc(brands.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(brands).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return { data, total, page, pageSize, pageCount };
}

export async function getBrandById(id: string): Promise<Brand | undefined> {
  const result = await db.select().from(brands).where(eq(brands.id, id));
  return result[0];
}

export async function createBrand(data: NewBrand): Promise<Brand> {
  const result = await db.insert(brands).values(data).returning();
  return result[0];
}

export async function updateBrand(id: string, data: Partial<NewBrand>): Promise<Brand | undefined> {
  const result = await db
    .update(brands)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(brands.id, id))
    .returning();
  return result[0];
}

export async function deleteBrand(id: string): Promise<boolean> {
  const result = await db.delete(brands).where(eq(brands.id, id));
  return (result.rowCount ?? 0) > 0;
}

export async function getClientBrands() {
  return db
    .select()
    .from(brands)
    .innerJoin(accounts, eq(brands.accountId, accounts.id))
    .where(eq(accounts.accountType, "client"));
}
