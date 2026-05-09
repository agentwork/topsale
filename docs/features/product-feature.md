# Product Feature - 標準開發範例

> 本文件基於 `docs/prd/product.md` 規格，說明 Product Catalog Feature 的標準開發模式與實作要点。

---

## 1. 專案架構總覽

```
src/
├── db/                              # 資料庫層
│   ├── index.ts                     # Drizzle client (pg Pool)
│   ├── schema.ts                    # 所有 Table Schema
│   └── product/
│       ├── queries/
│       │   ├── products.ts         # Product CRUD
│       │   └── categories.ts       # Category CRUD
│       └── schema.ts               # Product Schema Definitions
├── server/
│   ├── trpc.ts                     # tRPC 初始化
│   └── routers/
│       ├── index.ts                 # Root router
│       └── product/
│           ├── index.ts            # Product Router (aggregator)
│           ├── products.ts         # Product API
│           └── categories.ts       # Category API
├── app/
│   └── (main)/dashboard/product/   # Feature Route (Colocation)
│       ├── page.tsx                 # Product 頁面入口
│       └── _components/
│           ├── tabs/               # Tab 式頁面組織
│           │   ├── ads-tab.tsx     # 廣告產品 (IAD/EXT/PCN)
│           │   ├── services-tab.tsx # 服務產品 (SVC)
│           │   ├── packages-tab.tsx # 專案產品 (PKG)
│           │   └── all-tab.tsx     # 全部產品
│           ├── forms/              # 表單组件
│           │   ├── product-form.tsx
│           │   └── clone-form.tsx
│           ├── tables/             # 表格组件
│           │   └── products-table.tsx
│           └── shared/             # 共享组件
│               ├── status-badge.tsx
│               └── price-display.tsx
└── lib/
    └── trpc.ts                     # Client-side tRPC hooks
```

### 核心設計原則

| 原則 | 說明 |
|------|------|
| **Colocation First** | Feature 相關檔案放在同一個目錄 |
| **`_` 前綴** | `_components/`, `_hooks/` 表示私有（不是 route） |
| **扁平主表** | 所有產品品項使用同一張表，透過 Main_Code 區分類型 |
| **擴充欄位** | 不同類型產品有各自的擴充屬性 JSON |

---

## 2. Database Layer

### 2.1 Drizzle Schema (`src/db/product/schema.ts`)

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============ Enums ============
export const mainCodeEnum = ['IAD', 'ISY', 'EXT', 'SVC', 'PKG'] as const;
export const productStatusEnum = ['draft', 'published', 'inactive'] as const;
export const pricingUnitEnum = ['CPM', 'CPC', 'CPV', '案', '篇', '人', '每一尺寸', '小時', '式'] as const;

// ============ Common Attributes ============
export const products = pgTable('product_catalog', {
  id: uuid('id').primaryKey().defaultRandom(),
  productCode: text('product_code').unique(), // 新制結構化 ID
  ragicId: text('ragic_id'),                   // 舊系統編號對照
  mainCode: text('main_code', { enum: mainCodeEnum }).notNull(), // IAD/ISY/EXT/SVC/PKG
  subCategory: text('sub_category').notNull(), // PMP, PCN, Google, 口碑, 設計, 專案名稱
  productName: text('product_name').notNull(),
  productNameEn: text('product_name_en'),
  description: text('description'),
  pricingUnit: text('pricing_unit', { enum: pricingUnitEnum }).notNull(),
  unitPrice: integer('unit_price').notNull(), // 銷售基數金額
  priority: integer('priority').default(0),   // Ratecard 排序
  startDate: date('start_date'),              // 生效日
  endDate: date('end_date'),                  // 失效日
  status: text('status', { enum: productStatusEnum }).default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
});

