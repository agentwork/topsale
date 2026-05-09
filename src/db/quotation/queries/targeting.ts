import { eq } from "drizzle-orm";

import { db } from "@/db";

import { type NewQuotationTargeting, quotationTargeting } from "../schema";

export async function getTargetingByQuotationId(quotationId: string) {
  const result = await db
    .select()
    .from(quotationTargeting)
    .where(eq(quotationTargeting.quotationId, quotationId))
    .limit(1);
  return result[0] || null;
}

export async function upsertTargeting(data: NewQuotationTargeting) {
  const existing = await getTargetingByQuotationId(data.quotationId);

  if (existing) {
    const [updated] = await db
      .update(quotationTargeting)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quotationTargeting.quotationId, data.quotationId))
      .returning();
    return updated;
  }

  const [created] = await db.insert(quotationTargeting).values(data).returning();
  return created;
}
