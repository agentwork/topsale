# Quotation Module 開發計畫

> 建立日期：2026-05-09
> 最後更新：2026-05-09
> 參考文件：`docs/prd/quotation-prd.md`、`docs/features/quotation-feature.md`
> 狀態：**Phase 1-6 已完成** ✅

---

## 開發階段總覽

| 階段 | 內容 | 產出 | 狀態 |
|------|------|------|------|
| Phase 1 | 資料庫層 — Schema + Migrations + Queries | Drizzle schema、migration SQL、query functions | ✅ 完成 |
| Phase 2 | API 層 — tRPC Routers | 6 個 sub-router + 聚合 router | ✅ 完成 |
| Phase 3 | UI 層 — 報價單列表 + Step Wizard | 列表頁、STEP 1-4 | ✅ 完成 |
| Phase 4 | UI 層 — View Page + 投放條件 | View Page 1 + View Page 2 | ✅ 完成 |
| Phase 5 | UI 層 — 專案編輯器 + 財務管理 | Project Editor Dialog、發票追蹤、修正紀錄 | ✅ 完成 |
| Phase 6 | 整合 — Lark 工單 + PDF 匯出 + 簽核 | 工單追蹤、簽核對話框、PDF 匯出按鈕 | ✅ 完成 |

---

## 完成狀態

- **pnpm build**: ✅ 通過
- **pnpm lint**: ✅ 通過（0 errors, 0 warnings）
- **TypeScript**: ✅ 通過

---

## 待完成項目

| 項目 | 說明 | 優先級 |
|------|------|--------|
| Lark API 實際串接 | 工單建立、狀態同步、簽核流程 | P0 |
| PDF 匯出實際實作 | 使用 `@react-pdf/renderer` 產生 PDF | P1 |
| 條款與用印資料持久化 | 將條款表單資料儲存至資料庫 | P1 |

---

## Phase 1: 資料庫層

### 1.1 Schema 定義

**檔案：** `src/db/quotation/schema.ts`

| 表名 | 說明 | 優先級 |
|------|------|--------|
| `quotations` | 報價單表頭 | P0 |
| `quotation_line_items` | 報價單明細 | P0 |
| `quotation_targeting` | 投放條件 | P0 |
| `quotation_tickets` | Lark 工單追蹤 | P1 |
| `quotation_invoice_plans` | 發票拆分追蹤 | P1 |
| `quotation_revision_log` | 修正紀錄 | P1 |

**Enum 定義：**

```typescript
quotationStatusEnum: draft, pending_approval, approved, confirmed, closed, withdrawn
ticketTypeEnum: am_strategy, am_data, pm_custom, as_material_confirm, ds_proposal, ds_material, rd_tech_support, mb_media_purchase
ticketStatusEnum: pending, accepted, processing, completed, rejected
changeTypeEnum: top-up, reduction
```

**Dependencies:**
- `crm_accounts` (FK: agency_id, customer_id)
- `crm_brands` (FK: brand_ids array)
- `products` (FK: product_id in line_items)

### 1.2 Drizzle Client 更新

**檔案：** `src/db/index.ts`

```typescript
import * as quotationSchema from "./quotation/schema";

export const db = drizzle(pool, {
  schema: { ...schema, ...crmSchema, ...productSchema, ...quotationSchema },
});
```

### 1.3 Migration

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 1.4 Query Functions

**目錄：** `src/db/quotation/queries/`

