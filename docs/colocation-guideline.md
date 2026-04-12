# Colocation File System Architecture Guideline

## Overview

This project follows a **colocation-based architecture** where each feature keeps its own pages, components, and logic inside its route folder. Shared UI, hooks, and configuration live at the top level, making the codebase modular, scalable, and easier to maintain as the app grows.

## Core Principles

### 1. Colocation by Feature

Place files that are used together close to each other. A route folder should contain:

- `page.tsx` - Route entry point
- `layout.tsx` - Route-specific layout (if needed)
- `_components/` - Route-specific UI components
- `schema.ts` or `types.ts` - Route-specific validation/types
- Any other files that are only used by this route

### 2. Private Folders with Prefix `_`

Folders prefixed with `_` (e.g., `_components/`) are **private folders** in Next.js. They are:

- Opted out of the routing system
- Not exposed as routes
- Used to organize colocated files cleanly

### 3. Top-Level Shared Resources

Files that are **reused across multiple routes** should live at the top level:

| Directory | Purpose |
|-----------|---------|
| `src/components/ui/` | Reusable UI primitives (buttons, cards, inputs) |
| `src/hooks/` | Reusable custom React hooks |
| `src/lib/` | Shared utilities, helpers, and libraries |
| `src/config/` | Application configuration |
| `src/stores/` | Global state management |
| `src/navigation/` | Navigation-related config |
| `src/data/` | Static data or mocks |

---

## Project Structure

```
topsale/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (main)/                   # Main app route group (authenticated)
│   │   │   ├── auth/                 # Auth feature
│   │   │   │   ├── _components/      # Shared auth components (e.g., social-auth)
│   │   │   │   ├── v1/               # Auth v1
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── register/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── v2/               # Auth v2
│   │   │   │       ├── login/
│   │   │   │       ├── register/
│   │   │   │       └── layout.tsx
│   │   │   ├── dashboard/            # Dashboard feature
│   │   │   │   ├── _components/      # Dashboard-specific components
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── _components/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── crm/
│   │   │   │   ├── finance/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Main app layout
│   │   ├── (external)/               # External route group (public)
│   │   │   └── page.tsx
│   │   ├── layout.tsx                # Root layout
│   │   └── not-found.tsx
│   ├── components/
│   │   └── ui/                      # Global UI primitives
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── ...
│   ├── hooks/                        # Global custom hooks
│   │   └── use-mobile.ts
│   ├── lib/                          # Shared utilities
│   │   ├── utils.ts
│   │   └── preferences/
│   ├── config/                       # App configuration
│   ├── stores/                       # Global state stores
│   ├── navigation/                   # Navigation config
│   └── data/                         # Static data
```

---

## Directory Conventions

### Route Groups: `(main)` and `(external)`

Route groups are folders wrapped in parentheses `(group-name)` that organize routes **without affecting the URL path**.

| Group | Purpose |
|-------|---------|
| `(main)` | Core application logic (authenticated routes) |
| `(external)` | Public-facing routes (marketing, landing pages) |

### Feature Folder Structure

```
feature/
├── page.tsx              # Required: route entry point
├── layout.tsx            # Optional: route-specific layout
├── _components/          # Private folder for feature-specific components
│   ├── component-a.tsx
│   └── component-b.tsx
├── schema.ts             # Optional: Zod schemas, validation
├── types.ts              # Optional: feature-specific types
└── [sub-route]/
    └── page.tsx          # Nested routes
```

### Component Placement Rules

| Component Scope | Location |
|-----------------|----------|
| Used by **single route only** | `route/_components/` |
| Used by **multiple routes in same segment** | `parent-route/_components/` |
| Used by **multiple segments** | `src/components/ui/` |

### Server vs Client Components

- Files **without** `"use client"` are **Server Components** by default
- Files **with** `"use client"` are **Client Components**
- Mark leaf-level interactive components (forms, buttons with handlers) as client components
- Keep server components at the route level when possible

---

## Best Practices

### Do

- ✅ Keep route-specific logic colocated with the route
- ✅ Use `_components/` for private, route-specific UI
- ✅ Place shared utilities in `src/lib/`
- ✅ Use route groups to organize routes without affecting URLs
- ✅ Co-locate Zod schemas with the routes that use them

### Don't

- ❌ Create deep `components/` hierarchies for features
- ❌ Place feature-specific components in `src/components/`
- ❌ Put files used by only one route at the top level
- ❌ Mix route files with non-route files without using `_` prefix

---

## Migration Notes

When migrating from traditional folder structures:

1. **Identify feature boundaries** in your app
2. **Move colocated files** into each feature's `_components/` folder
3. **Extract shared code** to top-level directories (`lib/`, `hooks/`, `components/ui/`)
4. **Use route groups** to organize routes without URL changes

---

## Resources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Private Folders](https://nextjs.org/docs/app/building-your-application/routing/colocation)
- [Reference Project](https://github.com/arhamkhnz/next-colocation-template)
