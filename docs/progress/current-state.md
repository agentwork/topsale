# 開發進度報告

> 最後更新：2026-05-09
> 開發計畫：`quotation-dev-plan.md`

---

## 1. 專案架構

```
src/
├── app/(main)/dashboard/          # 功能頁面（Colocation 架構）
│   ├── todo/                      # Todo 功能
│   │   ├── _components/           # 私有元件
│   │   ├── schema.ts              # Zod 驗證 Schema
│   │   └── page.tsx
│   ├── crm/                       # CRM 功能
│   │   ├── _components/           # 私有元件
│   │   ├── accounts/              # 帳戶子路由
│   │   ├── schema.ts              # Zod 驗證 Schema
│   │   └── page.tsx
│   ├── product/                   # 產品目錄功能
│   │   ├── _components/           # 私有元件
│   │   ├── [id]/edit/             # 產品編輯路由
│   │   ├── new/                   # 產品新增路由
│   │   ├── schema.ts              # Zod 驗證 Schema
│   │   └── page.tsx
│   ├── analytics/                 # 分析儀表板
│   ├── finance/                   # 財務儀表板
│   ├── default/                   # 預設儀表板
│   └── _components/sidebar/       # 全域側邊欄
├── db/                            # 資料庫層
│   ├── index.ts                   # Drizzle Client（匯入所有 schema）
│   ├── schema.ts                  # Todo 表定義
│   ├── types.ts                   # 共用類型（PaginatedResult）
│   ├── todos/queries.ts           # Todo CRUD 查詢
│   ├── crm/
│   │   ├── schema.ts              # CRM 表定義 + Relations
│   │   └── queries/               # CRM CRUD 查詢
│   │       ├── accounts.ts
│   │       ├── brands.ts
│   │       ├── contacts.ts
│   │       ├── groups.ts
│   │       └── interactions.ts
│   ├── product/
│   │   ├── schema.ts              # 產品目錄表定義 + Relations
│   │   └── queries/
│   │       └── products.ts        # 產品 CRUD 查詢
│   └── migrations/                # Drizzle 遷移記錄
├── server/routers/                # tRPC 路由
│   ├── index.ts                   # AppRouter 入口
│   ├── todos.ts                   # Todo Router
│   ├── crm/
│   │   ├── index.ts               # CRM Router 聚合
│   │   ├── accounts.ts
│   │   ├── brands.ts
│   │   ├── contacts.ts
│   │   ├── groups.ts
│   │   └── interactions.ts
│   └── product/
│       ├── index.ts               # Product Router 聚合
│       └── products.ts
└── lib/                           # 共用工具
```

---

## 2. 技術堆疊

| 層級 | 技術 | 說明 |
|------|------|------|
| API | tRPC | 型別安全的 API 呼叫，透過 hooks 使用 |
| 資料庫 | Drizzle ORM + Supabase (PostgreSQL) | 定義於 `db/schema.ts` |
| 驗證 | Zod | 輸入驗證，定義於各 feature 的 `schema.ts` |
| UI 狀態 | Zustand | 僅用於客戶端 UI 狀態 |
| 伺服器狀態 | TanStack Query | 透過 tRPC hooks 管理 |
| 表格 | TanStack Table | 用於資料表格 |
| 路由 | Next.js App Router | 使用 `_` 前綴表示非路由目錄 |

---

## 3. 資料庫 Schema

### 3.1 Todo 表（`todos`）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| title | text | 標題（必填） |
| description | text | 描述 |
| completed | boolean | 完成狀態 |
| priority | enum(low/medium/high) | 優先級 |
| dueDate | timestamp | 截止日期 |
| createdAt | timestamp | 建立時間 |
| updatedAt | timestamp | 更新時間 |

### 3.2 CRM 表

| 表名 | 說明 | 主要欄位 |
|------|------|----------|
| `crm_groups` | 客戶集團 | id, groupName |
| `crm_accounts` | 客戶帳戶 | id, accountName, shortName, accountType, agencyTier, paymentTerm, alliance, groupId |
| `crm_account_history` | 帳戶變更歷史 | id, accountId, changedField, oldValue, newValue |
| `crm_brands` | 品牌 | id, brandName, accountId, industryCategory |
| `crm_contacts` | 聯絡人 | id, accountId, name, email, mobile, status, level |
| `crm_contact_brand_assignments` | 聯絡人-品牌指派 | id, contactId, brandId, assignmentRole |
| `crm_agency_brand_assignments` | 代理商-品牌指派 | id, agencyAccountId, clientBrandId |
| `crm_interactions` | 互動記錄 | id, accountId, brandId, contactIds, interactionType, note |