// ============ Ad-specific Extension (IAD/EXT/PCN) ============
export const adExtensions = pgTable('product_ad_extensions', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull().unique(),
  // 規格
  device: text('device'),              // 裝置
  placement: text('placement'),        // 版位
  format: text('format'),             // 格式
  size: text('size'),                  // 尺寸
  creativeFormat: text('creative_format'), // 素材形式: Banner, Video, Banner+Video
  // 成效
  ctrMin: integer('ctr_min'),           // CTR 預估最小值
  ctrMax: integer('ctr_max'),           // CTR 預估最大值
  erMin: integer('er_min'),             // ER 預估最小值
  erMax: integer('er_max'),             // ER 預估最大值
  vtrMin: integer('vtr_min'),           // VTR 預估最小值
  vtrMax: integer('vtr_max'),           // VTR 預估最大值
  // PMP 專屬
  pmpFeatures: jsonb('pmp_features'),   // 功能開關: Leading, Map, Weather, Stock, Count Down
  leadingCtrMin: integer('leading_ctr_min'),
  leadingCtrMax: integer('leading_ctr_max'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ Package-specific Extension (PKG) ============
export const packageExtensions = pgTable('product_package_extensions', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull().unique(),
  trafficBonus: text('traffic_bonus'),  // 流量贈送
  creativeBonus: text('creative_bonus'), // 素材贈送
  threshold: integer('threshold'),      // 起報金額限制
  constraints: text('constraints'),      // 限制條件
  composition: jsonb('composition'),    // 適用組合
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ Service-specific Extension (SVC) ============
export const serviceExtensions = pgTable('product_service_extensions', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull().unique(),
  contentDescription: text('content_description'), // 內容說明
  notes: text('notes'),                // 商品備註
  revisionLimit: integer('revision_limit'), // 修改次數上限
  deliveryTime: text('delivery_time'), // 交付時間
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============ Product History (Audit Trail) ============
export const productHistory = pgTable('product_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  changedField: text('changed_field').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changedBy: text('changed_by').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

// ============ Relations ============
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
```

### 2.2 Query Functions (`src/db/product/queries/products.ts`)

```typescript
import { db } from '@/db';
import { products, productHistory, adExtensions, packageExtensions, serviceExtensions } from '../schema';
import { eq, desc, and, gte, lte, or, like, inArray } from 'drizzle-orm';

// ============ Product CRUD ============
export async function createProduct(data: {
  productCode?: string;
  ragicId?: string;
  mainCode: string;
  subCategory: string;
  productName: string;
  productNameEn?: string;
  description?: string;
  pricingUnit: string;
  unitPrice: number;
  priority?: number;
  startDate?: Date;
  endDate?: Date;
  status?: 'draft' | 'published' | 'inactive';
}) {
  return db.insert(products).values(data).returning();
}

export async function getProductById(id: string) {
  return db.select().from(products).where(eq(products.id, id)).limit(1);
}

export async function getProductByCode(productCode: string) {
  return db.select().from(products).where(eq(products.productCode, productCode)).limit(1);
}

export async function listProducts(filters: {
  mainCode?: string;
  subCategory?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { mainCode, subCategory, status, search, page = 1, pageSize = 20 } = filters;
  const conditions = [];

  if (mainCode) conditions.push(eq(products.mainCode, mainCode));
  if (subCategory) conditions.push(eq(products.subCategory, subCategory));
  if (status) conditions.push(eq(products.status, status as any));
  if (search) {
    conditions.push(
      or(
        like(products.productName, `%${search}%`),
        like(products.productCode, `%${search}%`),
        like(products.subCategory, `%${search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * pageSize;

  const [data, countResult] = await Promise.all([
    db.select().from(products).where(where).orderBy(desc(products.priority), desc(products.updatedAt)).limit(pageSize).offset(offset),
    db.select({ count: products.id }).from(products).where(where),
  ]);

  return {
    data,
    total: countResult.length,
    page,
    pageSize,
  };
}

export async function getActiveProducts() {
  const now = new Date();
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'published'),
        or(gte(products.endDate, now), eq(products.endDate, null))
      )
    )
    .orderBy(products.priority);
}

export async function updateProduct(id: string, data: Partial<{
  productName: string;
  productNameEn: string;
  description: string;
  pricingUnit: string;
  unitPrice: number;
  priority: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'published' | 'inactive';
}>) {
  return db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
}

export async function deleteProduct(id: string) {
  return db.delete(products).where(eq(products.id, id)).returning();
}

// ============ Clone Product ============
export async function cloneProduct(id: string, newProductCode: string, clonedBy: string) {
  const original = await getProductById(id);
  if (!original || original.length === 0) throw new Error('Product not found');

  const source = original[0];
  const [newProduct] = await createProduct({
    productCode: newProductCode,
    ragicId: undefined,
    mainCode: source.mainCode,
    subCategory: source.subCategory,
    productName: source.productName,
    productNameEn: source.productNameEn,
    description: source.description,
    pricingUnit: source.pricingUnit,
    unitPrice: source.unitPrice,
    priority: source.priority,
    status: 'draft',
  });

  await createProductHistory({
    productId: newProduct.id,
    changedField: 'cloned_from',
    oldValue: id,
    newValue: newProductCode,
    changedBy: clonedBy,
  });

  return newProduct;
}

// ============ Status Transitions ============
export async function publishProduct(id: string, publishedBy: string) {
  const [updated] = await db
    .update(products)
    .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  await createProductHistory({
    productId: id,
    changedField: 'status',
    oldValue: 'draft',
    newValue: 'published',
    changedBy: publishedBy,
  });

  return updated;
}

export async function deactivateProduct(id: string, deactivatedBy: string) {
  const product = await getProductById(id);
  if (!product || product.length === 0) throw new Error('Product not found');

  const [updated] = await db
    .update(products)
    .set({ status: 'inactive', updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  await createProductHistory({
    productId: id,
    changedField: 'status',
    oldValue: product[0].status,
    newValue: 'inactive',
    changedBy: deactivatedBy,
  });

  return updated;
}

// ============ History ============
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

// ============ Ad Extensions ============
export async function createAdExtension(data: {
  productId: string;
  device?: string;
  placement?: string;
  format?: string;
  size?: string;
  creativeFormat?: string;
  ctrMin?: number;
  ctrMax?: number;
  erMin?: number;
  erMax?: number;
  vtrMin?: number;
  vtrMax?: number;
  pmpFeatures?: object;
  leadingCtrMin?: number;
  leadingCtrMax?: number;
}) {
  return db.insert(adExtensions).values(data).returning();
}

export async function getAdExtension(productId: string) {
  return db.select().from(adExtensions).where(eq(adExtensions.productId, productId)).limit(1);
}

export async function updateAdExtension(productId: string, data: Partial<{
  device: string;
  placement: string;
  format: string;
  size: string;
  creativeFormat: string;
  ctrMin: number;
  ctrMax: number;
  erMin: number;
  erMax: number;
  vtrMin: number;
  vtrMax: number;
  pmpFeatures: object;
  leadingCtrMin: number;
  leadingCtrMax: number;
}>) {
  return db.update(adExtensions).set({ ...data, updatedAt: new Date() }).where(eq(adExtensions.productId, productId)).returning();
}
```

---

## 3. API Layer (tRPC)

### 3.1 Router (`src/server/routers/product/products.ts`)

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import * as queries from '@/db/product/queries/products';
import { mainCodeEnum, productStatusEnum, pricingUnitEnum } from '@/db/product/schema';

const productCreateSchema = z.object({
  productCode: z.string().optional(),
  ragicId: z.string().optional(),
  mainCode: z.enum(mainCodeEnum),
  subCategory: z.string().min(1),
  productName: z.string().min(1),
  productNameEn: z.string().optional(),
  description: z.string().optional(),
  pricingUnit: z.enum(pricingUnitEnum),
  unitPrice: z.number().int().min(0),
  priority: z.number().int().default(0),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const productUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    productName: z.string().min(1).optional(),
    productNameEn: z.string().optional(),
    description: z.string().optional(),
    pricingUnit: z.enum(pricingUnitEnum).optional(),
    unitPrice: z.number().int().min(0).optional(),
    priority: z.number().int().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    status: z.enum(productStatusEnum).optional(),
  }),
});

const productFilterSchema = z.object({
  mainCode: z.enum(mainCodeEnum).optional(),
  subCategory: z.string().optional(),
  status: z.enum(productStatusEnum).optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export const productRouter = router({
  create: publicProcedure
    .input(productCreateSchema)
    .mutation(async ({ input }) => {
      return queries.createProduct(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await queries.getProductById(input.id);
      return result[0] || null;
    }),

  getByCode: publicProcedure
    .input(z.object({ productCode: z.string() }))
    .query(async ({ input }) => {
      const result = await queries.getProductByCode(input.productCode);
      return result[0] || null;
    }),

  list: publicProcedure
    .input(productFilterSchema)
    .query(async ({ input }) => {
      return queries.listProducts(input);
    }),

  getActive: publicProcedure
    .query(async () => {
      return queries.getActiveProducts();
    }),

  update: publicProcedure
    .input(productUpdateSchema)
    .mutation(async ({ input }) => {
      return queries.updateProduct(input.id, input.data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return queries.deleteProduct(input.id);
    }),

  clone: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      newProductCode: z.string(),
      clonedBy: z.string(),
    }))
    .mutation(async ({ input }) => {
      return queries.cloneProduct(input.id, input.newProductCode, input.clonedBy);
    }),

  publish: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      publishedBy: z.string(),
    }))
    .mutation(async ({ input }) => {
      return queries.publishProduct(input.id, input.publishedBy);
    }),

  deactivate: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      deactivatedBy: z.string(),
    }))
    .mutation(async ({ input }) => {
      return queries.deactivateProduct(input.id, input.deactivatedBy);
    }),

  getHistory: publicProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ input }) => {
      return queries.getProductHistory(input.productId);
    }),
});
```

### 3.2 Router Index (`src/server/routers/product/index.ts`)

```typescript
import { router } from '../../trpc';
import { productRouter } from './products';

export const productRouter = router({
  products: productRouter,
});
```

---

## 4. UI Layer

### 4.1 Main Page (`src/app/(main)/dashboard/product/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AllTab } from './_components/tabs/all-tab';
import { AdsTab } from './_components/tabs/ads-tab';
import { ServicesTab } from './_components/tabs/services-tab';
import { PackagesTab } from './_components/tabs/packages-tab';

