import { and, desc, eq, like, sql } from "drizzle-orm";

import { db } from "@/db";

import { type Group, groups, type NewGroup } from "../schema";

export interface GroupsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function getGroups(params: GroupsQueryParams = {}): Promise<PaginatedResult<Group>> {
  const { page = 1, pageSize = 20, search } = params;

  const whereConditions = [];

  if (search?.trim()) {
    whereConditions.push(like(groups.groupName, `%${search}%`));
  }

  const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(groups).where(where).orderBy(desc(groups.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(groups).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return { data, total, page, pageSize, pageCount };
}

export async function getGroupById(id: string): Promise<Group | undefined> {
  const result = await db.select().from(groups).where(eq(groups.id, id));
  return result[0];
}

export async function createGroup(data: NewGroup): Promise<Group> {
  const result = await db.insert(groups).values(data).returning();
  return result[0];
}

export async function updateGroup(id: string, data: Partial<NewGroup>): Promise<Group | undefined> {
  const result = await db
    .update(groups)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(groups.id, id))
    .returning();
  return result[0];
}

export async function deleteGroup(id: string): Promise<boolean> {
  const result = await db.delete(groups).where(eq(groups.id, id));
  return (result.rowCount ?? 0) > 0;
}
