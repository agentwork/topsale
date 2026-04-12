# Project Rules

## Architecture: Colocation First

- Feature files in route folders: `src/app/(main)/{feature}/_components/`
- `_` prefix = private (not routes): `_components/`, `_hooks/`, `_store/`
- Global shared only at top level: `src/components/ui/`, `src/lib/`, `src/hooks/`

## Tech Stack

| Use | Tool | Location |
|-----|------|----------|
| API | tRPC | `server/routers/`, `lib/trpc.ts` |
| Database | Drizzle + Supabase | `db/schema.ts`, `db/queries.ts` |
| Validation | Zod | `features/{feature}/schema.ts` |
| UI State | Zustand | `features/{feature}/_store/` |
| Server State | TanStack Query | Via tRPC hooks |
| Tables | TanStack Table | `features/{feature}/_components/table/columns.tsx` |

## Drizzle + Supabase

- Define tables in `db/schema.ts`
- Create queries in `features/{feature}/db/queries.ts`
- Use Zod for input validation, Drizzle for DB schema
- tRPC procedures call query functions

## Don't

- ❌ `src/components/{feature}/` (use `_components/` inside feature)
- ❌ raw `fetch` instead of tRPC
- ❌ Zustand for server data
- ❌ mix route/non-route without `_` prefix
