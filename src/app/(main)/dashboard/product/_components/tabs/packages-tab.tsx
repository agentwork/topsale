"use client";

import { ProductsTable } from "../tables/products-table";

export function PackagesTab() {
  return <ProductsTable filters={{ mainCode: "PKG" }} />;
}
