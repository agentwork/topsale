# Design Guideline

## Overview

This project uses **Shadcn/ui** + **Tailwind CSS** with CSS variables for theming. The design supports **multiple theme presets** (default, soft-pop, brutalist, tangerine) and **dark mode**.

## Color System

### CSS Variables (Light Mode - Default)

```css
--background: oklch(1 0 0);
--foreground: oklch(0.148 0.004 228.8);
--primary: oklch(0.488 0.243 264.376);
--primary-foreground: oklch(0.97 0.014 254.604);
--secondary: oklch(0.967 0.001 286.375);
--secondary-foreground: oklch(0.21 0.006 285.885);
--muted: oklch(0.963 0.002 197.1);
--muted-foreground: oklch(0.56 0.021 213.5);
--accent: oklch(0.963 0.002 197.1);
--accent-foreground: oklch(0.218 0.008 223.9);
--destructive: oklch(0.577 0.245 27.325);
--border: oklch(0.925 0.005 214.3);
--card: oklch(1 0 0);
--card-foreground: oklch(0.148 0.004 228.8);
```

### Semantic Colors

| Token | Usage |
|-------|-------|
| `--primary` | Main actions, links, focus |
| `--secondary` | Secondary actions |
| `--muted` | Backgrounds, disabled states |
| `--destructive` | Delete, error, danger |
| `--border` | Borders, dividers |
| `--card` | Card backgrounds |

## Typography

- **Font**: Inter (sans), Geist Mono (mono)
- **Base size**: `text-sm` (14px)
- **Line height**: `leading-normal` for body
- **Font weights**: `normal` (400), `medium` (500), `semibold` (600)

## Spacing

- Use Tailwind spacing scale: `gap-1`, `gap-2`, `gap-4`, `gap-6`
- Card padding: `px-6 py-6` (default), `px-4 py-4` (sm)
- Section spacing: `gap-4` or `gap-6`

## Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | calc(var(--radius) - 4px) ≈ 6px |
| `--radius` | 10px (default) |
| `--radius-lg` | 14px |
| `--radius-xl` | 18px |

## Components

### Button

```tsx
import { Button } from "@/components/ui/button";

// Variants
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
    <CardAction><Button>Action</Button></CardAction>
  </CardHeader>
</Card>

// Sizes: default (gap-6, py-6), sm (gap-4, py-4)
<Card size="sm">...</Card>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="ghost">Ghost</Badge>
```

### Input

```tsx
import { Input } from "@/components/ui/input";

<Input placeholder="Enter text..." />
<Input type="email" placeholder="email@example.com" />
```

### Table

```tsx
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Layout Patterns

### Page Structure

```
┌─────────────────────────────────────────────┐
│  Breadcrumb (optional)                      │
├─────────────────────────────────────────────┤
│  Page Header                                │
│  ┌─────────────────────────────────────┐   │
│  │ Title              [Actions]        │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  Filters / Search Bar                       │
├─────────────────────────────────────────────┤
│  Content Area                               │
│  ┌─────────────────────────────────────┐   │
│  │ Cards / Table / Charts              │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  Pagination                                │
└─────────────────────────────────────────────┘
```

### Dashboard Layout

- Sidebar navigation on the left
- Main content area with padding `p-6`
- Cards in grid layout using `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

## Shadow System

```css
--shadow-xs: subtle shadow for small elements
--shadow-sm: card default shadow
--shadow: standard shadow
--shadow-md: elevated elements
--shadow-lg: modals, dropdowns
```

## Animations

- Use Tailwind's `transition-all` for hover states
- Use `animate-in` classes for entrance animations
- Keep animations subtle and fast (150-300ms)

## Dark Mode

All components automatically support dark mode via CSS variables. Use semantic tokens (`--primary`, `--muted`) instead of hardcoded colors.

## Icon Library

- **Library**: Lucide React
- **Import**: `import { IconName } from "lucide-react"`
- **Default size**: `size-4` (16px) for inline, `size-5` (20px) for standalone

## Best Practices

- Use semantic tokens, not hardcoded colors
- Use existing Shadcn/ui components
- Keep components accessible (ARIA attributes)
- Use `cn()` utility for merging classes
- Follow existing spacing patterns
- Support dark mode automatically via CSS variables
