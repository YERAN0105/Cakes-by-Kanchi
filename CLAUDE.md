# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build — must pass before merging
npm run lint         # ESLint
npm run format       # Prettier (auto-fixes)
npm run seed-admin   # Create/promote an admin user (reads .env.local)
```

There are no automated tests. Verify changes by running `npm run build` (catches TypeScript + lint errors) and checking the browser.

## Architecture

### Route groups and layouts

| Route group | Layout | Purpose |
|---|---|---|
| `app/(storefront)/` | Header + Footer + WhatsApp FAB | All customer-facing pages |
| `app/(auth)/` | Centered card on cream background | Login, register, password reset |
| `app/admin/` | Minimal dark shell | Admin panel (Phase 5) |
| `app/api/` | — | API routes (products, search, PayHere webhook) |

`middleware.ts` refreshes sessions on every request and guards `/admin/*` by checking `users.role = 'admin'` in the DB.

### Supabase client pattern

Three separate clients — never mix them up:

- `lib/supabase/client.ts` — `createClient()` for browser (Client Components)
- `lib/supabase/server.ts` — `createClient()` async, for Server Components and Server Actions
- `lib/supabase/admin.ts` — `createAdminClient()` uses the service role key, bypasses RLS — never import in client components

Auth mutations use **Server Actions** in `lib/actions/auth.ts`. OAuth callback: `app/auth/callback/route.ts`.

### Server/client boundary for utilities

`lib/products.ts` is **server-only** (imports `next/headers` via the server Supabase client). Pure helpers that must also be called from client components live in `lib/product-utils.ts`. When extracting shared logic, put it in a `*-utils.ts` file if it needs to be client-safe — never import from a file that imports `next/headers` inside a Client Component.

### Brand system

`lib/brand.ts` is the single source of truth for shop name, contact info, WhatsApp number, social links, and `formatCurrency()`. CSS custom properties in `app/globals.css` define the full colour palette (cream, blush, rose, wine, champagne, ink). Tailwind theme in `tailwind.config.ts` maps those variables to utility classes. Fonts (Cormorant Garamond / DM Sans / Great Vibes) are loaded in `app/layout.tsx` via `next/font/google` and exposed as CSS variables `--font-display`, `--font-body`, `--font-accent`.

### Database

All tables, ENUMs, indexes, and `updated_at` triggers: `supabase/migrations/001_initial_schema.sql`.
RLS policies: `supabase/migrations/002_rls_policies.sql`.
Seed data (categories, delivery zones, time slots, add-ons, settings): `supabase/seed.sql`.
Product seed (22 products with sizes, flavors, images, etc.): `supabase/seed-products.sql`.

Run all four in order in the Supabase SQL Editor.

TypeScript types are hand-maintained in `types/database.ts`. Every table interface requires a `Relationships: []` field or Supabase's client inference returns `never`. Convenience types (`ProductRow`, `ProductWithDetails`, `ProductListItem`, etc.) are defined at the bottom of the same file.

### Money and Supabase type-casting

All money values in the DB are `numeric(12,2)`. Supabase returns them as strings — use `parseFloat()` before arithmetic. Use `formatCurrency()` from `lib/brand.ts` for display.

Supabase's generic client frequently returns `never` for complex joined queries. Fix with explicit return type annotations and `as unknown as TargetType` casts — see `lib/products.ts` for the established pattern.

### Forms

React Hook Form + Zod. Never add `.default()` to Zod fields — it creates a type mismatch between input and output types that breaks `zodResolver`. Put all defaults in RHF's `defaultValues` option instead. See `lib/validations/customization.ts` for the pattern.

### Client state

- `stores/wishlist.ts` — Zustand with `persist` middleware (localStorage key `cakery-wishlist`). Local-only until Phase 4 wires it to the DB.
- Cart store: Phase 3.

### Key API routes

- `app/api/products/route.ts` — paginated product listing with all filter params
- `app/api/search/route.ts` — autocomplete, returns top 6 matches (id, slug, name, category, minPrice, imageUrl)

### searchParams in Next.js 15

`searchParams` in Server Components is a Promise — always `await` it:

```ts
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
}
```

### shadcn/ui

The `components/ui/` directory was initially empty — components are built manually from `@radix-ui/*` primitives as needed. `components/ui/accordion.tsx` is the reference implementation.

### Phased build

The project is built in 6 phases (see `MASTER_SPEC.md` §10). Phases 1 and 2 are complete. Stub pages exist for `/cart`, `/checkout`, `/account`, `/custom-cake` to keep the build green. Add features only within the phase currently being built.

Current boundary: Phase 3 (Cart, Checkout & Orders) is next. The "Add to Cart" button in `components/storefront/pdp/CustomizationEngine.tsx` shows a toast placeholder — wire it to the Zustand cart store in Phase 3.

## Environment variables

Only Supabase credentials are currently configured. Google OAuth, PayHere, Resend, and WhatsApp vars are present in `.env.local` but empty. All code referencing them must read via `process.env` and gracefully no-op or show a clear message when absent — never throw at startup. Credentials can be added later with a server restart, no code changes needed.