const tabOptions = [
  { value: 'all', label: '全部' },
  { value: 'iad', label: '自營廣告 (IAD)' },
  { value: 'ext', label: '外媒 (EXT)' },
  { value: 'svc', label: '服務 (SVC)' },
  { value: 'pkg', label: '專案 (PKG)' },
] as const;

export default function ProductPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'all');

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">產品中心</h1>
          <p className="text-muted-foreground">Product Catalog Management</p>
        </div>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">產品中心</span>
        </nav>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          {tabOptions.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all"><AllTab /></TabsContent>
        <TabsContent value="iad"><AdsTab mainCode="IAD" /></TabsContent>
        <TabsContent value="ext"><AdsTab mainCode="EXT" /></TabsContent>
        <TabsContent value="svc"><ServicesTab /></TabsContent>
        <TabsContent value="pkg"><PackagesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
```

### 4.2 Products Table (`src/app/(main)/dashboard/product/_components/tables/products-table.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Trash2, Copy, Eye, Send, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { trpc } from '@/lib/trpc';

interface ProductsTableProps {
  filters?: {
    mainCode?: string;
    status?: string;
    search?: string;
  };
}

export function ProductsTable({ filters }: ProductsTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = trpc.product.products.list.useQuery({
    mainCode: filters?.mainCode as 'IAD' | 'ISY' | 'EXT' | 'SVC' | 'PKG' | undefined,
    status: (statusFilter || filters?.status) as 'draft' | 'published' | 'inactive' | undefined,
    search: search || undefined,
    page,
    pageSize,
  });

  const utils = trpc.useUtils();
  const publishMutation = trpc.product.products.publish.useMutation({
    onSuccess: () => {
      toast.success('產品已發佈');
      utils.product.products.list.invalidate();
    },
    onError: (error) => toast.error(`發佈失敗：${error.message}`),
  });
  const deactivateMutation = trpc.product.products.deactivate.useMutation({
    onSuccess: () => {
      toast.success('產品已下架');
      utils.product.products.list.invalidate();
    },
    onError: (error) => toast.error(`下架失敗：${error.message}`),
  });

  return (
    <div className="space-y-4">
      {/* 搜尋與篩選工具列 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜尋產品名稱或編號..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="狀態篩選" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="published">已發佈</SelectItem>
              <SelectItem value="inactive">已下架</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => router.push('/dashboard/product/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新增
          </Button>
        </div>
      </div>

      {/* 空狀態引導 */}
      {!isLoading && !data?.data.length && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">找不到產品</p>
          <p className="text-sm text-muted-foreground">嘗試調整搜尋條件或建立新產品</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/product/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新增產品
          </Button>
        </div>
      )}

      {/* 資料表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">產品編號</TableHead>
              <TableHead>產品名稱</TableHead>
              <TableHead className="w-[100px]">類型</TableHead>
              <TableHead className="w-[100px]">子類別</TableHead>
              <TableHead className="w-[120px]">單價</TableHead>
              <TableHead className="w-[80px]">狀態</TableHead>
              <TableHead className="w-[150px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.map((product) => (
              <TableRow
                key={product.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/product/${product.id}`)}
              >
                <TableCell className="font-mono text-xs">{product.productCode || '-'}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.productName}</p>
                    {product.productNameEn && (
                      <p className="text-xs text-muted-foreground">{product.productNameEn}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{mainCodeLabels[product.mainCode]}</Badge></TableCell>
                <TableCell className="text-xs">{product.subCategory}</TableCell>
                <TableCell>${product.unitPrice.toLocaleString()}/{pricingUnitLabels[product.pricingUnit]}</TableCell>
                <TableCell>
                  <Badge variant={statusLabels[product.status].variant}>
                    {statusLabels[product.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    {/* 檢視/編輯/複製/發佈/下架按鈕 + Tooltip */}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分頁 */}
      {data && data.total > pageSize && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            上一頁
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} 頁，共 {Math.ceil(data.total / pageSize)} 頁
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= data.total}>
            下一頁
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## 5. 開發檢查清單

