# CRM Feature - 標準開發範例

> 本文件基於 `docs/prd/CRM.md` 規格，說明 CRM Feature 的標準開發模式與實作要点。

---

## 1. 專案架構總覽

```
src/
├── db/                              # 資料庫層
│   ├── index.ts                     # Drizzle client (pg Pool)
│   ├── schema.ts                    # 所有 Table Schema
│   └── crm/
│       ├── queries/
│       │   ├── groups.ts           # Group CRUD
│       │   ├── accounts.ts         # Account CRUD
│       │   ├── brands.ts           # Brand CRUD
│       │   ├── contacts.ts         # Contact CRUD
│       │   └── interactions.ts     # Interaction CRUD
│       └── schema.ts               # CRM Schema Definitions
├── server/
│   ├── trpc.ts                     # tRPC 初始化
│   └── routers/
│       ├── index.ts                 # Root router
│       └── crm/
│           ├── index.ts            # CRM Router (aggregator)
│           ├── groups.ts           # Group API
│           ├── accounts.ts         # Account API
│           ├── brands.ts           # Brand API
│           ├── contacts.ts         # Contact API
│           └── interactions.ts     # Interaction API
├── app/
│   └── (main)/dashboard/crm/      # Feature Route (Colocation)
│       ├── page.tsx                # CRM 頁面入口
│       └── _components/
│           ├── tabs/               # Tab 式頁面組織
│           │   ├── groups-tab.tsx
│           │   ├── accounts-tab.tsx
│           │   ├── brands-tab.tsx
│           │   ├── contacts-tab.tsx
│           │   └── interactions-tab.tsx
│           ├── forms/               # 表单组件
│           │   ├── account-form.tsx
│           │   ├── brand-form.tsx
│           │   └── contact-form.tsx
│           ├── tables/              # 表格组件
│           │   ├── accounts-table.tsx
│           │   └── contacts-table.tsx
│           └── shared/             # 共享组件
│               ├── cascading-select.tsx
│               └── industry-category-select.tsx
└── lib/
    └── trpc.ts                     # Client-side tRPC hooks
```

### 核心設計原則

| 原則 | 說明 |
|------|------|
| **Colocation First** | Feature 相關檔案放在同一個目錄 |
| **`_` 前綴** | `_components/`, `_hooks/` 表示私有（不是 route） |
| **Modular Router** | CRM 底下依據 Entity 拆分 sub-router |
| **Cascading Logic** | Account → Brand → Contact 級聯關係 |

---

## 2. Database Layer

### 2.1 Drizzle Schema (`src/db/crm/schema.ts`)

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ Enums ============
export const accountTypeEnum = ['agency', 'client'] as const;
export const agencyTierEnum = ['tier1', 'tier2', 'tier3'] as const;
export const paymentTermEnum = ['net30', 'net60', 'net90', 'within30', 'within45', 'prepaid'] as const;
export const allianceEnum = ['apex', 'omnet'] as const;
export const contactStatusEnum = ['active', 'inactive'] as const;
export const contactLevelEnum = ['decision_maker', 'influencer', 'executor'] as const;
export const assignmentRoleEnum = ['primary', 'daily', 'finance'] as const;
export const interactionTypeEnum = ['meeting', 'call', 'email', 'message', 'event', 'sales_progress'] as const;