| 檔案 | 函式 | 說明 |
|------|------|------|
| `quotations.ts` | `getQuotations(params)` | 分頁查詢報價單 |
| | `getQuotationById(id)` | 依 ID 查詢（含 line items + targeting） |
| | `createQuotation(data)` | 建立報價單（自動產生 quotation_no） |
| | `updateQuotation(id, data)` | 更新報價單 |
| | `confirmQuotation(id)` | 狀態轉為 confirmed |
| | `withdrawQuotation(id, type)` | 抽單（full/partial） |
| | `closeQuotation(id)` | 結案 |
| `line-items.ts` | `getLineItemsByQuotationId(id)` | 查詢明細（按 start_date 排序） |
| | `createLineItem(data)` | 新增明細 |
| | `updateLineItem(id, data)` | 更新明細 |
| | `deleteLineItem(id)` | 刪除明細 |
| | `recalculateTotals(quotationId)` | 重新計算 subtotal/tax/total |
| `targeting.ts` | `getTargetingByQuotationId(id)` | 查詢投放條件 |
| | `upsertTargeting(data)` | 建立或更新投放條件 |
| `tickets.ts` | `getTicketsByQuotationId(id)` | 查詢工單追蹤 |
| | `createTicket(data)` | 建立工單（呼叫 Lark API） |
| | `syncTicketStatus(data)` | 同步工單狀態（Webhook callback） |
| `invoices.ts` | `getInvoicePlansByQuotationId(id)` | 查詢發票計畫 |
| | `createInvoicePlan(data)` | 新增發票計畫 |
| | `updateInvoicePlan(id, data)` | 更新發票計畫 |
| `revisions.ts` | `getRevisionsByQuotationId(id)` | 查詢修正紀錄 |
| | `createRevision(data)` | 新增修正紀錄 |

---

## Phase 2: API 層

### 2.1 Router 結構

**目錄：** `src/server/routers/quotation/`

| 檔案 | Router | 說明 |
|------|--------|------|
| `index.ts` | `quotationRouter` | 聚合所有 sub-routers |
| `quotations.ts` | `quotationsRouter` | 報價單 CRUD + 狀態轉換 |
| `line-items.ts` | `lineItemsRouter` | 明細 CRUD |
| `targeting.ts` | `targetingRouter` | 投放條件 CRUD |
| `tickets.ts` | `ticketsRouter` | Lark 工單整合 |
| `invoices.ts` | `invoicesRouter` | 發票追蹤 |

### 2.2 Schema 定義

**檔案：** `src/app/(main)/dashboard/quotation/schema.ts`

| Schema | 用途 |
|--------|------|
| `quotationCreateSchema` | STEP 1 基本資料 |
| `quotationUpdateSchema` | 更新報價單 |
| `quotationQuerySchema` | 列表查詢參數 |
| `lineItemCreateSchema` | 新增明細 |
| `lineItemUpdateSchema` | 更新明細 |
| `targetingUpsertSchema` | 投放條件 |
| `ticketCreateSchema` | 建立工單 |
| `ticketSyncSchema` | 同步工單狀態 |
| `invoicePlanSchema` | 發票計畫 |

### 2.3 Root Router 註冊

**檔案：** `src/server/routers/index.ts`

```typescript
import { quotationRouter } from "./quotation";

export const appRouter = router({
  todos: todosRouter,
  crm: crmRouter,
  product: productRouterIndex,
  quotation: quotationRouter,  // 新增
});
```

---

## Phase 3: UI 層 — 列表 + Wizard

### 3.1 報價單列表

**檔案：** `src/app/(main)/dashboard/quotation/page.tsx`

| 元件 | 路徑 | 說明 |
|------|------|------|
| 列表頁 | `page.tsx` | 報價單總覽 |
| 表格 | `_components/tables/quotations-table.tsx` | TanStack Table |
| 狀態徽章 | `_components/shared/status-badge.tsx` | 狀態顏色 |
| 利潤燈號 | `_components/shared/profit-indicator.tsx` | 利潤燈號 |

**表格欄位：**
- 報價單號、Campaign Name、客戶、負責業務、狀態、總額、總走期、利潤燈號、急單標籤、建立日期

### 3.2 建立報價單 — STEP 1

**檔案：** `src/app/(main)/dashboard/quotation/new/page.tsx`

| 元件 | 路徑 | 說明 |
|------|------|------|
| Wizard 容器 | `_components/wizard/wizard-container.tsx` | Step 流程控制 |
| STEP 1 | `_components/wizard/step1-basic-info.tsx` | 基本資料表單 |

