import { router } from "../../trpc";
import { productRouter } from "./products";

export const productRouterIndex = router({
  products: productRouter,
});
