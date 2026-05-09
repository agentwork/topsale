import { desc, eq, like, sql } from "drizzle-orm";

import { db } from "@/db";
import { type NewTodo, type Todo, todos } from "@/db/schema";
import type { PaginatedResult } from "@/db/types";

export type TodoPriority = "low" | "medium" | "high";

export interface TodosQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  completed?: boolean;
  priority?: TodoPriority;
  sortBy?: "title" | "createdAt" | "priority" | "dueDate";
  sortOrder?: "asc" | "desc";
}

export async function getTodos(params: TodosQueryParams = {}): Promise<PaginatedResult<Todo>> {
  const { page = 1, pageSize = 20, search, completed, priority, sortBy = "createdAt", sortOrder = "desc" } = params;

  const whereConditions: ReturnType<typeof eq>[] = [];

  if (search?.trim()) {
    whereConditions.push(like(todos.title, `%${search}%`));
  }

  if (completed !== undefined) {
    whereConditions.push(eq(todos.completed, completed));
  }

  if (priority) {
    whereConditions.push(eq(todos.priority, priority));
  }

  const offset = (page - 1) * pageSize;
  const orderColumn =
    sortBy === "title"
      ? todos.title
      : sortBy === "priority"
        ? todos.priority
        : sortBy === "dueDate"
          ? todos.dueDate
          : todos.createdAt;

  const whereClause =
    whereConditions.length > 0
      ? whereConditions.length === 1
        ? whereConditions[0]
        : sql.join(whereConditions, sql` AND `)
      : undefined;

  const data = await db
    .select()
    .from(todos)
    .where(whereClause)
    .orderBy(sortOrder === "desc" ? desc(orderColumn) : orderColumn)
    .limit(pageSize)
    .offset(offset);

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(todos);

  return {
    data: data as Todo[],
    total: Number(countResult[0]?.count) || 0,
    page,
    pageSize,
    pageCount: Math.ceil((Number(countResult[0]?.count) || 0) / pageSize),
  };
}

export async function getTodoById(id: string) {
  const result = await db.select().from(todos).where(eq(todos.id, id));
  return result[0] as Todo | undefined;
}

export async function createTodo(data: NewTodo) {
  const result = await db.insert(todos).values(data).returning();
  return result[0] as Todo;
}

export async function updateTodo(id: string, data: Partial<NewTodo>) {
  const result = await db
    .update(todos)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(todos.id, id))
    .returning();
  return result[0] as Todo;
}

export async function toggleTodo(id: string, completed: boolean) {
  const result = await db.update(todos).set({ completed, updatedAt: new Date() }).where(eq(todos.id, id)).returning();
  return result[0] as Todo;
}

export async function deleteTodo(id: string) {
  const result = await db.delete(todos).where(eq(todos.id, id)).returning();
  return result[0] as Todo;
}
