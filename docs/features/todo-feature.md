# Todo Feature - 標準開發範例

> 本文件作為未來開發其他 Feature 的經典範例，說明此專案的標準開發模式與最佳實踐。

---

## 1. 專案架構總覽

```
src/
├── db/                           # 資料庫層
│   ├── index.ts                  # Drizzle client (pg Pool)
│   ├── schema.ts                 # 所有 Table Schema
│   └── todos/
│       └── queries.ts            # Todo CRUD 查詢函式
├── server/
│   ├── trpc.ts                   # tRPC 初始化
│   └── routers/
│       ├── index.ts              # Root router
│       └── todos.ts             # Todo API router
├── app/
│   └── (main)/dashboard/todo/   # Feature Route (Colocation)
│       ├── page.tsx              # 頁面入口
│       └── _components/
│           └── todos-table.tsx   # 主要 UI 元件
└── lib/
    └── trpc.ts                   # Client-side tRPC hooks
```

### 核心設計原則

| 原則 | 說明 |
|------|------|
| **Colocation First** | Feature 相關檔案放在同一個目錄 |
| **`_` 前綴** | `_components/`, `_hooks/` 表示私有（不是 route） |
| **Global Shared** | 全域共享的放在 `src/components/ui/`, `src/lib/` |
| **Feature Isolation** | 每個 Feature 有自己的查詢、驗證、UI |

---

## 2. Database Layer

### 2.1 Drizzle Schema (`src/db/schema.ts`)

```typescript
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').notNull().default(false),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
```

### Schema 設計要點

| 欄位類型 | 語法 | 說明 |
|----------|------|------|
| UUID PK | `uuid('id').primaryKey().defaultRandom()` | 自動生成 UUID |
| 必填文字 | `text('title').notNull()` | 不能為空 |
| 可選文字 | `text('description')` | 預設 optional |
| 列舉 | `text('priority', { enum: ['low', 'medium', 'high'] })` | 有限選項 |
| 時間戳 | `timestamp('created_at').defaultNow().notNull()` | 自動時間 |

### 2.2 Drizzle Client (`src/db/index.ts`)

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### 2.3 Query Functions (`src/db/todos/queries.ts`)

```typescript
import { eq, desc, like, sql } from 'drizzle-orm';
import { db } from '@/db';
import { todos, type Todo, type NewTodo } from '@/db/schema';

export type TodoPriority = 'low' | 'medium' | 'high';

export interface TodosQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  completed?: boolean;
  priority?: TodoPriority;
  sortBy?: 'title' | 'createdAt' | 'priority' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function getTodos(
  params: TodosQueryParams = {}
): Promise<PaginatedResult<Todo>> {
  const {
    page = 1,
    pageSize = 20,
    search,
    completed,
    priority,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  // 建立查詢條件陣列
  const whereConditions: ReturnType<typeof eq>[] = [];

  if (search?.trim()) {
    whereConditions.push(like(todos.title, `%${search}%`));
  }

  if (completed !== undefined) {
    whereConditions.push(eq(todos.completed, completed));
  }

  if (priority) {
    whereConditions.push(eq(todos.priority, priority));
  }

  // 動態排序欄位
  const orderColumn =
    sortBy === 'title' ? todos.title
    : sortBy === 'priority' ? todos.priority
    : sortBy === 'dueDate' ? todos.dueDate
    : todos.createdAt;

  // 合併 WHERE 條件
  const whereClause = whereConditions.length > 0
    ? (whereConditions.length === 1
        ? whereConditions[0]
        : sql.join(whereConditions, sql` AND `))
    : undefined;

  // 執行查詢
  const offset = (page - 1) * pageSize;
  const [data, countResult] = await Promise.all([
    db.select().from(todos)
      .where(whereClause)
      .orderBy(sortOrder === 'desc' ? desc(orderColumn) : orderColumn)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(todos),
  ]);

  return {
    data: data as Todo[],
    total: Number(countResult[0]?.count) || 0,
    page,
    pageSize,
    pageCount: Math.ceil((Number(countResult[0]?.count) || 0) / pageSize),
  };
}

export async function getTodoById(id: string) {
  const result = await db.select().from(todos).where(eq(todos.id, id));
  return result[0] as Todo | undefined;
}

export async function createTodo(data: NewTodo) {
  const result = await db.insert(todos).values(data).returning();
  return result[0] as Todo;
}

export async function updateTodo(id: string, data: Partial<NewTodo>) {
  const result = await db.update(todos)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(todos.id, id))
    .returning();
  return result[0] as Todo;
}

export async function toggleTodo(id: string, completed: boolean) {
  const result = await db.update(todos)
    .set({ completed, updatedAt: new Date() })
    .where(eq(todos.id, id))
    .returning();
  return result[0] as Todo;
}

export async function deleteTodo(id: string) {
  const result = await db.delete(todos).where(eq(todos.id, id)).returning();
  return result[0] as Todo;
}
```

