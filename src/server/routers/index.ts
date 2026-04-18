import { router } from "../trpc";
import { crmRouter } from "./crm";
import { todosRouter } from "./todos";

export const appRouter = router({
  todos: todosRouter,
  crm: crmRouter,
});

export type AppRouter = typeof appRouter;
