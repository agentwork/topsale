import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import * as queries from '@/db/todos/queries';

export const todosRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        completed: z.boolean().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        sortBy: z.enum(['title', 'createdAt', 'priority', 'dueDate']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ input }) => {
      return queries.getTodos(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const todo = await queries.getTodoById(input.id);
      if (!todo) throw new Error('Todo not found');
      return todo;
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
        dueDate: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.createTodo(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          priority: z.enum(['low', 'medium', 'high']).optional(),
          dueDate: z.coerce.date().optional().nullable(),
          completed: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return queries.updateTodo(input.id, input.data);
    }),

  toggle: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.toggleTodo(input.id, input.completed);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return queries.deleteTodo(input.id);
    }),
});