**CRM 列舉型別：**
- `accountTypeEnum`: agency, client
- `agencyTierEnum`: tier1, tier2, tier3
- `paymentTermEnum`: net30, net60, net90, within30, within45, prepaid
- `allianceEnum`: apex, omnet
- `contactStatusEnum`: active, inactive
- `contactLevelEnum`: decision_maker, influencer, executor
- `assignmentRoleEnum`: primary, daily, finance
- `interactionTypeEnum`: meeting, call, email, message, event, sales_progress

### 3.4 Quotation 表（✅ 已完成）

| 表名 | 說明 | 主要欄位 |
|------|------|----------|
| `quotations` | 報價單表頭 | id, quotation_no, quotation_date, valid_until, campaign_name, agency_id, customer_id, brand_ids, owner_id, status, is_rush_order, is_special_case, is_affiliate, alliance_type, subtotal_net, tax_amount, total_gross, final_net, total_period_start, total_period_end, total_days, payment_terms, confirmed_at |
| `quotation_line_items` | 報價單明細 | id, quotation_id, product_id, display_name, features, start_date, end_date, days, unit_price, budget, est_impressions, est_clicks, est_views, est_ctr, is_bonus, bonus_ratio, bonus_limit, project_group_id, is_required |
| `quotation_targeting` | 投放條件 | id, quotation_id, media_cat, demo_age, demo_gender, geo_location, income, family, occupation, interests, fp_site_type, fp_browsed, fp_visit_type, fp_visit_place, fp_apps, consumer_data, interact_ad, interact_site, interact_media, audience_pkg, crm_adid, context_keywords, brand_safety, third_party_audit, data_loop |
| `quotation_tickets` | Lark 工單追蹤 | id, quotation_id, lark_ticket_id, ticket_type, ticket_status, assignee_name, deep_link, last_synced_at |
| `quotation_invoice_plans` | 發票拆分追蹤 | id, quotation_id, est_month, est_amount |
| `quotation_revision_log` | 修正紀錄 | id, quotation_id, revision_no, change_type, old_amount, new_amount, lark_approval_id |

**Quotation 列舉型別：**
- `quotationStatusEnum`: draft, pending_approval, approved, confirmed, closed, withdrawn
- `ticketTypeEnum`: am_strategy, am_data, pm_custom, as_material_confirm, ds_proposal, ds_material, rd_tech_support, mb_media_purchase
- `ticketStatusEnum`: pending, accepted, processing, completed, rejected
- `changeTypeEnum`: top-up, reduction

### 3.5 Product 表

| 表名 | 說明 | 主要欄位 |
|------|------|----------|
| `product_catalog` | 產品目錄 | id, productCode, mainCode, subCategory, productName, pricingUnit, unitPrice, status |
| `product_ad_extensions` | 廣告擴充 | id, productId, device, placement, format, size, creativeFormat |
| `product_package_extensions` | 套裝擴充 | id, productId, trafficBonus, creativeBonus, composition |
| `product_service_extensions` | 服務擴充 | id, productId, contentDescription, revisionLimit |
| `product_history` | 產品變更歷史 | id, productId, changedField, oldValue, newValue |

**Product 列舉型別：**
- `mainCodeEnum`: IAD, ISY, EXT, SVC, PKG
- `productStatusEnum`: draft, published, inactive
- `pricingUnitEnum`: CPM, CPC, CPV, 案, 篇, 人, 每一尺寸, 小時, 式

---

## 4. tRPC API 路由

### 4.1 Todo Router (`trpc.todos.*`)

| 方法 | 輸入 | 說明 |
|------|------|------|
| `list` | `todoQuerySchema` | 分頁查詢（支援搜尋、過濾、排序） |
| `getById` | `{ id: UUID }` | 依 ID 查詢 |
| `create` | `todoCreateSchema` | 建立待辦 |
| `update` | `todoUpdateSchema` | 更新待辦 |
| `toggle` | `todoToggleSchema` | 切換完成狀態 |
| `delete` | `{ id: UUID }` | 刪除待辦 |

### 4.2 CRM Router (`trpc.crm.*`)

#### Groups (`trpc.crm.groups.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `list` | `groupQuerySchema` | 分頁查詢 |
| `getById` | `{ id: UUID }` | 依 ID 查詢 |
| `create` | `groupCreateSchema` | 建立集團 |
| `update` | `groupUpdateSchema` | 更新集團 |
| `delete` | `{ id: UUID }` | 刪除集團 |

