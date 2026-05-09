import { router } from "../trpc";
import { crmRouter } from "./crm";
import { productRouterIndex } from "./product";
import { quotationRouter } from "./quotation";
import { todosRouter } from "./todos";

export const appRouter = router({
  todos: todosRouter,
  crm: crmRouter,
  product: productRouterIndex,
  quotation: quotationRouter,
});

export type AppRouter = typeof appRouter;