**STEP 1 欄位：**
- 代理商（可選，下拉搜尋）
- 客戶（必填，下拉搜尋；代理商未填則必填）
- 品牌（必填，多選下拉）
- Campaign Name（必填）

**級聯邏輯：**
```
選擇代理商 → 過濾客戶清單（client 類型）
選擇客戶 → 過濾品牌清單（所屬品牌）
偵測 alliance → 自動啟用聯盟連動
```

### 3.3 建立報價單 — STEP 2

**檔案：** `_components/wizard/step2-product-items.tsx`

| 元件 | 路徑 | 說明 |
|------|------|------|
| STEP 2 | `step2-product-items.tsx` | 產品選品表單 |
| 級聯選品 | `_components/shared/cascading-selects.tsx` | Main_Code → Sub_Category → Attributes |
| 明細列表 | `_components/wizard/line-items-preview.tsx` | 已選品項預覽 |

**級聯選品邏輯：**
```
Main_Code (IAD/ISY/EXT/SVC/PKG)
    ↓
Sub_Category (依 Main_Code 映射)
    ↓
Physical_Attributes (裝置 > 計價 > 素材 > 版位 > 格式)
    ↓
自動帶入 Product_ID + display_name（隱藏技術 ID）
```

**品項欄位：**
- 走期起/訖（Date Picker）
- 預算（數字，千分位，無小數點）
- 自動計算：天數、單價、預訂曝光/點擊/觀看/CTR

---

## Phase 4: UI 層 — View Page + 投放條件

### 4.1 View Page 1

**檔案：** `src/app/(main)/dashboard/quotation/[id]/page.tsx`

| 區塊 | 元件 | 說明 |
|------|------|------|
| 表頭 | `_components/view/quotation-header.tsx` | 報價單號、日期、業務、總走期等 |
| 明細表格 | `_components/view/line-items-table.tsx` | 按 start_date 遞增排序 |
| 總計區塊 | `_components/view/quotation-summary.tsx` | 小計、稅額、總額 |
| 條款表尾 | `_components/view/terms-footer.tsx` | 甲方/乙方資訊、用印區 |
| 利潤監控 | `_components/view/profit-monitor.tsx` | 僅內部可見 |

**權限控制：**
- 利潤燈號：所有人可見
- 預估成本率：Admin/Finance 可見，Sales 隱藏
- 最終成交金額（SSOT）：業務不可見

### 4.2 View Page 2 — 投放條件

**元件：** `_components/view/targeting-section.tsx`

| 區塊 | 欄位 | 輸入類型 |
|------|------|----------|
| 投放條件 | media_cat | 多選下拉（19 項媒體類別） |
| 人口統計 | demo_age | 多選下拉（至少選兩階） |
| 人口統計 | demo_gender | 單選（M/F/ALL） |
| 人口統計 | geo_location | 多選下拉（5 區域） |
| 人口統計 | income | 多選下拉（高/中/低） |
| 人口統計 | family | 多選下拉 |
| 人口統計 | occupation | 多選下拉 |
| 人口統計 | interests | 多選下拉（支援 xls 匯入） |
| 線上線下足跡 | fp_site_type ~ fp_apps | 自由文字（有填寫參考） |
| 消費行為 | consumer_data | 自由文字 |
| 受眾互動 | interact_ad ~ audience_pkg | 自由文字 |
| CRM 會員 | crm_adid | 自由文字 |
| 內文比對 | context_keywords, brand_safety | 自由文字 |
| 其他需求 | third_party_audit, data_loop | 多選下拉 |

---

## Phase 5: UI 層 — 專案編輯器 + 財務管理

### 5.1 專案編輯器

**目錄：** `_components/project-editor/`