### Database
- [ ] 建立 `src/db/product/schema.ts` 包含所有 Enum 和 Table 定義
- [ ] 建立 `src/db/product/queries/products.ts` 包含所有 CRUD + 特殊操作
- [ ] 執行 `pnpm drizzle-kit push` 同步 schema 到資料庫
- [ ] 確認 Cascade Delete 設定正確

### API (tRPC)
- [ ] 建立 `src/server/routers/product/products.ts` Router
- [ ] 實作 Zod Validation Schema
- [ ] 實作所有 Procedure (CRUD + Clone + Publish + Deactivate)
- [ ] 執行 `pnpm tsc --noEmit` 確認無型別錯誤

### UI Components
- [ ] 建立 Tab 架構 (All/Ads/Services/Packages)
- [ ] 建立 ProductsTable component
- [ ] 建立 ProductForm component
- [ ] 建立 CloneForm component
- [ ] 建立 StatusBadge component
- [ ] 串接 tRPC hooks

### Navigation
- [ ] 在 sidebar 新增 Product 連結
- [ ] 在 search-dialog 新增 Product 搜尋

### Testing
- [ ] 手動測試 Create Product
- [ ] 手動測試 Clone Product
- [ ] 手動測試 Status Transition (Draft → Published → Inactive)
- [ ] 手動測試 Filter 和 Search
- [ ] 執行 `pnpm lint` 無錯誤