// ============ Tables ============
export const groups = pgTable('crm_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupName: text('group_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('crm_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountName: text('account_name').notNull(),
  shortName: text('short_name').notNull(),
  taxId: text('tax_id'),
  personalId: text('personal_id'),
  address: text('address').notNull(),
  groupId: uuid('group_id').references(() => groups.id),
  accountType: text('account_type', { enum: accountTypeEnum }).notNull(),
  agencyTier: text('agency_tier', { enum: agencyTierEnum }),
  contractUrl: text('contract_url'),
  accountOwner: uuid('account_owner'),
  primaryContactId: uuid('primary_contact_id'),
  customerPreference: text('customer_preference'),
  internalPolitics: text('internal_politics'),
  paymentTerm: text('payment_term', { enum: paymentTermEnum }).notNull(),
  alliance: text('alliance', { enum: allianceEnum }),
  isBlacklist: boolean('is_blacklist').default(false),
  status: text('status', { enum: ['active', 'inactive'] }).default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const brands = pgTable('crm_brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandName: text('brand_name').notNull(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  industryCategory: text('industry_category').notNull(),
  mediaRequirement: text('media_requirement').array(),
  deliveryNotes: text('delivery_notes'),
  cooperationNotes: text('cooperation_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contacts = pgTable('crm_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  name: text('name').notNull(),
  englishName: text('english_name'),
  title: text('title'),
  department: text('department'),
  tel: text('tel'),
  mobile: text('mobile'),
  email: text('email'),
  status: text('status', { enum: contactStatusEnum }).notNull().default('active'),
  level: text('level', { enum: contactLevelEnum }).array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contactBrandAssignments = pgTable('crm_contact_brand_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id).notNull(),
  brandId: uuid('brand_id').references(() => brands.id).notNull(),
  assignmentRole: text('assignment_role', { enum: assignmentRoleEnum }).notNull(),
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date'),
});

export const agencyBrandAssignments = pgTable('crm_agency_brand_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyAccountId: uuid('agency_account_id').references(() => accounts.id).notNull(),
  clientBrandId: uuid('client_brand_id').references(() => brands.id).notNull(),
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date'),
});

export const interactions = pgTable('crm_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  brandId: uuid('brand_id').references(() => brands.id),
  contactIds: uuid('contact_id').array(),
  quotationId: uuid('quotation_id'),
  interactionType: text('interaction_type', { enum: interactionTypeEnum }).notNull(),
  note: text('note'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedBy: uuid('updated_by'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ Relations ============
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

// ============ Types ============
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
```

### Schema 設計要點

| 項目 | 語法 | 說明 |
|------|------|------|
| ENUM 欄位 | `text('field', { enum: [...] })` | 使用 Drizzle ENUM |
| 陣列欄位 | `text('field').array()` | PostgreSQL ARRAY |
| 外鍵關聯 | `.references(() => table.id)` | 關聯約束 |
|Relations | `relations(table, ({ one, many }) => {...})` | 宣告關聯 |

---

## 3. API Layer (tRPC)

### 3.1 Router 結構 (`src/server/routers/crm/`)

```
crm/index.ts      - 聚合所有 CRM sub-routers
crm/groups.ts     - Group CRUD
crm/accounts.ts   - Account CRUD + cascading
crm/brands.ts     - Brand CRUD + filtering
crm/contacts.ts   - Contact CRUD + assignments
crm/interactions.ts - Interaction CRUD
```

### 3.2 Account Router (`src/server/routers/crm/accounts.ts`)

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import * as queries from '@/db/crm/queries/accounts';

export const accountsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        accountType: z.enum(['agency', 'client']).optional(),
        agencyTier: z.enum(['tier1', 'tier2', 'tier3']).optional(),
        groupId: z.string().uuid().optional(),
        status: z.enum(['active', 'inactive']).optional(),
      })
    )
    .query(async ({ input }) => {
      return queries.getAccounts(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const account = await queries.getAccountById(input.id);
      if (!account) throw new Error('Account not found');
      return account;
    }),

  create: publicProcedure
    .input(
      z.object({
        accountName: z.string().min(1),
        shortName: z.string().min(1),
        taxId: z.string().optional(),
        personalId: z.string().optional(),
        address: z.string().min(1),
        groupId: z.string().uuid().optional(),
        accountType: z.enum(['agency', 'client']),
        agencyTier: z.enum(['tier1', 'tier2', 'tier3']).optional(),
        paymentTerm: z.enum(['net30', 'net60', 'net90', 'within30', 'within45', 'prepaid']),
        accountOwner: z.string().uuid().optional(),
        customerPreference: z.string().optional(),
        internalPolitics: z.string().optional(),
        alliance: z.enum(['apex', 'omnet']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.createAccount(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          accountName: z.string().min(1).optional(),
          shortName: z.string().min(1).optional(),
          taxId: z.string().optional(),
          personalId: z.string().optional(),
          address: z.string().min(1).optional(),
          groupId: z.string().uuid().optional().nullable(),
          accountType: z.enum(['agency', 'client']).optional(),
          agencyTier: z.enum(['tier1', 'tier2', 'tier3']).optional().nullable(),
          paymentTerm: z.enum(['net30', 'net60', 'net90', 'within30', 'within45', 'prepaid']).optional(),
          accountOwner: z.string().uuid().optional().nullable(),
          customerPreference: z.string().optional(),
          internalPolitics: z.string().optional(),
          alliance: z.enum(['apex', 'omnet']).optional().nullable(),
          status: z.enum(['active', 'inactive']).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return queries.updateAccount(input.id, input.data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return queries.deleteAccount(input.id);
    }),

  getBrandsByAccount: publicProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .query(async ({ input }) => {
      return queries.getBrandsByAccountId(input.accountId);
    }),

  getContactsByAccount: publicProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .query(async ({ input }) => {
      return queries.getContactsByAccountId(input.accountId);
    }),
});
```

### 3.3 Interaction Router (`src/server/routers/crm/interactions.ts`)

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import * as queries from '@/db/crm/queries/interactions';

export const interactionsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        accountId: z.string().uuid().optional(),
        brandId: z.string().uuid().optional(),
        contactId: z.string().uuid().optional(),
        interactionType: z.enum(['meeting', 'call', 'email', 'message', 'event', 'sales_progress']).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
    )
    .query(async ({ input }) => {
      return queries.getInteractions(input);
    }),

  create: publicProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        brandId: z.string().uuid().optional(),
        contactIds: z.string().uuid().array().optional(),
        quotationId: z.string().uuid().optional(),
        interactionType: z.enum(['meeting', 'call', 'email', 'message', 'event', 'sales_progress']),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.createInteraction(input);
    }),
});
```

---

## 4. UI Layer

### 4.1 CRM 主頁面 (`src/app/(main)/dashboard/crm/page.tsx`)

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupsTab } from './_components/tabs/groups-tab';
import { AccountsTab } from './_components/tabs/accounts-tab';
import { BrandsTab } from './_components/tabs/brands-tab';
import { ContactsTab } from './_components/tabs/contacts-tab';
import { InteractionsTab } from './_components/tabs/interactions-tab';

export default function CrmPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl">CRM</h1>
        <p className="text-muted-foreground">客戶關係管理系統</p>
      </div>
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList>
          <TabsTrigger value="accounts">客戶</TabsTrigger>
          <TabsTrigger value="brands">品牌</TabsTrigger>
          <TabsTrigger value="contacts">聯絡人</TabsTrigger>
          <TabsTrigger value="groups">集團</TabsTrigger>
          <TabsTrigger value="interactions">互動紀錄</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts"><AccountsTab /></TabsContent>
        <TabsContent value="brands"><BrandsTab /></TabsContent>
        <TabsContent value="contacts"><ContactsTab /></TabsContent>
        <TabsContent value="groups"><GroupsTab /></TabsContent>
        <TabsContent value="interactions"><InteractionsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
```