| 元件 | 說明 |
|------|------|
| `project-editor-dialog.tsx` | 彈窗容器 |
| `required-items.tsx` | 必選品項（預設勾選，不可取消） |
| `optional-items.tsx` | 選配品項（可加選） |
| `bonus-items.tsx` | 贈送品項（比例調整、上限校驗） |

**觸發條件：** STEP 2 選擇類別為「專案 (PKG)」時彈出

**校驗規則：**
- 門檻校驗：總額低於起報門檻 → 禁止帶回
- 贈送校驗：超過主檔贈送上限 → 禁止帶回

### 5.2 財務管理

**目錄：** `_components/financial/`

| 元件 | 說明 |
|------|------|
| `invoice-tracking.tsx` | 發票拆分追蹤表單 |
| `revision-log.tsx` | 修正紀錄表格 |
| `related-records.tsx` | 關聯財務單據（Invoice/Credit Note） |

**發票追蹤欄位：**
- 預計開立月份（必填，可分拆多筆）
- 預計開立金額（必填）
- 未開立金額（自動計算）
- 已開立金額（自動計算）

---

## Phase 6: 整合 — Lark 工單 + PDF + 簽核

### 6.1 Lark 工單整合

**API Router：** `src/server/routers/quotation/tickets.ts`

| 功能 | 說明 |
|------|------|
| Outbound | 呼叫 `Lark.Flow.CreateTicket` API 推送工單 |
| Inbound | 接收 Webhook 回寫工單狀態 |

**工單追蹤區元件：** `_components/tickets/ticket-tracker.tsx`

| 顯示欄位 | 說明 |
|----------|------|
| 工單編號 | Lark Ticket ID |
| 類型 | AM/PM/AS/DS/RD/MB |
| 狀態 | pending/accepted/processing/completed/rejected |
| 處理人 | 來自 Lark |
| 最後異動時間 | 同步時間 |

### 6.2 PDF 匯出

**工具：** 待選定 PDF 產生庫（建議 `@react-pdf/renderer`）

**匯出規則：**
- 合併 Page 1 + Page 2
- 未填寫項目不顯示
- Section 4 重複鎖定類型垂直合併
- 甲方媒體發稿章自動帶入數位章
- Page 3：特別注意事項

### 6.3 簽核流程

**整合 Lark Approval API：**

| 條件 | 簽核路徑 |
|------|----------|
| 組員啟動，< 50 萬 | John/Daniel/Ingrid → Bella 或 Gillian/Cola → Eric |
| 組員啟動，>= 50 萬 | (上述組長) → River Yang |
| 小組長啟動 | Bella/Eric → River Yang |

---

## 檔案產出清單

### 資料庫層（Phase 1）

```
src/db/quotation/
├── schema.ts                    # 6 張表 + relations + types
└── queries/
    ├── quotations.ts            # Quotation CRUD + status transitions
    ├── line-items.ts            # Line Item CRUD + recalculate
    ├── targeting.ts             # Targeting upsert
    ├── tickets.ts               # Ticket CRUD + Lark sync
    ├── invoices.ts              # Invoice plan CRUD
    └── revisions.ts             # Revision log CRUD
```

### API 層（Phase 2）

```
src/server/routers/quotation/
├── index.ts                     # quotationRouter 聚合
├── quotations.ts                # quotationsRouter
├── line-items.ts                # lineItemsRouter
├── targeting.ts                 # targetingRouter
├── tickets.ts                   # ticketsRouter
└── invoices.ts                  # invoicesRouter

src/app/(main)/dashboard/quotation/
└── schema.ts                    # 所有 Zod validation schemas
```

### UI 層（Phase 3-5）

