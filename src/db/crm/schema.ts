import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const accountTypeEnum = ["agency", "client"] as const;
export const agencyTierEnum = ["tier1", "tier2", "tier3"] as const;
export const paymentTermEnum = ["net30", "net60", "net90", "within30", "within45", "prepaid"] as const;
export const allianceEnum = ["apex", "omnet"] as const;
export const contactStatusEnum = ["active", "inactive"] as const;
export const contactLevelEnum = ["decision_maker", "influencer", "executor"] as const;
export const assignmentRoleEnum = ["primary", "daily", "finance"] as const;
export const interactionTypeEnum = ["meeting", "call", "email", "message", "event", "sales_progress"] as const;

export const groups = pgTable("crm_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupName: text("group_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("crm_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountName: text("account_name").notNull(),
  shortName: text("short_name").notNull(),
  taxId: text("tax_id"),
  personalId: text("personal_id"),
  address: text("address").notNull(),
  groupId: uuid("group_id").references(() => groups.id),
  accountType: text("account_type", { enum: accountTypeEnum }).notNull(),
  agencyTier: text("agency_tier", { enum: agencyTierEnum }).notNull(),
  contractUrl: text("contract_url"),
  accountOwner: text("account_owner"),
  primaryContactId: uuid("primary_contact_id"),
  customerPreference: text("customer_preference"),
  internalPolitics: text("internal_politics"),
  paymentTerm: text("payment_term", { enum: paymentTermEnum }).notNull(),
  alliance: text("alliance", { enum: allianceEnum }),
  isBlacklist: boolean("is_blacklist").default(false),
  status: text("status", { enum: ["active", "inactive"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accountHistory = pgTable("crm_account_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  changedField: text("changed_field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  changedBy: text("changed_by").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const brands = pgTable("crm_brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandName: text("brand_name").notNull(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  industryCategory: text("industry_category").notNull(),
  mediaRequirement: text("media_requirement").array(),
  deliveryNotes: text("delivery_notes"),
  cooperationNotes: text("cooperation_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contacts = pgTable("crm_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  name: text("name").notNull(),
  englishName: text("english_name"),
  title: text("title"),
  department: text("department"),
  tel: text("tel"),
  mobile: text("mobile"),
  email: text("email"),
  status: text("status", { enum: contactStatusEnum }).notNull().default("active"),
  level: text("level", { enum: contactLevelEnum }).array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactBrandAssignments = pgTable("crm_contact_brand_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id")
    .references(() => contacts.id)
    .notNull(),
  brandId: uuid("brand_id")
    .references(() => brands.id)
    .notNull(),
  assignmentRole: text("assignment_role", { enum: assignmentRoleEnum }).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
});

export const agencyBrandAssignments = pgTable("crm_agency_brand_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyAccountId: uuid("agency_account_id")
    .references(() => accounts.id)
    .notNull(),
  clientBrandId: uuid("client_brand_id")
    .references(() => brands.id)
    .notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
});

export const interactions = pgTable("crm_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  brandId: uuid("brand_id").references(() => brands.id),
  contactIds: uuid("contact_id").array(),
  quotationId: uuid("quotation_id"),
  interactionType: text("interaction_type", { enum: interactionTypeEnum }).notNull(),
  note: text("note"),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groupsRelations = relations(groups, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  group: one(groups, { fields: [accounts.groupId], references: [groups.id] }),
  brands: many(brands),
  contacts: many(contacts),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  account: one(accounts, { fields: [brands.accountId], references: [accounts.id] }),
  contactAssignments: many(contactBrandAssignments),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  account: one(accounts, { fields: [contacts.accountId], references: [accounts.id] }),
  brandAssignments: many(contactBrandAssignments),
}));

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;
export type AccountHistory = typeof accountHistory.$inferSelect;
export type NewAccountHistory = typeof accountHistory.$inferInsert;