### 4.2 Cascading Select (`src/app/(main)/dashboard/crm/_components/shared/cascading-select.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

interface CascadingSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  level: 'account' | 'brand' | 'contact';
  parentId?: string;
  placeholder?: string;
}

export function CascadingSelect({
  value,
  onValueChange,
  level,
  parentId,
  placeholder = '請選擇',
}: CascadingSelectProps) {
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);

  const { data: accounts } = trpc.crm.accounts.list.useQuery({ pageSize: 100 });
  const { data: brands } = trpc.crm.accounts.getBrandsByAccount.useQuery(
    { accountId: parentId! },
    { enabled: !!parentId }
  );
  const { data: contacts } = trpc.crm.accounts.getContactsByAccount.useQuery(
    { accountId: parentId! },
    { enabled: !!parentId }
  );

  useEffect(() => {
    if (level === 'account') {
      setOptions(accounts?.data.map((a) => ({ id: a.id, label: a.accountName })) || []);
    } else if (level === 'brand' && brands) {
      setOptions(brands.map((b) => ({ id: b.id, label: b.brandName })));
    } else if (level === 'contact' && contacts) {
      setOptions(contacts.map((c) => ({ id: c.id, label: c.name })));
    }
  }, [level, accounts, brands, contacts]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## 5. 關鍵技術要點

### 5.1 Cascading（級聯）邏輯

```
Account 選擇 → 過濾 Brand 列表 → 過濾 Contact 列表
```

| 欄位 | 級聯行為 |
|------|----------|
| Account | Brand/Contact 的上層，選擇後過濾子項 |
| Brand | 根據 Account 過濾 |
| Contact | 根據 Account 過濾 |
| Interaction.AccountId | 選擇後過濾 Brand、Contact |
| Interaction.BrandId | 級聯過濾：僅顯示所屬 Account 的 Brand |

### 5.2 ENUM 對照表

| 用途 | Schema 值 | 顯示值 |
|------|-----------|--------|
| Account Type | `agency` | Agency 代理商 |
| Account Type | `client` | Client 客戶 |
| Agency Tier | `tier1/tier2/tier3` | Tier 1/2/3 |
| Payment Term | `net30/net60/net90` | 月結 30/60/90 日 |
| Payment Term | `within30/within45` | 30/45 日內 |
| Payment Term | `prepaid` | 預收 |
| Contact Status | `active/inactive` | 在職/離職 |
| Contact Level | `decision_maker/influencer/executor` | 決策者/影響者/執行者 |
| Interaction Type | `meeting/call/email/message/event/sales_progress` | 會議/電話/Email/訊息/事件/銷售進度 |

### 5.3 Audit Log（聯盟欄位）

`Account.alliance` 欄位需要保留變動歷史軌跡：

```typescript
// 查詢時需要返回歷史
export async function getAccountWithAllianceHistory(id: string) {
  const account = await db.select().from(accounts).where(eq(accounts.id, id));
  const history = await db.select().from(allianceAuditLogs).where(eq(allianceAuditLogs.accountId, id));
  return { ...account, allianceHistory: history };
}
```

---

## 6. Feature 開發檢查清單

- [ ] 在 `src/db/crm/schema.ts` 定義 table
- [ ] 在 `src/db/crm/queries/` 實作 CRUD queries
- [ ] 在 `src/server/routers/crm/` 實作 tRPC router
- [ ] 在 `src/app/(main)/dashboard/crm/_components/` 實作 UI
- [ ] 實作 Cascading Select 邏輯
- [ ] 實作 ENUM 對照顯示
- [ ] 處理級聯刪除（Account 刪除時一併處理相關資料）
- [ ] 新增 Sidebar 導航項目
- [ ] 新增 Search Dialog 項目
- [ ] 更新 `todo-feature.md` 作為文件範本

---

## 7. 環境變數

```bash
# 現有設定即可，CRM 使用同一個 DATABASE_URL
DATABASE_URL=postgresql://...
```
