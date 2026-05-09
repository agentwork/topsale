import { relations } from "drizzle-orm";
import { boolean, date, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const quotationStatusEnum = pgEnum("quotation_status", [
  "draft",
  "pending_approval",
  "approved",
  "confirmed",
  "closed",
  "withdrawn",
]);

export const ticketTypeEnum = pgEnum("ticket_type", [
  "am_strategy",
  "am_data",
  "pm_custom",
  "as_material_confirm",
  "ds_proposal",
  "ds_material",
  "rd_tech_support",
  "mb_media_purchase",
]);

export const ticketStatusEnum = pgEnum("ticket_status", ["pending", "accepted", "processing", "completed", "rejected"]);

export const changeTypeEnum = pgEnum("change_type", ["top-up", "reduction"]);

export const quotations = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationNo: text("quotation_no").unique().notNull(),
  quotationDate: date("quotation_date").notNull(),
  validUntil: date("valid_until").notNull(),
  campaignName: text("campaign_name").notNull(),

  agencyId: uuid("agency_id"),
  customerId: uuid("customer_id").notNull(),
  brandIds: uuid("brand_ids").array().notNull(),

  ownerId: uuid("owner_id"),
  contactPhone: text("contact_phone"),

  status: quotationStatusEnum("status").default("draft").notNull(),
  isRushOrder: boolean("is_rush_order").default(false),
  isSpecialCase: boolean("is_special_case").default(false),

  subtotalNet: integer("subtotal_net").default(0),
  taxAmount: integer("tax_amount").default(0),
  totalGross: integer("total_gross").default(0),
  finalNet: integer("final_net"),

  larkApprovalId: text("lark_approval_id"),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotationLineItems = pgTable("quotation_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id")
    .references(() => quotations.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id").notNull(),
  displayName: text("display_name").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: integer("days").notNull(),
  unitPrice: integer("unit_price").notNull(),
  budget: integer("budget").notNull(),
  estImpressions: integer("est_impressions"),
  estClicks: integer("est_clicks"),
  estViews: integer("est_views"),
  estCtr: integer("est_ctr"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotationTargeting = pgTable("quotation_targeting", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id")
    .references(() => quotations.id, { onDelete: "cascade" })
    .unique()
    .notNull(),

  mediaCat: text("media_cat").array(),
  demoAge: text("demo_age").array(),
  demoGender: text("demo_gender"),
  geoLocation: text("geo_location").array(),
  income: text("income").array(),
  family: text("family").array(),
  occupation: text("occupation").array(),
  interests: text("interests").array(),

  fpSiteType: text("fp_site_type"),
  fpSiteUrl: text("fp_site_url"),
  fpAppCategory: text("fp_app_category"),
  fpApps: text("fp_apps"),

  consumerData: text("consumer_data"),

  interactAd: text("interact_ad"),
  interactSite: text("interact_site"),
  interactApp: text("interact_app"),
  audiencePkg: text("audience_pkg"),

  crmAdid: text("crm_adid"),

  contextKeywords: text("context_keywords"),
  brandSafety: text("brand_safety"),

  thirdPartyAudit: text("third_party_audit").array(),
  dataLoop: text("data_loop").array(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotationTickets = pgTable("quotation_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id")
    .references(() => quotations.id, { onDelete: "cascade" })
    .notNull(),
  larkTicketId: text("lark_ticket_id").notNull(),
  ticketType: ticketTypeEnum("ticket_type").notNull(),
  ticketStatus: ticketStatusEnum("ticket_status").default("pending").notNull(),
  assigneeName: text("assignee_name"),
  deepLink: text("deep_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotationInvoicePlans = pgTable("quotation_invoice_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id")
    .references(() => quotations.id, { onDelete: "cascade" })
    .notNull(),
  estMonth: text("est_month").notNull(),
  estAmount: integer("est_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quotationRevisionLog = pgTable("quotation_revision_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  quotationId: uuid("quotation_id")
    .references(() => quotations.id, { onDelete: "cascade" })
    .notNull(),
  revisionNo: integer("revision_no").notNull(),
  changeType: changeTypeEnum("change_type").notNull(),
  oldAmount: integer("old_amount").notNull(),
  newAmount: integer("new_amount").notNull(),
  larkApprovalId: text("lark_approval_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  lineItems: many(quotationLineItems),
  targeting: one(quotationTargeting),
  tickets: many(quotationTickets),
  invoicePlans: many(quotationInvoicePlans),
  revisions: many(quotationRevisionLog),
}));

export const quotationLineItemsRelations = relations(quotationLineItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationLineItems.quotationId],
    references: [quotations.id],
  }),
}));

export const quotationTargetingRelations = relations(quotationTargeting, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationTargeting.quotationId],
    references: [quotations.id],
  }),
}));

export const quotationTicketsRelations = relations(quotationTickets, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationTickets.quotationId],
    references: [quotations.id],
  }),
}));

export const quotationInvoicePlansRelations = relations(quotationInvoicePlans, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationInvoicePlans.quotationId],
    references: [quotations.id],
  }),
}));

export const quotationRevisionLogRelations = relations(quotationRevisionLog, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationRevisionLog.quotationId],
    references: [quotations.id],
  }),
}));

export type Quotation = typeof quotations.$inferSelect;
export type NewQuotation = typeof quotations.$inferInsert;
export type QuotationLineItem = typeof quotationLineItems.$inferSelect;
export type NewQuotationLineItem = typeof quotationLineItems.$inferInsert;
export type QuotationTargeting = typeof quotationTargeting.$inferSelect;
export type NewQuotationTargeting = typeof quotationTargeting.$inferInsert;
export type QuotationTicket = typeof quotationTickets.$inferSelect;
export type NewQuotationTicket = typeof quotationTickets.$inferInsert;
export type QuotationInvoicePlan = typeof quotationInvoicePlans.$inferSelect;
export type NewQuotationInvoicePlan = typeof quotationInvoicePlans.$inferInsert;
export type QuotationRevisionLog = typeof quotationRevisionLog.$inferSelect;
export type NewQuotationRevisionLog = typeof quotationRevisionLog.$inferInsert;
