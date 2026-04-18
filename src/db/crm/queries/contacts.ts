import { and, arrayContains, desc, eq, like, sql } from "drizzle-orm";

import { db } from "@/db";

import { type Contact, contactBrandAssignments, contacts, type NewContact } from "../schema";

export interface ContactsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  accountId?: string;
  status?: "active" | "inactive";
  level?: "decision_maker" | "influencer" | "executor";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function getContacts(params: ContactsQueryParams = {}): Promise<PaginatedResult<Contact>> {
  const { page = 1, pageSize = 20, search, accountId, status, level } = params;

  const whereConditions = [];

  if (search?.trim()) {
    whereConditions.push(like(contacts.name, `%${search}%`));
  }

  if (accountId) {
    whereConditions.push(eq(contacts.accountId, accountId));
  }

  if (status) {
    whereConditions.push(eq(contacts.status, status));
  }

  if (level) {
    whereConditions.push(arrayContains(contacts.level, [level]));
  }

  const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(contacts).where(where).orderBy(desc(contacts.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(contacts).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return { data, total, page, pageSize, pageCount };
}

export async function getContactById(id: string): Promise<Contact | undefined> {
  const result = await db.select().from(contacts).where(eq(contacts.id, id));
  return result[0];
}

export async function createContact(data: NewContact): Promise<Contact> {
  const result = await db.insert(contacts).values(data).returning();
  return result[0];
}

export async function updateContact(id: string, data: Partial<NewContact>): Promise<Contact | undefined> {
  const result = await db
    .update(contacts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning();
  return result[0];
}

export async function deleteContact(id: string): Promise<boolean> {
  const result = await db.delete(contacts).where(eq(contacts.id, id));
  return (result.rowCount ?? 0) > 0;
}

export async function getContactBrandAssignments(contactId: string) {
  return db.select().from(contactBrandAssignments).where(eq(contactBrandAssignments.contactId, contactId));
}

export async function assignContactToBrand(contactId: string, brandId: string, role: "primary" | "daily" | "finance") {
  const result = await db
    .insert(contactBrandAssignments)
    .values({
      contactId,
      brandId,
      assignmentRole: role,
    })
    .returning();
  return result[0];
}

export async function removeContactFromBrand(contactId: string, brandId: string) {
  await db
    .delete(contactBrandAssignments)
    .where(and(eq(contactBrandAssignments.contactId, contactId), eq(contactBrandAssignments.brandId, brandId)));
}
