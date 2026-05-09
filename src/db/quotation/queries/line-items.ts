import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";

import { type NewQuotationLineItem, quotationLineItems, quotations } from "../schema";

export async function getLineItemsByQuotationId(quotationId: string) {
  return db
    .select()
    .from(quotationLineItems)
    .where(eq(quotationLineItems.quotationId, quotationId))
    .orderBy(asc(quotationLineItems.startDate));
}

export async function createLineItem(data: NewQuotationLineItem) {
  return db.insert(quotationLineItems).values(data).returning();
}

export async function updateLineItem(id: string, data: Partial<NewQuotationLineItem>) {
  const [updated] = await db
    .update(quotationLineItems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(quotationLineItems.id, id))
    .returning();
  return updated;
}

export async function deleteLineItem(id: string) {
  const [deleted] = await db.delete(quotationLineItems).where(eq(quotationLineItems.id, id)).returning();
  return deleted;
}

export async function recalculateTotals(quotationId: string) {
  const result = await db
    .select({
      subtotalNet: sql<number>`COALESCE(SUM(${quotationLineItems.budget}), 0)`,
    })
    .from(quotationLineItems)
    .where(eq(quotationLineItems.quotationId, quotationId));

  const subtotalNet = result[0]?.subtotalNet ?? 0;
  const taxAmount = Math.round(subtotalNet * 0.05);
  const totalGross = subtotalNet + taxAmount;

  const [updated] = await db
    .update(quotations)
    .set({
      subtotalNet,
      taxAmount,
      totalGross,
      updatedAt: new Date(),
    })
    .where(eq(quotations.id, quotationId))
    .returning();

  return updated;
}
