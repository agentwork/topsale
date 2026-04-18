import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db";

import { type Interaction, interactions, type NewInteraction } from "../schema";

export interface InteractionsQueryParams {
  page?: number;
  pageSize?: number;
  accountId?: string;
  brandId?: string;
  contactId?: string;
  interactionType?: "meeting" | "call" | "email" | "message" | "event" | "sales_progress";
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function getInteractions(params: InteractionsQueryParams = {}): Promise<PaginatedResult<Interaction>> {
  const { page = 1, pageSize = 20, accountId, brandId, contactId, interactionType, startDate, endDate } = params;

  const whereConditions = [];

  if (accountId) {
    whereConditions.push(eq(interactions.accountId, accountId));
  }

  if (brandId) {
    whereConditions.push(eq(interactions.brandId, brandId));
  }

  if (contactId) {
    whereConditions.push(eq(interactions.contactIds, [contactId]));
  }

  if (interactionType) {
    whereConditions.push(eq(interactions.interactionType, interactionType));
  }

  if (startDate) {
    whereConditions.push(gte(interactions.createdAt, startDate));
  }

  if (endDate) {
    whereConditions.push(lte(interactions.createdAt, endDate));
  }

  const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(interactions).where(where).orderBy(desc(interactions.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(interactions).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return { data, total, page, pageSize, pageCount };
}

export async function getInteractionById(id: string): Promise<Interaction | undefined> {
  const result = await db.select().from(interactions).where(eq(interactions.id, id));
  return result[0];
}

export async function createInteraction(data: NewInteraction): Promise<Interaction> {
  const result = await db.insert(interactions).values(data).returning();
  return result[0];
}

export async function updateInteraction(id: string, data: Partial<NewInteraction>): Promise<Interaction | undefined> {
  const result = await db
    .update(interactions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(interactions.id, id))
    .returning();
  return result[0];
}

export async function deleteInteraction(id: string): Promise<boolean> {
  const result = await db.delete(interactions).where(eq(interactions.id, id));
  return (result.rowCount ?? 0) > 0;
}
