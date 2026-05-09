# Quotation Feature - 報價單模組

> 本文件基於 `docs/prd/quotation-prd.md` 規格，說明 Quotation Feature 的標準開發模式與實作要点。

---

## 1. 專案架構總覽

```
src/
├── db/                                  # 資料庫層
│   ├── index.ts                         # Drizzle client (pg Pool)
│   ├── schema.ts                        # 所有 Table Schema
│   └── quotation/
│       ├── schema.ts                   # Quotation Schema Definitions
│       └── queries/
│           ├── quotations.ts           # Quotation CRUD
│           ├── line-items.ts           # Line Item CRUD
│           ├── targeting.ts            # Targeting Conditions
│           ├── invoices.ts             # Invoice Tracking
│           └── revisions.ts            # Revision Log
├── server/
│   ├── trpc.ts                         # tRPC 初始化
│   └── routers/
│       ├── index.ts                     # Root router
│       └── quotation/
│           ├── index.ts                # Quotation Router (aggregator)
│           ├── quotations.ts           # Quotation API
│           ├── line-items.ts           # Line Item API
│           ├── targeting.ts            # Targeting API
│           ├── invoices.ts             # Invoice API
│           └── tickets.ts              # Lark Ticket Integration API
├── app/
│   └── (main)/dashboard/quotation/     # Feature Route (Colocation)
│       ├── page.tsx                     # 報價單列表入口
│       ├── new/                         # 建立報價單 (Step 1 -> Step 2)
│       │   └── page.tsx
│       ├── [id]/                        # 報價單 View Page
│       │   ├── page.tsx
│       │   └── edit/                    # 編輯報價單
│       │       └── page.tsx
│       └── _components/
│           ├── wizard/                  # 分步建立流程
│           │   ├── step1-basic-info.tsx
│           │   └── step2-product-items.tsx
│           ├── view/                    # View Page 區塊
│           │   ├── quotation-header.tsx
│           │   ├── line-items-table.tsx
│           │   ├── quotation-summary.tsx
│           │   ├── terms-footer.tsx
│           │   ├── profit-monitor.tsx
│           │   └── targeting-section.tsx
│           ├── project-editor/          # 專案編輯器
│           │   ├── project-editor-dialog.tsx
│           │   ├── required-items.tsx
│           │   ├── optional-items.tsx
│           │   └── bonus-items.tsx
│           ├── tickets/                 # 工單追蹤區
│           │   ├── ticket-tracker.tsx
│           │   └── create-ticket-dialog.tsx
│           ├── financial/               # 財務管理
│           │   ├── invoice-tracking.tsx
│           │   ├── revision-log.tsx
│           │   └── related-records.tsx
│           ├── forms/                   # 表單组件
│           │   ├── quotation-form.tsx
│           │   └── line-item-form.tsx
│           ├── tables/                  # 表格组件
│           │   └── quotations-table.tsx
│           └── shared/                  # 共享组件
│               ├── status-badge.tsx
│               ├── profit-indicator.tsx
│               └── cascading-selects.tsx
└── lib/
    └── trpc.ts                         # Client-side tRPC hooks
```

### 核心設計原則

| 原則 | 說明 |
|------|------|
| **Colocation First** | Feature 相關檔案放在同一個目錄 |
| **`_` 前綴** | `_components/`, `_hooks/` 表示私有（不是 route） |
| **Step Wizard** | STEP 1 (基本資料) → STEP 2 (產品明細) → View Page |
| **SSOT** | 聯盟報價單與主報價單共用同一筆 UUID |
| **Lark Integration** | 工單透過 Lark API 雙向同步 |

---

## 2. Database Layer

### 2.1 Drizzle Schema (`src/db/quotation/schema.ts`)

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, date, jsonb, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ Enums ============
export const quotationStatusEnum = ['draft', 'pending_approval', 'approved', 'confirmed', 'closed', 'withdrawn'] as const;
export const ticketTypeEnum = [
  'am_strategy', 'am_data', 'pm_custom',
  'as_material_confirm',
  'ds_proposal', 'ds_material',
  'rd_tech_support',
  'mb_media_purchase',
] as const;
export const ticketStatusEnum = ['pending', 'accepted', 'processing', 'completed', 'rejected'] as const;
export const changeTypeEnum = ['top-up', 'reduction'] as const;
export const approvalLevelEnum = ['member', 'lead', 'manager'] as const;