```
src/app/(main)/dashboard/quotation/
├── page.tsx                     # 報價單列表
├── new/
│   └── page.tsx                 # 建立報價單 (Wizard)
├── [id]/
│   ├── page.tsx                 # View Page
│   └── edit/
│       └── page.tsx             # 編輯報價單
└── _components/
    ├── wizard/
    │   ├── wizard-container.tsx
    │   ├── step1-basic-info.tsx
    │   ├── step2-product-items.tsx
    │   └── line-items-preview.tsx
    ├── view/
    │   ├── quotation-header.tsx
    │   ├── line-items-table.tsx
    │   ├── quotation-summary.tsx
    │   ├── terms-footer.tsx
    │   ├── profit-monitor.tsx
    │   └── targeting-section.tsx
    ├── project-editor/
    │   ├── project-editor-dialog.tsx
    │   ├── required-items.tsx
    │   ├── optional-items.tsx
    │   └── bonus-items.tsx
    ├── tickets/
    │   ├── ticket-tracker.tsx
    │   └── create-ticket-dialog.tsx
    ├── financial/
    │   ├── invoice-tracking.tsx
    │   ├── revision-log.tsx
    │   └── related-records.tsx
    ├── forms/
    │   ├── quotation-form.tsx
    │   └── line-item-form.tsx
    ├── tables/
    │   └── quotations-table.tsx
    └── shared/
        ├── status-badge.tsx
        ├── profit-indicator.tsx
        └── cascading-selects.tsx
```

---

## 開發順序建議

```
Phase 1 (DB)
  ├── 1.1 Schema 定義
  ├── 1.2 Drizzle Client 更新
  ├── 1.3 Migration
  └── 1.4 Query Functions
        ├── quotations.ts (含 quotation_no 自動產生)
        ├── line-items.ts (含 recalculateTotals)
        ├── targeting.ts
        ├── tickets.ts
        ├── invoices.ts
        └── revisions.ts

Phase 2 (API)
  ├── 2.1 Quotation Schema (Zod)
  ├── 2.2 Quotations Router
  ├── 2.3 Line Items Router
  ├── 2.4 Targeting Router
  ├── 2.5 Tickets Router
  ├── 2.6 Invoices Router
  └── 2.7 Root Router 註冊

Phase 3 (UI - 列表 + Wizard)
  ├── 3.1 報價單列表頁 + 表格
  ├── 3.2 Status Badge + Profit Indicator
  ├── 3.3 Wizard 容器
  ├── 3.4 STEP 1 基本資料表單
  └── 3.5 STEP 2 產品選品 + 級聯邏輯

Phase 4 (UI - View Page)
  ├── 4.1 View Page 容器
  ├── 4.2 Header 區塊
  ├── 4.3 Line Items 表格
  ├── 4.4 Summary 區塊
  ├── 4.5 Terms & Footer
  ├── 4.6 Profit Monitor
  └── 4.7 Targeting Section (View Page 2)

Phase 5 (UI - 進階功能)
  ├── 5.1 專案編輯器 Dialog
  ├── 5.2 發票追蹤
  ├── 5.3 修正紀錄
  └── 5.4 關聯財務單據

Phase 6 (整合)
  ├── 6.1 Lark 工單 API 串接
  ├── 6.2 Lark Webhook 處理
  ├── 6.3 PDF 匯出功能
  └── 6.4 簽核流程整合
```

---

## 風險與注意事項

| 風險 | 說明 | 緩解措施 |
|------|------|----------|
| Lark API 限流 | 工單建立可能觸發 rate limit | 實作 retry + backoff |
| 報價單號衝突 | 同一天多筆報價單 | 使用 DB transaction + sequence |
| 聯盟 SSOT 同步 | 主模組與聯盟模組即時同步 | 使用 optimistic update + webhook |
| PDF 匯出效能 | 大量明細時產生慢 | 使用 stream + 分頁渲染 |
| 狀態鎖定 | 確認執行後禁止修改 | 後端嚴格校驗 + 前端 disable |

---

## 依賴關係

| 依賴模組 | 用途 |
|----------|------|
| CRM Module | Account (agency/client)、Brand 資料 |
| Product Module | 產品選品、定價 |
| User Module | 負責業務清單、權限判斷 |
| Lark API | 工單建立、狀態同步、簽核流程 |
