# Feature Development Guideline

## Overview

本指南說明如何在此專案中開發新功能。遵循 colocation-based architecture 原則，確保新功能可以模組化、可擴展，並與現有系統無縫整合。

## Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| API Layer | tRPC | Type-safe API calls |
| Database ORM | Drizzle | Type-safe database queries to Supabase |
| Validation | Zod | Runtime schema validation |
| State Management | Zustand | Lightweight global/local state |
| Data Fetching | TanStack Query (React Query) | Server state management |
| Data Tables | TanStack Table | Advanced table components |
| Database | Supabase | PostgreSQL database + Auth + Realtime |
| Framework | Next.js App Router | React framework |

---

## Feature Development Workflow

### Step 1: Plan Feature Structure

```
src/app/(main)/[feature]/
├── _components/              # Feature 專用元件
│   ├── feature-header.tsx
│   ├── feature-table.tsx
│   └── feature-form.tsx
├── _hooks/                   # Feature 專用 hooks (如需要)
│   └── use-feature-data.ts
├── _lib/                     # Feature 專用 utilities (如需要)
│   └── feature-utils.ts
├── _types/                   # Feature 專用類型 (如需要)
│   └── feature-types.ts
├── schema.ts                 # Zod schemas (驗證用)
├── db/
│   └── schema.ts             # Drizzle schema (資料庫)
├── db/
│   └── queries.ts            # Drizzle queries
├── page.tsx                  # Route entry point
└── layout.tsx                # Route layout (如需要)
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Components (colocated in feature/_components/)     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│  ┌──────────────────┐  ┌──────────────────────────────────┐│
│  │  Zustand Store   │  │  TanStack Query (React Query)    ││
│  │  (UI State)      │  │  (Server State / API Cache)      ││
│  └──────────────────┘  └──────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (tRPC)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Type-safe Procedures (query, mutation)             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (Drizzle)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Type-safe SQL queries to Supabase                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database: Supabase                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL + Auth + Realtime + Storage             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Drizzle + Supabase Setup

### Project Structure for Database

```
src/
├── db/
│   ├── index.ts              # Drizzle client instance
│   ├── schema.ts             # Shared table schemas
│   └── migrations/           # Drizzle migrations
├── server/
│   ├── trpc.ts              # tRPC instance & context
│   ├── context.ts           # tRPC context (includes db)
│   └── routers/
│       ├── index.ts         # Root router
│       ├── leads.ts         # Leads router
│       └── ...
└── lib/
    └── trpc.ts              # Client-side tRPC hooks
```

### Drizzle Schema 範例

```typescript
// db/schema.ts
import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum
export const statusEnum = pgEnum('status', ['new', 'contacted', 'qualified', 'lost']);

// Table schema
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  company: text('company'),
  status: statusEnum('status').default('new'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const leadsRelations = relations(leads, ({ many }) => ({
  activities: many(activities),
}));

// Type exports
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
```

### Drizzle Query 範例

```typescript
// features/leads/db/queries.ts
import { eq, desc, like, and, sql } from 'drizzle-orm';
import { db } from '@/db';
import { leads, type Lead, type NewLead } from '@/db/schema';
import { leadsQuerySchema, createLeadSchema } from '../schema';

export async function getLeads(params: z.infer<typeof leadsQuerySchema>) {
  const { page, pageSize, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;

  const conditions = [];
  if (search) conditions.push(like(leads.name, `%${search}%`));
  if (status) conditions.push(eq(leads.status, status));

  const offset = (page - 1) * pageSize;
  const orderColumn = sortBy === 'name' ? leads.name
    : sortBy === 'status' ? leads.status
    : leads.createdAt;

  const [data, countResult] = await Promise.all([
    db.select()
      .from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sortOrder === 'desc' ? desc(orderColumn) : orderColumn)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(leads),
  ]);

  return {
    data,
    total: countResult[0].count,
    page,
    pageSize,
    pageCount: Math.ceil(countResult[0].count / pageSize),
  };
}

export async function getLeadById(id: string) {
  return db.query.leads.findFirst({
    where: eq(leads.id, id),
    with: { activities: true },
  });
}

export async function createLead(data: NewLead) {
  return db.insert(leads).values(data).returning();
}

export async function updateLead(id: string, data: Partial<NewLead>) {
  return db.update(leads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
}

export async function deleteLead(id: string) {
  return db.delete(leads).where(eq(leads.id, id)).returning();
}
```

---

## tRPC Integration

### Define tRPC Router

```typescript
// server/routers/leads.ts
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { leadsQuerySchema } from '@/features/leads/schema';
import * as queries from '@/features/leads/db/queries';

export const leadsRouter = router({
  list: publicProcedure
    .input(leadsQuerySchema)
    .query(async ({ input }) => {
      return queries.getLeads(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const lead = await queries.getLeadById(input.id);
      if (!lead) throw new Error('Lead not found');
      return lead;
    }),

  create: publicProcedure
    .input(createLeadSchema)
    .mutation(async ({ input }) => {
      return queries.createLead(input);
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: updateLeadSchema,
    }))
    .mutation(async ({ input }) => {
      return queries.updateLead(input.id, input.data);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return queries.deleteLead(input.id);
    }),
});
```

---

## Zod + Drizzle 整合

### Schema 放置位置

| Schema Type | Location |
|-------------|----------|
| Drizzle table schema | `db/schema.ts` |
| Zod validation | `features/{feature}/schema.ts` |
| tRPC input validation | Router procedures |

### Zod Schema 範例

```typescript
// features/leads/schema.ts
import { z } from 'zod';

// Zod schema (for validation)
export const leadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'lost']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Create schema (omit auto fields)
export const createLeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'lost']).default('new'),
});

