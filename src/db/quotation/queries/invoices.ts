import { eq } from "drizzle-orm";

import { db } from "@/db";

import { type NewQuotationInvoicePlan, quotationInvoicePlans } from "../schema";

export async function getInvoicePlansByQuotationId(quotationId: string) {
  return db.select().from(quotationInvoicePlans).where(eq(quotationInvoicePlans.quotationId, quotationId));
}

export async function createInvoicePlan(data: NewQuotationInvoicePlan) {
  return db.insert(quotationInvoicePlans).values(data).returning();
}

export async function updateInvoicePlan(id: string, data: Partial<NewQuotationInvoicePlan>) {
  const [updated] = await db
    .update(quotationInvoicePlans)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(quotationInvoicePlans.id, id))
    .returning();
  return updated;
}

export async function deleteInvoicePlan(id: string) {
  const [deleted] = await db.delete(quotationInvoicePlans).where(eq(quotationInvoicePlans.id, id)).returning();
  return deleted;
}
