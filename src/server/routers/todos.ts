import { z } from "zod";

import {
  todoCreateSchema,
  todoQuerySchema,
  todoToggleSchema,
  todoUpdateSchema,
} from "@/app/(main)/dashboard/todo/schema";
import * as queries from "@/db/todos/queries";

import { publicProcedure, router } from "../trpc";

export const todosRouter = router({
  list: publicProcedure.input(todoQuerySchema).query(async ({ input }) => {
    return queries.getTodos(input);
  }),

  getById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    const todo = await queries.getTodoById(input.id);
    if (!todo) throw new Error("Todo not found");
    return todo;
  }),

  create: publicProcedure.input(todoCreateSchema).mutation(async ({ input }) => {
    return queries.createTodo(input);
  }),

  update: publicProcedure.input(todoUpdateSchema).mutation(async ({ input }) => {
    return queries.updateTodo(input.id, input.data);
  }),

  toggle: publicProcedure.input(todoToggleSchema).mutation(async ({ input }) => {
    return queries.toggleTodo(input.id, input.completed);
  }),

  delete: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input }) => {
    return queries.deleteTodo(input.id);
  }),
});
