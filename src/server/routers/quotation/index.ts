import { router } from "../../trpc";
import { invoicesRouter } from "./invoices";
import { lineItemsRouter } from "./line-items";
import { quotationsRouter } from "./quotations";
import { revisionsRouter } from "./revisions";
import { targetingRouter } from "./targeting";
import { ticketsRouter } from "./tickets";

export const quotationRouter = router({
  quotations: quotationsRouter,
  lineItems: lineItemsRouter,
  targeting: targetingRouter,
  invoices: invoicesRouter,
  revisions: revisionsRouter,
  tickets: ticketsRouter,
});