// ============ Quotation Header ============
export const quotations = pgTable('quotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationNo: text('quotation_no').unique().notNull(),        // QT-YYYYMMDD-SERIAL
  quotationDate: date('quotation_date').notNull(),
  validUntil: date('valid_until').notNull(),                    // quotation_date + 10 days
  campaignName: text('campaign_name').notNull(),

  // STEP 1: Basic Info
  agencyId: uuid('agency_id').references(() => crm_accounts.id), // FK -> CRM Account (Agency)
  customerId: uuid('customer_id').references(() => crm_accounts.id).notNull(), // FK -> CRM Account (Client)
  brandIds: uuid('brand_ids').array().notNull(),                // FK -> CRM Brand (multi-select)

  // Owner
  ownerId: uuid('owner_id').notNull(),                          // FK -> User
  contactPhone: text('contact_phone'),                          // Auto-filled from owner

  // Status & Tags
  status: text('status', { enum: quotationStatusEnum }).default('draft').notNull(),
  isRushOrder: boolean('is_rush_order').default(false),
  isSpecialCase: boolean('is_special_case').default(false),

  // Affiliate Linkage
  isAffiliate: boolean('is_affiliate').default(false),
  allianceType: text('alliance_type'),                          // apex / omnet

  // Financial Summary
  subtotalNet: integer('subtotal_net').default(0),              // 小計(未稅)
  taxAmount: integer('tax_amount').default(0),                  // 稅額 (5%)
  totalGross: integer('total_gross').default(0),                // 總額(含稅)
  finalNet: integer('final_net'),                               // SSOT: 最終成交金額

  // Period
  totalPeriodStart: date('total_period_start'),                 // min(start_date) of line items
  totalPeriodEnd: date('total_period_end'),                     // max(end_date) of line items
  totalDays: integer('total_days'),                             // total_period_end - total_period_start

  // Payment Terms (auto-filled from customer)
  paymentTerms: text('payment_terms'),

  // Timestamps
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ Quotation Line Item ============
export const quotationLineItems = pgTable('quotation_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(), // FK -> Product Catalog

  // Display
  displayName: text('display_name').notNull(),                  // Auto-filled from Product
  features: jsonb('features'),                                  // Feature checkboxes

  // Schedule
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  days: integer('days').notNull(),                              // end_date - start_date

  // Pricing
  unitPrice: integer('unit_price').notNull(),                   // From Product
  budget: integer('budget').notNull(),                          // User input

  // Estimated Metrics (auto-calculated)
  estImpressions: integer('est_impressions'),
  estClicks: integer('est_clicks'),
  estViews: integer('est_views'),
  estCtr: numeric('est_ctr'),                                   // Decimal

  // Bonus
  isBonus: boolean('is_bonus').default(false),
  bonusRatio: numeric('bonus_ratio'),                           // Bonus 比例
  bonusLimit: numeric('bonus_limit'),                           // Bonus 上限

  // Project linkage
  projectGroupId: uuid('project_group_id'),                     // PKG group ID
  isRequired: boolean('is_required').default(false),            // PKG required item

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ Targeting Conditions (View Page 2) ============
export const quotationTargeting = pgTable('quotation_targeting', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull().unique(),

  // Media Category (multi-select)
  mediaCat: text('media_cat').array(),

  // Demographics
  demoAge: text('demo_age').array(),                            // 18-24, 25-34, ...
  demoGender: text('demo_gender'),                              // M / F / ALL
  geoLocation: text('geo_location').array(),                    // 北區, 中區, ...
  income: text('income').array(),                               // 高, 中, 低
  family: text('family').array(),                               // 單身, 結婚無小孩, ...
  occupation: text('occupation').array(),
  interests: text('interests').array(),

  // Digital Footprint (free text)
  fpSiteType: text('fp_site_type'),
  fpBrowsed: text('fp_browsed'),
  fpVisitType: text('fp_visit_type'),
  fpVisitPlace: text('fp_visit_place'),
  fpApps: text('fp_apps'),

  // Behavior
  consumerData: text('consumer_data'),
  interactAd: text('interact_ad'),
  interactSite: text('interact_site'),
  interactMedia: text('interact_media'),
  audiencePkg: text('audience_pkg'),
  crmAdid: text('crm_adid'),                                    // Apple IDFA / Android AAID

  // Context
  contextKeywords: text('context_keywords'),
  brandSafety: text('brand_safety'),

  // Third Party
  thirdPartyAudit: text('third_party_audit').array(),           // DCM, IAS, DoubleVerify, LnData
  dataLoop: text('data_loop').array(),                          // Meta, Google Ads, DV360

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ Lark Ticket Tracking ============
export const quotationTickets = pgTable('quotation_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  larkTicketId: text('lark_ticket_id').notNull(),               // Lark Ticket ID
  ticketType: text('ticket_type', { enum: ticketTypeEnum }).notNull(),
  ticketStatus: text('ticket_status', { enum: ticketStatusEnum }).default('pending').notNull(),
  assigneeName: text('assignee_name'),                          // 處理人
  deepLink: text('deep_link'),                                  // TopSale URL back-link
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ Invoice Tracking ============
export const quotationInvoicePlans = pgTable('quotation_invoice_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  estMonth: date('est_month').notNull(),                        // 預計開立月份 (YYYY/MM)
  estAmount: integer('est_amount').notNull(),                   // 預計開立金額(未稅)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============ Revision Log ============
export const quotationRevisionLog = pgTable('quotation_revision_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  quotationId: uuid('quotation_id').references(() => quotations.id).notNull(),
  revisionNo: integer('revision_no').notNull(),                 // 累加版本號
  changeType: text('change_type', { enum: changeTypeEnum }).notNull(),
  oldAmount: integer('old_amount').notNull(),
  newAmount: integer('new_amount').notNull(),
  larkApprovalId: text('lark_approval_id'),                     // FK -> Lark Approval
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

// ============ Relations ============
export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  agency: one(crm_accounts, { fields: [quotations.agencyId], references: [crm_accounts.id] }),
  customer: one(crm_accounts, { fields: [quotations.customerId], references: [crm_accounts.id] }),
  lineItems: many(quotationLineItems),
  targeting: one(quotationTargeting),
  tickets: many(quotationTickets),
  invoicePlans: many(quotationInvoicePlans),
  revisions: many(quotationRevisionLog),
}));

export const quotationLineItemsRelations = relations(quotationLineItems, ({ one }) => ({
  quotation: one(quotations, { fields: [quotationLineItems.quotationId], references: [quotations.id] }),
  product: one(products, { fields: [quotationLineItems.productId], references: [products.id] }),
}));

// ============ Types ============
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
export type QuotationRevision = typeof quotationRevisionLog.$inferSelect;
export type NewQuotationRevision = typeof quotationRevisionLog.$inferInsert;
```

### Schema 設計要點

| 項目 | 語法 | 說明 |
|------|------|------|
| 報價單號 | `text('quotation_no').unique().notNull()` | QT-YYYYMMDD-SERIAL 格式 |
| 多選品牌 | `uuid('brand_ids').array()` | PostgreSQL UUID ARRAY |
| JSON 功能 | `jsonb('features')` | 可勾選的功能列表 |
| 小數指標 | `numeric('est_ctr')` | CTR 等比率欄位 |
| 唯一關聯 | `.unique()` on targeting | 一報價單對應一筆投放條件 |
| SSOT 欄位 | `finalNet` | 業務不可見，聯盟專用 |

---

## 3. API Layer (tRPC)

### 3.1 Router 結構 (`src/server/routers/quotation/`)

```
quotation/index.ts        - 聚合所有 Quotation sub-routers
quotation/quotations.ts   - Quotation CRUD + status transitions
quotation/line-items.ts   - Line Item CRUD
quotation/targeting.ts    - Targeting Conditions CRUD
quotation/invoices.ts     - Invoice Tracking
quotation/tickets.ts      - Lark Ticket Integration
```

### 3.2 Quotations Router (`src/server/routers/quotation/quotations.ts`)

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import * as queries from '@/db/quotation/queries/quotations';
import { quotationStatusEnum } from '@/db/quotation/schema';

export const quotationsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        status: z.enum(quotationStatusEnum).optional(),
        customerId: z.string().uuid().optional(),
        agencyId: z.string().uuid().optional(),
        ownerId: z.string().uuid().optional(),
        isAffiliate: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      return queries.getQuotations(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const quotation = await queries.getQuotationById(input.id);
      if (!quotation) throw new Error('Quotation not found');
      return quotation;
    }),

  create: publicProcedure
    .input(
      z.object({
        campaignName: z.string().min(1),
        agencyId: z.string().uuid().optional(),
        customerId: z.string().uuid(),
        brandIds: z.array(z.string().uuid()).min(1),
        ownerId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.createQuotation(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          campaignName: z.string().min(1).optional(),
          agencyId: z.string().uuid().optional().nullable(),
          customerId: z.string().uuid().optional(),
          brandIds: z.array(z.string().uuid()).optional(),
          ownerId: z.string().uuid().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return queries.updateQuotation(input.id, input.data);
    }),

  confirm: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return queries.confirmQuotation(input.id);
    }),

  withdraw: publicProcedure
    .input(z.object({ id: z.string().uuid(), type: z.enum(['full', 'partial']) }))
    .mutation(async ({ input }) => {
      return queries.withdrawQuotation(input.id, input.type);
    }),

  close: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return queries.closeQuotation(input.id);
    }),
});
```

### 3.3 Line Items Router (`src/server/routers/quotation/line-items.ts`)

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import * as queries from '@/db/quotation/queries/line-items';

export const lineItemsRouter = router({
  getByQuotation: publicProcedure
    .input(z.object({ quotationId: z.string().uuid() }))
    .query(async ({ input }) => {
      return queries.getLineItemsByQuotationId(input.quotationId);
    }),

  create: publicProcedure
    .input(
      z.object({
        quotationId: z.string().uuid(),
        productId: z.string().uuid(),
        displayName: z.string().min(1),
        startDate: z.string(),
        endDate: z.string(),
        days: z.number().int().positive(),
        unitPrice: z.number().int().min(0),
        budget: z.number().int().min(0),
        features: z.array(z.string()).optional(),
        isBonus: z.boolean().optional(),
        bonusRatio: z.string().optional(),
        projectGroupId: z.string().uuid().optional(),
        isRequired: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.createLineItem(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          displayName: z.string().min(1).optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          days: z.number().int().positive().optional(),
          unitPrice: z.number().int().min(0).optional(),
          budget: z.number().int().min(0).optional(),
          features: z.array(z.string()).optional(),
          isBonus: z.boolean().optional(),
          bonusRatio: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return queries.updateLineItem(input.id, input.data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return queries.deleteLineItem(input.id);
    }),
});
```

### 3.4 Targeting Router (`src/server/routers/quotation/targeting.ts`)

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import * as queries from '@/db/quotation/queries/targeting';

export const targetingRouter = router({
  getByQuotation: publicProcedure
    .input(z.object({ quotationId: z.string().uuid() }))
    .query(async ({ input }) => {
      return queries.getTargetingByQuotationId(input.quotationId);
    }),

  upsert: publicProcedure
    .input(
      z.object({
        quotationId: z.string().uuid(),
        mediaCat: z.array(z.string()).optional(),
        demoAge: z.array(z.string()).optional(),
        demoGender: z.string().optional(),
        geoLocation: z.array(z.string()).optional(),
        income: z.array(z.string()).optional(),
        family: z.array(z.string()).optional(),
        occupation: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
        fpSiteType: z.string().optional(),
        fpBrowsed: z.string().optional(),
        fpVisitType: z.string().optional(),
        fpVisitPlace: z.string().optional(),
        fpApps: z.string().optional(),
        consumerData: z.string().optional(),
        interactAd: z.string().optional(),
        interactSite: z.string().optional(),
        interactMedia: z.string().optional(),
        audiencePkg: z.string().optional(),
        crmAdid: z.string().optional(),
        contextKeywords: z.string().optional(),
        brandSafety: z.string().optional(),
        thirdPartyAudit: z.array(z.string()).optional(),
        dataLoop: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.upsertTargeting(input);
    }),
});
```

### 3.5 Tickets Router (`src/server/routers/quotation/tickets.ts`)

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import * as queries from '@/db/quotation/queries/tickets';
import { ticketTypeEnum, ticketStatusEnum } from '@/db/quotation/schema';

export const ticketsRouter = router({
  getByQuotation: publicProcedure
    .input(z.object({ quotationId: z.string().uuid() }))
    .query(async ({ input }) => {
      return queries.getTicketsByQuotationId(input.quotationId);
    }),

  create: publicProcedure
    .input(
      z.object({
        quotationId: z.string().uuid(),
        ticketType: z.enum(ticketTypeEnum),
      })
    )
    .mutation(async ({ input }) => {
      return queries.createTicket(input);
    }),

  syncStatus: publicProcedure
    .input(
      z.object({
        larkTicketId: z.string(),
        ticketStatus: z.enum(ticketStatusEnum),
        assigneeName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.syncTicketStatus(input);
    }),
});
```

---

## 4. UI Layer

### 4.1 報價單建立流程 (Wizard)

```
┌─────────────────────────────────────────────────────────────┐
│                    STEP 1: 基本資料                          │
├─────────────────────────────────────────────────────────────┤
│  代理商 (optional) ── 下拉選單 (搜尋: 名稱/統編)             │
│  客戶     (required) ── 下拉選單 (搜尋: 名稱/統編)           │
│  品牌     (required) ── 多選下拉 (搜尋: 名稱)                │
│  Campaign Name (required) ── 文字輸入                        │
│                                                             │
│                    [ 下一步 ]                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    STEP 2: 產品與廣告品項                     │
├─────────────────────────────────────────────────────────────┤
│  第一層：類別 (Main_Code) ── 下拉選單                        │
│  第二層：子類別 (Sub_Category) ── 依類別映射                 │
│  屬性篩選 (Physical_Attributes) ── 可搜尋下拉                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 選定結果: 自動帶入全名 (隱藏技術 ID)                   │   │
│  │ 走期: [起] ~ [訖]  Date Picker                       │   │
│  │ 預算: 數字 (千分位，無小數點)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ 新增品項 ]  [ 完成並檢視 ]                                │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 View Page 結構

```
┌─────────────────────────────────────────────────────────────┐
│  報價單表頭 (Header)                                         │
│  報價單號 | 報價日期 | 有效日期 | 負責業務 | 聯絡電話          │
│  總走期 | 總天數 | 付款條件                                   │
├─────────────────────────────────────────────────────────────┤
│  報價單明細 (Line Items Table)                               │
│  Feature | 天數 | 單價 | 預訂曝光 | 預訂點擊 | 預訂觀看 | CTR  │
│  (自動按走期起始日期遞增排序)                                 │
├─────────────────────────────────────────────────────────────┤
│  總計區塊 (Summary - Customer Facing)                        │
│  合計數據 | 小計(未稅) | 稅額(5%) | 總額(含稅)                │
├─────────────────────────────────────────────────────────────┤
│  投放條件 (Targeting - View Page 2)                          │
│  媒體類別 | 年齡 | 性別 | 居住地 | 收入 | 家庭 | 職業 | ...    │
├─────────────────────────────────────────────────────────────┤
│  條款與表尾 (Terms & Company Profiles)                       │
│  甲方(VMFIVE) 資訊 | 乙方(客戶) 資訊 | 用印區                  │
├─────────────────────────────────────────────────────────────┤
│  內部利潤監控 (Internal Only)                                │
│  利潤燈號 🟢🟡🟠🔴 | 預估成本率 (Admin 可見, Sales 隱藏)      │
├─────────────────────────────────────────────────────────────┤
│  工單追蹤區 (Ticket Tracker)                                 │
│  工單編號 | 類型 | 狀態 | 處理人 | 最後異動時間                │
├─────────────────────────────────────────────────────────────┤
│  財務管理 (Internal Only)                                    │
│  發票拆分追蹤 | 修正紀錄 | 關聯財務單據                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 專案編輯器 (Project Editor Dialog)

```
┌─────────────────────────────────────────────────────────────┐
│  專案屬性編輯視窗                                             │
├──────────────────────────┬──────────────────────────────────┤
│  品項挑選                 │  組成規則 (Composition)           │
│  ☑ 必選品項 (不可取消)    │  - 適用組合                       │
│  ☐ 選配品項 (可加選)      │  - 起報門檻                       │
│  ☐ 贈送品項 (Bonus)       │                                  │
│    └ 比例調整: [8]%       │  贈送規則 (Bonus)                 │
│      (上限: 10%)          │  - 流量贈送                       │
│                          │  - 素材贈送                       │
│  即時試算: $XXX,XXX       │  - 贈送上限                       │
├──────────────────────────┴──────────────────────────────────┤
│  [ 取消 ]  [ 確認 ]                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 關鍵業務邏輯

### 5.1 報價單號產生規則

```
QT-YYYYMMDD-SERIAL
例: QT-20260309-001
```

- 日期部分：建立當天的 YYYYMMDD
- 序號部分：當日第 N 筆報價單，從 001 開始累加

### 5.2 簽核流程

| 啟動者 | 金額 | 簽核路徑 |
|--------|------|----------|
| 組員 | < 50 萬 | John/Daniel/Ingrid → Bella 或 Gillian/Cola → Eric |
| 組員 | >= 50 萬 | (上述組長) → River Yang |
| 小組長 | 不限 | Bella/Eric → River Yang |

### 5.3 狀態轉換與鎖定規則

| 規則 | 條件 | 限制 |
|------|------|------|
| Rule 2 | 狀態為「確認執行」 | 改銷售明細、預算、走期需重新簽核 |
| Rule 2a | 已發出「AS 素材確認通知」Ticket | **禁止修改明細** |
| Rule 3 | 改 Campaign 名稱 | 需通知執行投手 |
| Rule 4 | 狀態為「確認執行」 | **不可修改**代理商、客戶、品牌 |

### 5.4 抽單/加碼/減項規則

| 操作 | 觸發條件 | 系統動作 |
|------|----------|----------|
| 完全抽單 | 整筆不執行 | 狀態變「已抽單」，通知負責投手 + 直屬主管 |
| 部份抽單 | 部分品項不執行 | 通知負責投手 + 直屬主管，紀錄修改歷史 |
| 加碼/減項 | 調整預算總額 | 發起 Lark 審核工單，通過後寫入 Revision Log |

### 5.5 贈送 (Bonus) 規則

- 類別選擇「贈送」時，可選取 `產品 (SAD)` 或 `服務 (SVC)` 主檔
- 單價與金額強制鎖定為 **0**
- PDF 匯出時標註「贈送 (Bonus)」

### 5.6 聯盟連動 (Affiliate Linkage)

```
偵測: CRM Account.alliance 包含 APEX 或 Omnet
      │
      ▼
  啟用連動流程
      │
      ├── 即時同步: 主模組 <-> 聯盟模組
      ├── 權限控制: 業務不可見折扣與折扣後金額
      └── 狀態鎖定: 確認執行後全面鎖定
```

### 5.7 Lark 工單整合

| 方向 | 機制 | 說明 |
|------|------|------|
| Outbound | `Lark.Flow.CreateTicket` API | 推送報價單資訊至 Lark |
| Inbound | Webhook | 接收 Lark 狀態更新，回寫至報價單 |

**工單類型：**

| 負責團隊 | 工單類別 | 備註 |
|----------|----------|------|
| AM/PM | AM 策略提案 / AM 數據分析 / PM 客製需求 | 串接至 AM/PM Lark Group |
| AS | AS 素材確認通知 | 串接至 AS Lark Group |
| DS | DS 提案製作 / DS 素材製作 | 串接至 DS Lark Group |
| RD | RD 技術支援 | 僅限特定人員可操作 |
| MB | MB 媒體採購 | 僅限 AS 人員可操作 |

### 5.8 發票通知規則

| 觸發條件 | 通知對象 |
|----------|----------|
| 走期結束 3 日/2 週/1 月仍有未開金額 | 業務 |
| AR 逾期 2 週/1 月 | 業務 |

### 5.9 急單/特例標籤

| 標籤 | 判定條件 |
|------|----------|
| 急單 (`is_rush_order`) | 簽核通過日時與走期起日 < 3 天 (不含) |
| 特例 (`is_special_case`) | 有發出【PM 客製需求】Ticket |

---

## 6. PDF 匯出規則

| 規則 | 說明 |
|------|------|
| 合併頁面 | Page 1 (表頭+明細+總計) + Page 2 (投放條件) |
| 欄位過濾 | 未填寫項目匯出時不顯示 |
| 儲存格優化 | Section 4「鎖定類型」內容重複時垂直合併 |
| 章印 | 甲方媒體發稿章自動帶入數位章 |
| Page 3 | 產品、專案、服務之特別注意事項 |
| 贈送標註 | 贈送品項明確標註「贈送 (Bonus)」 |

---

## 7. 財務管理

### 7.1 發票拆分與追蹤

| 欄位 | 規則 |
|------|------|
| 預計開立月份 | 必填，可分拆多筆 |
| 預計開立金額 | 必填，數字 (含千分位，無小數點) |
| 未開立發票金額 | `Quotation_Final_Net - invoiced_amt` |
| 已開立發票金額 | `Σ Invoice_Net - Σ Credit_Net` |

### 7.2 拋轉發票程序

```
執行條件: 狀態 = 「確認執行」 AND 已上傳「用印檔案」
         │
         ▼
    支援多次拋轉
         │
         ▼
    IF Final_Net > invoiced_amt → 顯示於 Pending Dashboard
         │
         ▼
    總拋轉金額不可超過 Final_Net (防呆)
```

### 7.3 修正紀錄 (Revision Log)

| 欄位 | 說明 |
|------|------|
| 版本號 | 累加 |
| 變更類型 | top-up / reduction |
| 原金額 / 新金額 | 變更前後金額 |
| 簽核單號 | 關聯 Lark Approval |

---

## 8. 外部依賴

| 依賴 | 說明 |
|------|------|
| CRM Module | Account (agency/client), Brand |
| Product Module | Product Catalog (選品) |
| User Module | 負責業務清單 |
| Lark API | 工單建立、狀態同步、簽核流程 |
| PDF Library | 報價單匯出 |

---

## 9. Feature 開發檢查清單

- [ ] 在 `src/db/quotation/schema.ts` 定義所有 tables
- [ ] 在 `src/db/quotation/queries/` 實作 CRUD queries
- [ ] 在 `src/server/routers/quotation/` 實作 tRPC routers
- [ ] 在 `src/app/(main)/dashboard/quotation/` 實作 UI
- [ ] 實作 Step Wizard (STEP 1 → STEP 2 → View)
- [ ] 實作專案編輯器 (Project Editor Dialog)
- [ ] 實作級聯選品邏輯 (Main_Code → Sub_Category → Attributes)
- [ ] 實作報價單號自動產生邏輯
- [ ] 實作聯盟偵測與連動
- [ ] 實作 Lark 工單 API 串接 (Outbound + Inbound Webhook)
- [ ] 實作簽核流程
- [ ] 實作狀態轉換與鎖定規則
- [ ] 實作抽單/加碼/減項邏輯
- [ ] 實作發票追蹤與拋轉
- [ ] 實作 PDF 匯出功能
- [ ] 實作利潤燈號顯示
- [ ] 實作急單/特例標籤
- [ ] 新增 Sidebar 導航項目
- [ ] 新增 Search Dialog 項目
- [ ] 更新 `docs/progress/current-state.md`

---

## 10. 環境變數

```bash
# 現有設定即可，Quotation 使用同一個 DATABASE_URL
DATABASE_URL=postgresql://...

# Lark API 設定 (工單整合)
LARK_APP_ID=...
LARK_APP_SECRET=...
LARK_WEBHOOK_SECRET=...
```