// Update schema (all fields optional)
export const updateLeadSchema = createLeadSchema.partial();

// Query params schema
export const leadsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'lost']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Infer types from Zod
export type Lead = z.infer<typeof leadSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadsQueryInput = z.infer<typeof leadsQuerySchema>;
```

### Type Flow: Drizzle → Zod → tRPC → Client

```
1. Drizzle schema defines DB structure
2. Zod schema validates input/output
3. tRPC uses Zod for type-safe procedures
4. Client gets fully typed data
```

---

## Zustand Store Guidelines

### 何時使用 Zustand vs TanStack Query

| Use Case | Solution |
|----------|----------|
| Server data (database) | TanStack Query (via tRPC) |
| UI state (modals, selections) | Zustand |
| Filters/pagination state | Zustand (persisted) |
| Form state | React Hook Form |
| Auth state | Supabase Auth + Zustand |

### Store 放置位置

```
features/{feature}/_store/
└── {feature}-store.ts     # Zustand store
```

---

## TanStack Query Hooks

```typescript
// features/leads/_hooks/use-leads-query.ts
import { trpc } from '@/lib/trpc';
import { keepPreviousData } from '@tanstack/react-query';

export function useLeadsQuery(filters: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
}) {
  return trpc.leads.list.useQuery(filters, {
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}

export function useLeadQuery(id: string) {
  return trpc.leads.getById.useQuery(
    { id },
    { enabled: !!id }
  );
}
```

```typescript
// features/leads/_hooks/use-leads-mutation.ts
import { trpc } from '@/lib/trpc';

export function useCreateLeadMutation() {
  const utils = trpc.useContext();
  return trpc.leads.create.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
  });
}

export function useUpdateLeadMutation() {
  const utils = trpc.useContext();
  return trpc.leads.update.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.leads.getById.invalidate();
    },
  });
}

export function useDeleteLeadMutation() {
  const utils = trpc.useContext();
  return trpc.leads.delete.useMutation({
    onSuccess: () => utils.leads.list.invalidate(),
  });
}
```

---

## TanStack Table Guidelines

### Columns 範例

```typescript
// features/leads/_components/leads-table/columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { type Lead } from '../schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export const leadsColumns: ColumnDef<Lead>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-sm text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'qualified' ? 'default' : 'outline'}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button variant="ghost" onClick={() => openDetail(row.original.id)}>
        Actions
      </Button>
    ),
  },
];
```

---

## Supabase Integration

### Drizzle 連接 Supabase

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host/dbname
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

---

## Feature Development Checklist

- [ ] Create feature route in `src/app/(main)/{feature}/`
- [ ] Define Drizzle schema in `db/schema.ts`
- [ ] Create queries in `features/{feature}/db/queries.ts`
- [ ] Define Zod schemas in `features/{feature}/schema.ts`
- [ ] Create tRPC router in `server/routers/`
- [ ] Create Zustand store in `features/{feature}/_store/` (if needed)
- [ ] Create TanStack Query hooks in `features/{feature}/_hooks/`
- [ ] Add TanStack Table columns in `features/{feature}/_components/`
- [ ] Add navigation to sidebar
- [ ] Follow UI patterns from existing features