### Query Pattern 要點

```
┌─────────────────────────────────────────────────────────────┐
│                    Query Pattern                            │
├─────────────────────────────────────────────────────────────┤
│  1. 解構參數 with defaults                                  │
│  2. 建立 conditions 陣列                                    │
│  3. 動態加入篩選條件 (if statements)                        │
│  4. 使用 sql.join 合併多條件 → AND                          │
│  5. 動態排序欄位 (ternary)                                  │
│  6. Promise.all 同時執行 data + count                      │
│  7. 回傳 PaginatedResult                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. API Layer (tRPC)

### 3.1 Router (`src/server/routers/todos.ts`)

```typescript
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import * as queries from '@/db/todos/queries';

export const todosRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        completed: z.boolean().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        sortBy: z.enum(['title', 'createdAt', 'priority', 'dueDate']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ input }) => {
      return queries.getTodos(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const todo = await queries.getTodoById(input.id);
      if (!todo) throw new Error('Todo not found');
      return todo;
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
        dueDate: z.coerce.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.createTodo(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          priority: z.enum(['low', 'medium', 'high']).optional(),
          dueDate: z.coerce.date().optional().nullable(),
          completed: z.boolean().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return queries.updateTodo(input.id, input.data);
    }),

  toggle: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      return queries.toggleTodo(input.id, input.completed);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return queries.deleteTodo(input.id);
    }),
});
```

### tRPC Pattern 要點

| Pattern | 說明 |
|---------|------|
| `publicProcedure` | 公開的 API 端點 |
| `.input(schema)` | Zod 驗證輸入 |
| `.query()` | 讀取操作 |
| `.mutation()` | 寫入操作 |
| `z.coerce.date()` | 日期字串自動轉 Date |

---

## 4. UI Layer

### 4.1 Page (`src/app/(main)/dashboard/todo/page.tsx`)

```typescript
import { TodosTable } from './_components/todos-table';

