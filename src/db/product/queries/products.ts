import { and, desc, eq, like, or, sql } from "drizzle-orm";

import { db } from "@/db";
import type { PaginatedResult } from "@/db/types";

import {
  adExtensions,
  type NewAdExtension,
  type NewPackageExtension,
  type NewProduct,
  type NewServiceExtension,
  type Product,
  packageExtensions,
  productHistory,
  products,
  serviceExtensions,
} from "../schema";

export interface ProductsQueryParams {
  mainCode?: "IAD" | "ISY" | "EXT" | "SVC" | "PKG";
  subCategory?: string;
  status?: "draft" | "published" | "inactive";
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function createProduct(data: NewProduct) {
  return db.insert(products).values(data).returning();
}

export async function getProductById(id: string) {
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] || null;
}

export async function getProductByCode(productCode: string) {
  const result = await db.select().from(products).where(eq(products.productCode, productCode)).limit(1);
  return result[0] || null;
}

export async function listProducts(filters: ProductsQueryParams = {}): Promise<PaginatedResult<Product>> {
  const { mainCode, subCategory, status, search, page = 1, pageSize = 20 } = filters;
  const conditions = [];

  if (mainCode) conditions.push(eq(products.mainCode, mainCode));
  if (subCategory) conditions.push(eq(products.subCategory, subCategory));
  if (status) conditions.push(eq(products.status, status));
  if (search) {
    conditions.push(
      or(
        like(products.productName, `%${search}%`),
        like(products.productCode, `%${search}%`),
        like(products.subCategory, `%${search}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.priority), desc(products.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(products).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    pageCount,
  };
}

export async function getActiveProducts() {
  return db.select().from(products).where(eq(products.status, "published")).orderBy(products.priority);
}

export async function updateProduct(id: string, data: Partial<NewProduct>) {
  const [updated] = await db
    .update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return updated;
}

export async function deleteProduct(id: string) {
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
  return deleted;
}

export async function cloneProduct(id: string, newProductCode: string, clonedBy: string) {
  const original = await getProductById(id);
  if (!original) throw new Error("Product not found");

  const [newProduct] = await createProduct({
    productCode: newProductCode,
    ragicId: undefined,
    mainCode: original.mainCode,
    subCategory: original.subCategory,
    productName: original.productName,
    productNameEn: original.productNameEn || undefined,
    description: original.description || undefined,
    pricingUnit: original.pricingUnit,
    unitPrice: original.unitPrice,
    priority: original.priority || 0,
    status: "draft",
  });

  await createProductHistory({
    productId: newProduct.id,
    changedField: "cloned_from",
    oldValue: id,
    newValue: newProductCode,
    changedBy: clonedBy,
  });

  return newProduct;
}

export async function publishProduct(id: string, publishedBy: string) {
  const [updated] = await db
    .update(products)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  await createProductHistory({
    productId: id,
    changedField: "status",
    oldValue: "draft",
    newValue: "published",
    changedBy: publishedBy,
  });

  return updated;
}

export async function deactivateProduct(id: string, deactivatedBy: string) {
  const product = await getProductById(id);
  if (!product) throw new Error("Product not found");

  const [updated] = await db
    .update(products)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  await createProductHistory({
    productId: id,
    changedField: "status",
    oldValue: product.status,
    newValue: "inactive",
    changedBy: deactivatedBy,
  });

  return updated;
}

export async function createProductHistory(data: {
  productId: string;
  changedField: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
}) {
  return db.insert(productHistory).values(data).returning();
}

export async function getProductHistory(productId: string) {
  return db
    .select()
    .from(productHistory)
    .where(eq(productHistory.productId, productId))
    .orderBy(desc(productHistory.changedAt));
}

export async function createAdExtension(data: NewAdExtension) {
  return db.insert(adExtensions).values(data).returning();
}

export async function getAdExtension(productId: string) {
  const result = await db.select().from(adExtensions).where(eq(adExtensions.productId, productId)).limit(1);
  return result[0] || null;
}

export async function updateAdExtension(productId: string, data: Partial<NewAdExtension>) {
  const [updated] = await db
    .update(adExtensions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(adExtensions.productId, productId))
    .returning();
  return updated;
}

export async function createPackageExtension(data: NewPackageExtension) {
  return db.insert(packageExtensions).values(data).returning();
}

export async function getPackageExtension(productId: string) {
  const result = await db.select().from(packageExtensions).where(eq(packageExtensions.productId, productId)).limit(1);
  return result[0] || null;
}

export async function updatePackageExtension(productId: string, data: Partial<NewPackageExtension>) {
  const [updated] = await db
    .update(packageExtensions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(packageExtensions.productId, productId))
    .returning();
  return updated;
}

export async function createServiceExtension(data: NewServiceExtension) {
  return db.insert(serviceExtensions).values(data).returning();
}

export async function getServiceExtension(productId: string) {
  const result = await db.select().from(serviceExtensions).where(eq(serviceExtensions.productId, productId)).limit(1);
  return result[0] || null;
}

export async function updateServiceExtension(productId: string, data: Partial<NewServiceExtension>) {
  const [updated] = await db
    .update(serviceExtensions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(serviceExtensions.productId, productId))
    .returning();
  return updated;
}
