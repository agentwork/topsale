import { z } from "zod";

export const todoPriorityEnum = z.enum(["low", "medium", "high"]);
export const todoSortByEnum = z.enum(["title", "createdAt", "priority", "dueDate"]);
export const todoSortOrderEnum = z.enum(["asc", "desc"]);

export const todoQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  completed: z.boolean().optional(),
  priority: todoPriorityEnum.optional(),
  sortBy: todoSortByEnum.default("createdAt"),
  sortOrder: todoSortOrderEnum.default("desc"),
});

export const todoCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: todoPriorityEnum.default("medium"),
  dueDate: z.coerce.date().optional(),
});

export const todoUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    priority: todoPriorityEnum.optional(),
    dueDate: z.coerce.date().optional().nullable(),
    completed: z.boolean().optional(),
  }),
});

export const todoToggleSchema = z.object({
  id: z.string().uuid(),
  completed: z.boolean(),
});

export type TodoQueryInput = z.infer<typeof todoQuerySchema>;
export type TodoCreateInput = z.infer<typeof todoCreateSchema>;
export type TodoUpdateInput = z.infer<typeof todoUpdateSchema>;
export type TodoToggleInput = z.infer<typeof todoToggleSchema>;
