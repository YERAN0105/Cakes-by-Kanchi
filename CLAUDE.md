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

- `stores/wishlist.ts` — Zustand with `persist` middleware (localStorage key `cakery-wishlist`). Page at `app/(storefront)/account/wishlist/page.tsx` fetches full product details from Supabase using the stored IDs. Local-only until Phase 4 wires it to the DB (merge on login).
- `stores/cart.ts` — Zustand with `persist` middleware (localStorage key `cakery-cart`). Holds `items`, `appliedCoupon`, `isDrawerOpen`, `_hasHydrated`. `_hasHydrated` must be checked before rendering cart UI to avoid hydration mismatches. `validateAndPriceItem()` in `lib/actions/cart.ts` re-prices items server-side on every add. Cart price is re-validated again in `createOrder` — never trust client totals.

### Key API routes

- `app/api/products/route.ts` — paginated product listing with all filter params
- `app/api/search/route.ts` — autocomplete, returns top 6 matches (id, slug, name, category, minPrice, imageUrl)
- `app/api/slots/capacity/route.ts` — `GET ?date=YYYY-MM-DD`, returns `{ usage: { [slotId]: count } }` (counts active orders per slot)
- `app/api/orders/track/route.ts` — guest order lookup by order_number + email/phone
- `app/api/orders/upload-receipt/route.ts` — inserts `bank_transfer_receipts` row with storage path (not a public URL)
- `app/api/payments/payhere/webhook/route.ts` — verifies MD5 signature, maps PayHere status codes to order status

### searchParams in Next.js 15

`searchParams` in Server Components is a Promise — always `await` it:

```ts
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
}
```

### shadcn/ui

The `components/ui/` directory was initially empty — components are built manually from `@radix-ui/*` primitives as needed. `components/ui/accordion.tsx` is the reference implementation.

### Category catalog pattern

`app/(storefront)/cakes/category/[slug]/page.tsx` passes `defaultCategory={slug}` to `CatalogGrid` and `hideCategories` to `FilterSidebar`. `CatalogGrid.buildApiUrl` always appends the `defaultCategory` to every client-side API call because the route segment is never present in `useSearchParams()`. The `hideCategories` prop removes the category filter panel on category pages to prevent heading/filter conflicts.

The storefront layout (`app/(storefront)/layout.tsx`) is `async` and fetches categories once via `getAllCategories()`, passing them down to `Header` as props. Do not fetch categories again inside individual pages.

### Phased build

The project is built in 6 phases (see `MASTER_SPEC.md` §10). Phases 1–3 are complete. Add features only within the phase currently being built.

Current boundary: **Phase 4 (Customer Account)** — order history, saved addresses, wishlist DB sync, loyalty points, reviews, profile. Key starting points:
- `addresses` table is already populated by Phase 3 checkout — do NOT redesign this data model. Read/write the same table from `/account/addresses`.
- Wishlist store (`stores/wishlist.ts`) is local-only — Phase 4 should merge it with the DB on login.
- Loyalty points are reserved in `createOrder` but never redeemed yet — Phase 4 adds the redemption UI.
- The stub at `app/(storefront)/account/page.tsx` needs to be replaced (currently just a placeholder).

### Business model

Made-to-order bakery — no physical cake inventory is held. `stock_tracked = false` for all cake products. Order capacity is controlled by **time slot limits** (`max_orders` on `time_slots`), not stock levels. Stock decrement in `createOrder` only applies to physical add-ons (candles, etc.). Customers must order at least **2 days in advance** — enforced both client-side (DayPicker `disabled`) and server-side (`createOrder` validates date string).

### Checkout / order creation notes

- Order number format: `CKR-YYYYMMDD-XXXXXX`
- Payment methods: `payhere` (card/bank), `bank_transfer` (manual receipt upload), `cod`
- `free_delivery` coupon type zeros the delivery fee — handled in both `createOrder` (server) and `CheckoutClient` (client display)
- Phone numbers: stored as `+94XXXXXXXXX`. The checkout UI shows a `+94` prefix badge; user types 9 digits. Strip/prepend on read/write.
- Bank receipts: uploaded to the private `receipts` Supabase Storage bucket. Path (not URL) stored in `bank_transfer_receipts.image_url`. Admin generates signed URLs in Phase 5.
- `lib/payments/payhere.ts` gracefully no-ops when `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` are empty.

## Environment variables

Only Supabase credentials are currently configured. Google OAuth, PayHere, Resend, and WhatsApp vars are present in `.env.local` but empty. All code referencing them must read via `process.env` and gracefully no-op or show a clear message when absent — never throw at startup. Credentials can be added later with a server restart, no code changes needed.