#### Accounts (`trpc.crm.accounts.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `list` | `accountQuerySchema` | 分頁查詢（支援類型、等級、集團過濾） |
| `getById` | `{ id: UUID }` | 依 ID 查詢 |
| `create` | `accountCreateSchema` | 建立帳戶 |
| `update` | `accountUpdateSchema` | 更新帳戶（含變更歷史記錄） |
| `delete` | `{ id: UUID }` | 刪除帳戶 |
| `getBrandsByAccount` | `{ accountId: UUID }` | 查詢帳戶品牌 |
| `getContactsByAccount` | `{ accountId: UUID }` | 查詢帳戶聯絡人 |
| `getHistory` | `{ accountId: UUID }` | 查詢變更歷史 |

#### Brands (`trpc.crm.brands.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `list` | `brandQuerySchema` | 分頁查詢 |
| `getById` | `{ id: UUID }` | 依 ID 查詢 |
| `create` | `brandCreateSchema` | 建立品牌 |
| `update` | `brandUpdateSchema` | 更新品牌 |
| `delete` | `{ id: UUID }` | 刪除品牌 |
| `getClientBrands` | — | 查詢所有客戶品牌 |

#### Contacts (`trpc.crm.contacts.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `list` | `contactQuerySchema` | 分頁查詢 |
| `getById` | `{ id: UUID }` | 依 ID 查詢 |
| `create` | `contactCreateSchema` | 建立聯絡人 |
| `update` | `contactUpdateSchema` | 更新聯絡人 |
| `delete` | `{ id: UUID }` | 刪除聯絡人 |
| `getBrandsByContact` | `{ contactId: UUID }` | 查詢聯絡人品牌指派 |
| `assignToBrand` | `contactAssignSchema` | 指派聯絡人到品牌 |
| `removeFromBrand` | `contactRemoveSchema` | 從品牌移除聯絡人 |

#### Interactions (`trpc.crm.interactions.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `list` | `interactionQuerySchema` | 分頁查詢（支援時間範圍過濾） |
| `getById` | `{ id: UUID }` | 依 ID 查詢 |
| `create` | `interactionCreateSchema` | 建立互動記錄 |
| `update` | `interactionUpdateSchema` | 更新互動記錄 |
| `delete` | `{ id: UUID }` | 刪除互動記錄 |

### 4.3 Product Router (`trpc.product.products.*`)

| 方法 | 輸入 | 說明 |
|------|------|------|
| `create` | `productCreateSchema` | 建立產品 |
| `getById` | `{ id: UUID }` | 依 ID 查詢 |
| `getByCode` | `{ productCode: string }` | 依產品代碼查詢 |
| `list` | `productFilterSchema` | 分頁查詢（支援主類別、狀態、搜尋） |
| `getActive` | — | 查詢所有已發布產品 |
| `update` | `productUpdateSchema` | 更新產品 |
| `delete` | `{ id: UUID }` | 刪除產品 |
| `clone` | `productCloneSchema` | 複製產品 |
| `publish` | `productPublishSchema` | 發布產品 |
| `deactivate` | `productDeactivateSchema` | 停用產品 |
| `getHistory` | `{ productId: UUID }` | 查詢變更歷史 |

### 4.4 Quotation Router（`trpc.quotation.*`）（✅ 已完成）

#### Quotations (`trpc.quotation.quotations.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `list` | `quotationQuerySchema` | 分頁查詢（支援狀態、客戶、代理商、負責業務過濾） |
| `getById` | `{ id: UUID }` | 依 ID 查詢（含明細 + 投放條件） |
| `create` | `quotationCreateSchema` | 建立報價單（自動產生 quotation_no + valid_until） |
| `update` | `quotationUpdateSchema` | 更新報價單 |
| `delete` | `{ id: UUID }` | 刪除報價單 |
| `submitForApproval` | `{ id: UUID, remark?: string }` | 送出審核 |
| `exportPdf` | `{ id: UUID }` | 匯出 PDF |

#### Line Items (`trpc.quotation.line-items.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `getByQuotation` | `{ quotationId: UUID }` | 查詢明細（按 start_date 排序） |
| `create` | `lineItemCreateSchema` | 新增明細（自動 recalculateTotals） |
| `update` | `lineItemUpdateSchema` | 更新明細（自動 recalculateTotals） |
| `delete` | `{ id: UUID }` | 刪除明細（自動 recalculateTotals） |

