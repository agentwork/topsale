import { router } from "../../trpc";
import { accountsRouter } from "./accounts";
import { brandsRouter } from "./brands";
import { contactsRouter } from "./contacts";
import { groupsRouter } from "./groups";
import { interactionsRouter } from "./interactions";

export const crmRouter = router({
  groups: groupsRouter,
  accounts: accountsRouter,
  brands: brandsRouter,
  contacts: contactsRouter,
  interactions: interactionsRouter,
});