---

## 6. 生命週期狀態圖

```
┌─────────┐    Submit     ┌───────────┐   Publish   ┌───────────┐
│  Draft  │ ───────────▶  │ Under Review │ ─────────▶  │ Published │
└─────────┘               └───────────┘              └───────────┘
     ▲                         │
     │                         │ Reject
     │                         ▼
     └─────────────────────────────────┘

┌───────────┐   Deactivate   ┌───────────┐
│ Published │ ─────────────▶ │ Inactive  │
└───────────┘                └───────────┘
```

---

## 7. 擴充屬性說明

### Ad Extensions (IAD/EXT/PCN)

| 欄位 | 說明 |
|------|------|
| device | 裝置 (Web, Mobile, App) |
| placement | 版位 |
| format | 格式 (Display, Video, Native) |
| size | 尺寸 (300x250, 728x90, etc.) |
| creativeFormat | 素材形式 (Banner, Video, Banner+Video) |
| ctrMin/ctrMax | CTR 預估範圍 |
| erMin/erMax | ER 預估範圍 |
| vtrMin/vtrMax | VTR 預估範圍 |
| pmpFeatures | PMP 專屬功能開關 (JSON) |
| leadingCtrMin/leadingCtrMax | Leading CTR 範圍 |

### Package Extensions (PKG)

