import { relations } from "drizzle-orm";
import { date, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const mainCodeEnum = ["IAD", "ISY", "EXT", "SVC", "PKG"] as const;
export const productStatusEnum = ["draft", "published", "inactive"] as const;
export const pricingUnitEnum = ["CPM", "CPC", "CPV", "案", "篇", "人", "每一尺寸", "小時", "式"] as const;

export const products = pgTable("product_catalog", {
  id: uuid("id").primaryKey().defaultRandom(),
  productCode: text("product_code").unique(),
  ragicId: text("ragic_id"),
  mainCode: text("main_code", { enum: mainCodeEnum }).notNull(),
  subCategory: text("sub_category").notNull(),
  productName: text("product_name").notNull(),
  productNameEn: text("product_name_en"),
  description: text("description"),
  pricingUnit: text("pricing_unit", { enum: pricingUnitEnum }).notNull(),
  unitPrice: integer("unit_price").notNull(),
  priority: integer("priority").default(0),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status", { enum: productStatusEnum }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

export const adExtensions = pgTable("product_ad_extensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull()
    .unique(),
  device: text("device"),
  placement: text("placement"),
  format: text("format"),
  size: text("size"),
  creativeFormat: text("creative_format"),
  ctrMin: integer("ctr_min"),
  ctrMax: integer("ctr_max"),
  erMin: integer("er_min"),
  erMax: integer("er_max"),
  vtrMin: integer("vtr_min"),
  vtrMax: integer("vtr_max"),
  pmpFeatures: jsonb("pmp_features"),
  leadingCtrMin: integer("leading_ctr_min"),
  leadingCtrMax: integer("leading_ctr_max"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const packageExtensions = pgTable("product_package_extensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull()
    .unique(),
  trafficBonus: text("traffic_bonus"),
  creativeBonus: text("creative_bonus"),
  threshold: integer("threshold"),
  constraints: text("constraints"),
  composition: jsonb("composition"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serviceExtensions = pgTable("product_service_extensions", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull()
    .unique(),
  contentDescription: text("content_description"),
  notes: text("notes"),
  revisionLimit: integer("revision_limit"),
  deliveryTime: text("delivery_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productHistory = pgTable("product_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  changedField: text("changed_field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedBy: text("changed_by").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  adExtension: one(adExtensions, {
    fields: [products.id],
    references: [adExtensions.productId],
  }),
  packageExtension: one(packageExtensions, {
    fields: [products.id],
    references: [packageExtensions.productId],
  }),
  serviceExtension: one(serviceExtensions, {
    fields: [products.id],
    references: [serviceExtensions.productId],
  }),
  history: many(productHistory),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type AdExtension = typeof adExtensions.$inferSelect;
export type NewAdExtension = typeof adExtensions.$inferInsert;
export type PackageExtension = typeof packageExtensions.$inferSelect;
export type NewPackageExtension = typeof packageExtensions.$inferInsert;
export type ServiceExtension = typeof serviceExtensions.$inferSelect;
export type NewServiceExtension = typeof serviceExtensions.$inferInsert;
export type ProductHistory = typeof productHistory.$inferSelect;
export type NewProductHistory = typeof productHistory.$inferInsert;