export default function TodoPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Todo List</h1>
        <p className="text-muted-foreground">
          Manage your tasks with Drizzle + tRPC + Supabase
        </p>
      </div>
      <TodosTable />
    </div>
  );
}
```

### 4.2 Component (`src/app/(main)/dashboard/todo/_components/todos-table.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export function TodosTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState(false);

  // Data fetching via tRPC
  const { data, isLoading, refetch } = trpc.todos.list.useQuery({
    page,
    pageSize: 10,
    search: search || undefined,
    completed: showCompleted ? undefined : false,
    priority: (priority as 'low' | 'medium' | 'high') || undefined,
  });

  // Mutations
  const createMutation = trpc.todos.create.useMutation({
    onSuccess: () => refetch(),
  });

  const toggleMutation = trpc.todos.toggle.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.todos.delete.useMutation({
    onSuccess: () => refetch(),
  });

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle,
      description: newDescription || undefined,
      priority: newPriority,
      dueDate: newDueDate,
    });
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate(undefined);
    setShowCreateForm(false);
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Create Form Card */}
      <Card className="p-4">
        {!showCreateForm ? (
          <Button
            variant="outline"
            onClick={() => setShowCreateForm(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Todo
          </Button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Input
                placeholder="New todo title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1"
              />
              <Select
                value={newPriority}
                onValueChange={(v) => setNewPriority(v as typeof newPriority)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {newDueDate
                      ? format(newDueDate, 'MMM d, yyyy')
                      : 'Due Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDueDate}
                    onSelect={setNewDueDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Textarea
              placeholder="Description (optional)..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newTitle.trim()}
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Filter Card */}
      <Card className="p-4">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search todos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? 'Hide Completed' : 'Show All'}
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Done</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((todo) => (
                <TableRow key={todo.id}>
                  <TableCell>
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() =>
                        toggleMutation.mutate({
                          id: todo.id,
                          completed: !todo.completed,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell
                    className={
                      todo.completed
                        ? 'line-through text-muted-foreground'
                        : ''
                    }
                  >
                    {todo.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {todo.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={priorityColors[todo.priority || 'medium']}
                    >
                      {todo.priority || 'medium'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {todo.dueDate
                      ? format(new Date(todo.dueDate), 'MMM d, yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(todo.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteMutation.mutate({ id: todo.id })
                      }
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No todos found. Create one above!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {data && data.pageCount > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {page} of {data.pageCount}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(data.pageCount, p + 1))}
              disabled={page === data.pageCount}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

## 5. 關鍵技術要點

### 5.1 Date Handling (Client ↔ Server)

```
┌─────────────────────────────────────────────────────────────┐
│  Problem: JSON 序列化會將 Date → ISO 字串                    │
│  Solution: z.coerce.date() 自動解析字串為 Date              │
└─────────────────────────────────────────────────────────────┘

Client (React)              JSON                    Server (tRPC)
─────────────              ─────                    ─────────────
new Date() ──────→ "2026-04-12T00:00:00.000Z" ──→ z.coerce.date()
                                                    ↓
                                                 Date object
```

```typescript
// Router input
dueDate: z.coerce.date().optional()

// Client mutation
createMutation.mutate({ dueDate: new Date() })
```

### 5.2 Multiple WHERE Conditions

```typescript
// 使用 sql.join 合併 AND 條件
const whereConditions: ReturnType<typeof eq>[] = [];

if (search) whereConditions.push(like(todos.title, `%${search}%`));
if (completed !== undefined) whereConditions.push(eq(todos.completed, completed));
if (priority) whereConditions.push(eq(todos.priority, priority));

const whereClause = whereConditions.length > 0
  ? (whereConditions.length === 1
      ? whereConditions[0]
      : sql.join(whereConditions, sql` AND `))
  : undefined;
```

### 5.3 Dynamic Sort Column

```typescript
const orderColumn =
  sortBy === 'title' ? todos.title
  : sortBy === 'priority' ? todos.priority
  : sortBy === 'dueDate' ? todos.dueDate
  : todos.createdAt;

db.select()
  .from(todos)
  .orderBy(sortOrder === 'desc' ? desc(orderColumn) : orderColumn)
```

### 5.4 Mutation with Refetch

```typescript
const createMutation = trpc.todos.create.useMutation({
  onSuccess: () => refetch(),  // 成功后自動刷新列表
});
```

---

## 6. Feature 開發檢查清單

- [ ] **Schema**: 在 `src/db/schema.ts` 新增 table
- [ ] **Queries**: 在 `src/db/{feature}/queries.ts` 新增 CRUD
- [ ] **Router**: 在 `src/server/routers/{feature}.ts` 新增 tRPC procedures
- [ ] **Register**: 在 `src/server/routers/index.ts` 註冊新 router
- [ ] **Page**: 在 `src/app/(main)/dashboard/{feature}/page.tsx` 新增頁面
- [ ] **Component**: 在 `src/app/(main)/dashboard/{feature}/_components/` 新增 UI
- [ ] **Sidebar**: 在 `src/navigation/sidebar/sidebar-items.ts` 新增導航

---

## 7. 環境變數

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@host:5432/database
```

---

## 8. 延伸功能建議

| 功能 | 說明 |
|------|------|
| Edit Modal | 點擊編輯開啟 Dialog 修改 |
| Bulk Actions | 批次完成/刪除 |
| Drag & Drop | 拖曳排序 |
| Overdue Highlight | 逾期項目紅色標示 |
| Due Date Reminder | 截止前提醒 |