| 欄位 | 說明 |
|------|------|
| trafficBonus | 流量贈送額度 |
| creativeBonus | 素材贈送內容 |
| threshold | 起報金額限制 |
| constraints | 執行限制條款 |
| composition | 適用產品組合 (JSON) |

### Service Extensions (SVC)

| 欄位 | 說明 |
|------|------|
| contentDescription | 詳細內容說明 |
| revisionLimit | 修改次數上限 |
| deliveryTime | 交付時間 |
| notes | 特殊備註 |

---

## 8. Ratecard 前台需求

**僅顯示「已發佈」且「未失效」品項**

```typescript
// Filter for Ratecard
const activeProducts = products.filter(p =>
  p.status === 'published' &&
  (p.endDate === null || p.endDate >= new Date())
);
```

**支援欄位**：
- 即時過濾（類別、裝置、版位）
- 搜尋建議
- Priority 排序

---

## 9. UI/UX 改進記錄 (2026-04-18)

### 表單驗證優化
- 使用 React Hook Form + Zod 進行表單驗證
- 必填欄位顯示紅色星號標記
- 即時驗證回饋（onBlur 模式）
- Toast 通知（成功/失敗）

### 列表頁優化
- 搜尋框增加搜尋圖示和提示
- 狀態篩選下拉選單
- 列表點擊整列可進入詳情
- 操作按鈕增加 Tooltip 說明
- 空狀態顯示引導建立新產品
- 載入中顯示 Loading 動畫

### 詳情頁優化
- 麵包屑導航
- 操作按鈕改用 DropdownMenu 收納
- 狀態切換增加即時 Toast 通知
- 錯誤狀態增加友善提示

### 主頁面優化
- 麵包屑導航
- Tab 標題更直觀

### 快捷操作
| 動作 | 位置 | 說明 |
|------|------|------|
| 查看詳情 | 列表/詳情頁 | 點擊列表或詳情按鈕 |
| 編輯 | 詳情頁 | 編輯按鈕或快捷鍵 |
| 複製 | 列表頁 | 複製按鈕 |
| 發佈 | 列表/詳情頁 | 草稿狀態可發佈 |
| 下架 | 列表/詳情頁 | 已發佈狀態可下架 |

### 響應式設計
- 手機/平板：單欄佈局
- 桌面：雙欄/三欄表單
