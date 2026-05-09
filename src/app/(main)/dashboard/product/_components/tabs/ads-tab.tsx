"use client";

import { ProductsTable } from "../tables/products-table";

interface AdsTabProps {
  mainCode: "IAD" | "EXT";
}

export function AdsTab({ mainCode }: AdsTabProps) {
  return <ProductsTable filters={{ mainCode }} />;
}
