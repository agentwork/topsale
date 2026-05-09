import { eq, sql } from "drizzle-orm";

import { db } from "@/db";

import { type NewQuotationRevisionLog, quotationRevisionLog } from "../schema";

export async function getRevisionsByQuotationId(quotationId: string) {
  return db
    .select()
    .from(quotationRevisionLog)
    .where(eq(quotationRevisionLog.quotationId, quotationId))
    .orderBy(sql`${quotationRevisionLog.revisionNo} DESC`);
}

export async function createRevision(data: NewQuotationRevisionLog) {
  return db.insert(quotationRevisionLog).values(data).returning();
}