#### Targeting (`trpc.quotation.targeting.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `getByQuotation` | `{ quotationId: UUID }` | 查詢投放條件 |
| `upsert` | `targetingUpsertSchema` | 建立或更新投放條件 |

#### Tickets (`trpc.quotation.tickets.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `getByQuotation` | `{ quotationId: UUID }` | 查詢工單追蹤 |
| `create` | `ticketCreateSchema` | 建立 Lark 工單 |
| `syncStatus` | `ticketSyncSchema` | 同步工單狀態（Webhook） |

#### Invoices (`trpc.quotation.invoices.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `getByQuotation` | `{ quotationId: UUID }` | 查詢發票計畫 |
| `create` | `invoicePlanSchema` | 新增發票計畫 |
| `update` | `invoicePlanUpdateSchema` | 更新發票計畫 |
| `delete` | `{ id: UUID }` | 刪除發票計畫 |

#### Revisions (`trpc.quotation.revisions.*`)
| 方法 | 輸入 | 說明 |
|------|------|------|
| `getByQuotation` | `{ quotationId: UUID }` | 查詢修正紀錄 |
| `create` | `revisionCreateSchema` | 新增修正紀錄 |

---

## 5. Zod Schema 檔案

所有 feature 的 Zod 驗證 schema 統一放在對應的 `schema.ts` 中：

| Feature | 路徑 | 匯出的 Schema |
|---------|------|---------------|
| Todo | `src/app/(main)/dashboard/todo/schema.ts` | `todoQuerySchema`, `todoCreateSchema`, `todoUpdateSchema`, `todoToggleSchema` |
| CRM | `src/app/(main)/dashboard/crm/schema.ts` | `group*`, `account*`, `brand*`, `contact*`, `interaction*` 系列 schema |
| Product | `src/app/(main)/dashboard/product/schema.ts` | `productCreateSchema`, `productUpdateSchema`, `productFilterSchema`, `productCloneSchema`, `productPublishSchema`, `productDeactivateSchema` |
| Quotation | `src/app/(main)/dashboard/quotation/schema.ts` | `quotationCreateSchema`, `quotationUpdateSchema`, `quotationQuerySchema`, `lineItemCreateSchema`, `lineItemUpdateSchema`, `targetingUpsertSchema`, `ticketCreateSchema`, `ticketSyncSchema`, `invoicePlanSchema`, `revisionCreateSchema` |

---

## 6. 共用類型

### `src/db/types.ts`

```typescript
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
```

所有分頁查詢皆使用此統一回傳型別。

---

## 7. Drizzle Client 配置

`src/db/index.ts` 匯入所有 schema 模組：

```typescript
import * as crmSchema from "./crm/schema";
import * as productSchema from "./product/schema";
import * as quotationSchema from "./quotation/schema";
import * as schema from "./schema";

export const db = drizzle(pool, { schema: { ...schema, ...crmSchema, ...productSchema, ...quotationSchema } });
```

---

## 8. 已完成功能

| 功能 | 狀態 | 說明 |
|------|------|------|
| Todo CRUD | ✅ 完成 | 分頁、搜尋、過濾、排序、切換完成狀態 |
| CRM Groups | ✅ 完成 | 客戶集團管理 |
| CRM Accounts | ✅ 完成 | 帳戶管理，含變更歷史追蹤 |
| CRM Brands | ✅ 完成 | 品牌管理 |
| CRM Contacts | ✅ 完成 | 聯絡人管理，含品牌指派 |
| CRM Interactions | ✅ 完成 | 互動記錄管理 |
| Product Catalog | ✅ 完成 | 產品目錄 CRUD、複製、發布、停用 |
| Product Extensions | ✅ 完成 | 廣告/套裝/服務擴充管理 |
| Product History | ✅ 完成 | 產品變更歷史追蹤 |
| Quotation Module | ✅ 完成 | 報價單管理（列表、Wizard、View Page、工單、財務、簽核） |
| Analytics Dashboard | 🚧 開發中 | 風險分類帳、覆蓋率分類、預測目標 |
| Finance Dashboard | 🚧 開發中 | 現金流、淨值、儲蓄率、支出分析 |
| Default Dashboard | 🚧 開發中 | 提案區段表格、互動圖表 |

---

## 9. 已完成重構項目

