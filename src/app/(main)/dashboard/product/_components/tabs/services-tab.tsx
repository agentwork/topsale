"use client";

import { ProductsTable } from "../tables/products-table";

export function ServicesTab() {
  return <ProductsTable filters={{ mainCode: "SVC" }} />;
}
