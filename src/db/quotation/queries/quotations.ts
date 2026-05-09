import { and, desc, eq, like, or, sql } from "drizzle-orm";

import { db } from "@/db";
import type { PaginatedResult } from "@/db/types";

import type { NewQuotation, Quotation } from "../schema";
import { type quotationStatusEnum, quotations } from "../schema";

export interface QuotationsQueryParams {
  status?: (typeof quotationStatusEnum.enumValues)[number];
  customerId?: string;
  agencyId?: string;
  ownerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function generateQuotationNo(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `QT-${yyyy}${mm}${dd}-${random}`;
}

function calculateValidUntil(quotationDate: string): string {
  const date = new Date(quotationDate);
  date.setDate(date.getDate() + 10);
  return date.toISOString().split("T")[0];
}

export async function createQuotation(data: Omit<NewQuotation, "quotationNo" | "validUntil">) {
  const quotationNo = generateQuotationNo();
  const validUntil = calculateValidUntil(data.quotationDate);

  return db
    .insert(quotations)
    .values({
      ...data,
      quotationNo,
      validUntil,
    })
    .returning();
}

export async function getQuotationById(id: string) {
  const result = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
  return result[0] || null;
}

export async function getQuotationByNo(quotationNo: string) {
  const result = await db.select().from(quotations).where(eq(quotations.quotationNo, quotationNo)).limit(1);
  return result[0] || null;
}

export async function listQuotations(filters: QuotationsQueryParams = {}): Promise<PaginatedResult<Quotation>> {
  const { status, customerId, agencyId, ownerId, search, page = 1, pageSize = 20 } = filters;
  const conditions = [];

  if (status) conditions.push(eq(quotations.status, status));
  if (customerId) conditions.push(eq(quotations.customerId, customerId));
  if (agencyId) conditions.push(eq(quotations.agencyId, agencyId));
  if (ownerId) conditions.push(eq(quotations.ownerId, ownerId));
  if (search) {
    conditions.push(or(like(quotations.campaignName, `%${search}%`), like(quotations.quotationNo, `%${search}%`)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(quotations).where(where).orderBy(desc(quotations.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(quotations).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    pageCount,
  };
}

export async function updateQuotation(id: string, data: Partial<NewQuotation>) {
  const [updated] = await db
    .update(quotations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(quotations.id, id))
    .returning();
  return updated;
}

export async function confirmQuotation(id: string) {
  const [updated] = await db
    .update(quotations)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(quotations.id, id))
    .returning();
  return updated;
}

export async function withdrawQuotation(id: string) {
  const [updated] = await db
    .update(quotations)
    .set({ status: "withdrawn", updatedAt: new Date() })
    .where(eq(quotations.id, id))
    .returning();
  return updated;
}

export async function closeQuotation(id: string) {
  const [updated] = await db
    .update(quotations)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(quotations.id, id))
    .returning();
  return updated;
}

export async function deleteQuotation(id: string) {
  const [deleted] = await db.delete(quotations).where(eq(quotations.id, id)).returning();
  return deleted;
}

export async function submitForApproval(id: string, _remark?: string) {
  const larkApprovalId = `approval-${Date.now()}`;
  const [updated] = await db
    .update(quotations)
    .set({
      status: "pending_approval",
      larkApprovalId,
      updatedAt: new Date(),
    })
    .where(eq(quotations.id, id))
    .returning();
  return updated;
}