| 項目 | 說明 |
|------|------|
| Drizzle Client 匯入所有 schema | 確保關聯查詢正常運作（含 quotation schema） |
| 共用 PaginatedResult 類型 | 消除重複定義，統一回傳格式 |
| Feature Schema 分離 | 每個 feature 有獨立的 `schema.ts` |
| Router 統一 Schema 導入 | 所有 router 從 feature schema 匯入，不再內聯定義 |
| Product Query 參數型別統一 | 新增 `ProductsQueryParams` 介面 |
| Product 表單 Schema 修復 | 移除 `.default()` 避免 react-hook-form 型別衝突 |
| Lint 修復 | 清理未使用的 imports、variables、parameters；修正 a11y 問題 |

---

## 10. Quotation 模組開發完成

### 10.1 資料庫層（Phase 1 ✅）

| 檔案 | 狀態 |
|------|------|
| `src/db/quotation/schema.ts` | ✅ 6 張表 + relations + types |
| `src/db/quotation/queries/quotations.ts` | ✅ CRUD + submitForApproval + 自動產生 quotation_no |
| `src/db/quotation/queries/line-items.ts` | ✅ CRUD + recalculateTotals |
| `src/db/quotation/queries/targeting.ts` | ✅ upsert |
| `src/db/quotation/queries/tickets.ts` | ✅ CRUD |
| `src/db/quotation/queries/invoices.ts` | ✅ CRUD |
| `src/db/quotation/queries/revisions.ts` | ✅ CRUD |

### 10.2 API 層（Phase 2 ✅）

| 檔案 | 狀態 |
|------|------|
| `src/server/routers/quotation/index.ts` | ✅ 聚合 6 個 sub-routers |
| `src/server/routers/quotation/quotations.ts` | ✅ list, getById, create, update, delete, submitForApproval, exportPdf |
| `src/server/routers/quotation/line-items.ts` | ✅ getByQuotation, create, update, delete |
| `src/server/routers/quotation/targeting.ts` | ✅ getByQuotation, upsert |
| `src/server/routers/quotation/tickets.ts` | ✅ getByQuotation, create, syncStatus |
| `src/server/routers/quotation/invoices.ts` | ✅ getByQuotation, create, update, delete |
| `src/server/routers/quotation/revisions.ts` | ✅ getByQuotation, create |
| `src/app/(main)/dashboard/quotation/schema.ts` | ✅ 所有 Zod validation schemas |

### 10.3 UI 層（Phase 3-6 ✅）

| 元件 | 路徑 | 狀態 |
|------|------|------|
| 列表頁 | `quotation/page.tsx` | ✅ 狀態統計卡片、批量操作、篩選、分頁 |
| 新增 Wizard | `quotation/new/page.tsx` | ✅ 4 步驟流程 |
| Step 1: 基本資料 | `_components/wizard/step1-basic-info.tsx` | ✅ |
| Step 2: 產品選品 | `_components/wizard/step2-product-items.tsx` | ✅ |
| Step 3: 投放條件 | `_components/wizard/step3-targeting.tsx` | ✅ |
| Step 4: 確認送出 | `_components/wizard/step4-confirmation.tsx` | ✅ |
| 詳情頁 | `quotation/[id]/page.tsx` | ✅ 多 Tab 視圖、載入骨架屏 |
| Header 區塊 | `_components/view/quotation-header.tsx` | ✅ |
| 摘要區塊 | `_components/view/quotation-summary.tsx` | ✅ |
| 投放條件區塊 | `_components/view/targeting-section.tsx` | ✅ |
| 專案編輯器 | `_components/project-editor/project-editor-dialog.tsx` | ✅ |
| 工單追蹤 | `_components/tickets/ticket-tracker.tsx` | ✅ |
| 發票追蹤 | `_components/financial/invoice-tracking.tsx` | ✅ |
| 修正紀錄 | `_components/financial/revision-log.tsx` | ✅ |
| 簽核對話框 | `_components/approval/approval-dialog.tsx` | ✅ |
| PDF 匯出 | `_components/export/pdf-export-button.tsx` | ✅ |

---

## 11. 待開發功能

| 功能 | 優先級 | 說明 |
|------|--------|------|
| Lark API 實際串接 | P0 | 工單建立、狀態同步、簽核流程 |
| PDF 匯出實際實作 | P1 | 使用 `@react-pdf/renderer` 產生 PDF |
| 代理商品牌指派 | P1 | `crm_agency_brand_assignments` 表的 CRUD |
| Product Extensions UI | P1 | 廣告/套裝/服務擴充的前端表單 |
| 權限管理 | P2 | 角色基礎存取控制 |
| 搜尋功能 | P2 | 全域搜尋對話框實作 |
