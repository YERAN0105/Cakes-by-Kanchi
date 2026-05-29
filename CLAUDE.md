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

Auth mutations use **Server Actions** in `lib/actions/auth.ts`. OAuth callback: `app/auth/callback/route.ts`. Registration uses `admin.auth.admin.createUser({ email_confirm: true })` (bypasses email confirmation since Resend is not configured) then immediately signs in with `signInWithPassword`. Phone uniqueness is enforced via a partial unique index (`users_phone_unique`) — not a DB constraint — so check for duplicate before insert and roll back the auth user if taken.

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

### Timestamps and timezones

Supabase stores all timestamps in UTC. The server (Node.js) also runs in UTC, so plain `format()` from `date-fns` will display UTC time. **Always use `formatInTimeZone(date, "Asia/Colombo", pattern)` from `date-fns-tz`** for any DB timestamp displayed to users. Convention: declare `const TZ = "Asia/Colombo"` at the top of each file.

Exception: delivery dates stored as `YYYY-MM-DD` strings — appending `T00:00:00` and using plain `format()` is correct since they have no time component.

### Client state

- `stores/wishlist.ts` — Zustand with `persist` middleware (localStorage key `cakery-wishlist`). Synced to the `wishlist` DB table on login via `WishlistSync` component in the storefront layout. Page at `app/(storefront)/account/wishlist/page.tsx` fetches full product details from Supabase using the stored IDs.
- `stores/cart.ts` — Zustand with `persist` middleware (localStorage key `cakery-cart`). Holds `items`, `appliedCoupon`, `isDrawerOpen`, `_hasHydrated`. `_hasHydrated` must be checked before rendering cart UI to avoid hydration mismatches. `validateAndPriceItem()` in `lib/actions/cart.ts` re-prices items server-side on every add. Cart price is re-validated again in `createOrder` — never trust client totals. Every cart mutation (`addItem`, `removeItem`, `updateQuantity`) calls `refreshCoupon()` to recompute `discountAmount` live using `computeDiscount()` from `lib/cart-utils.ts` — the `maxDiscount` field on `AppliedCoupon` must stay populated for this to work.

### Key API routes

- `app/api/products/route.ts` — paginated product listing with all filter params
- `app/api/search/route.ts` — autocomplete, returns top 6 matches (id, slug, name, category, minPrice, imageUrl)
- `app/api/slots/capacity/route.ts` — `GET ?date=YYYY-MM-DD`, returns `{ usage: { [slotId]: count } }` (counts active orders per slot)
- `app/api/orders/track/route.ts` — guest order lookup by order_number + email/phone
- `app/api/orders/upload-receipt/route.ts` — accepts `FormData` with `file` + `orderId`, uploads to the private `receipts` bucket via admin client, inserts `bank_transfer_receipts` row with storage path (not a public URL). Upload is proxied through this route because the bucket is private and RLS blocks anonymous users from writing directly.
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

### Price breakdown

`buildPriceBreakdown(product, customization): PriceLineItem[]` in `lib/cart-utils.ts` returns a labelled breakdown of how a unit price is composed (base size price + modifiers + add-ons with quantities). Called in `validateAndPriceItem` (cart add) and `createOrder` (order creation) and stored in `CartItem.priceBreakdown` and `ProductSnapshot.priceBreakdown` respectively. Both fields are optional for backwards compatibility with old cart/order data.

Add-on quantities are stored as `addon_quantities: Record<string, number>` on `CustomizationValues` (optional, defaults to 1 per add-on). The `−/qty/+` stepper in `CustomizationEngine` writes this field; `calculateUnitPrice` and `buildPriceBreakdown` read it.

### Phased build

The project is built in 6 phases (see `MASTER_SPEC.md` §10). Phases 1–4 are complete. Add features only within the phase currently being built.

Current boundary: **Phase 5 (Admin Panel)** — order management, product/category CRUD, coupon management, delivery zone settings, time slot management, user management.

Key Phase 5 wiring points:
- `earnLoyaltyPointsAction(orderId)` in `lib/actions/account.ts` is fully written but never called — Phase 5 should call it when an admin marks an order as `delivered`.
- Bank transfer receipts are stored as paths (not public URLs) in `bank_transfer_receipts.image_url` — Phase 5 admin must generate signed URLs via `admin.storage.from("receipts").createSignedUrl(path, 3600)` to display them.
- `time_slots` table supports full CRUD — add, edit label/capacity, deactivate. Capacity is enforced live via `app/api/slots/capacity/route.ts` which counts non-cancelled orders per slot per date.

### Business model

Made-to-order bakery — no physical cake inventory is held. `stock_tracked = false` for all cake products. Order capacity is controlled by **time slot limits** (`max_orders` on `time_slots`), not stock levels. Stock decrement in `createOrder` only applies to physical add-ons (candles, etc.). Customers must order at least **2 days in advance** — enforced both client-side (DayPicker `disabled`) and server-side (`createOrder` validates date string).

### Checkout / order creation notes

- Order number format: `CKR-YYYYMMDD-XXXXXX`
- `CheckoutClient` uses an `orderPlaced` ref set to `true` before `clearCart()` — this prevents the cart-empty `useEffect` from redirecting to `/cart` after a successful order. Do not remove it.
- On mount, `CheckoutClient` auto-selects the `is_default` saved address (or first address if none flagged) via `defaultValues`, including its `delivery_zone_id`.
- Contact section is **read-only for logged-in users** (displays name/email/phone as text with a "Update your profile" link to `/account/profile`). Guests get the full editable form. Do not make it editable for logged-in users — the order is tied to `user_id` and the profile is the right place to update those details.
- Payment methods: `payhere` (card/bank), `bank_transfer` (manual receipt upload), `cod`
- `free_delivery` coupon type zeros the delivery fee — handled in both `createOrder` (server) and `CheckoutClient` (client display)
- Phone numbers: stored as `+94XXXXXXXXX`. The checkout UI shows a `+94` prefix badge; user types 9 digits. Strip/prepend on read/write.
- Bank receipts: uploaded to the private `receipts` Supabase Storage bucket. Path (not URL) stored in `bank_transfer_receipts.image_url`. Admin generates signed URLs in Phase 5.
- `lib/payments/payhere.ts` gracefully no-ops when `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` are empty.

## Environment variables

Only Supabase credentials are currently configured. Google OAuth, PayHere, Resend, and WhatsApp vars are present in `.env.local` but empty. All code referencing them must read via `process.env` and gracefully no-op or show a clear message when absent — never throw at startup. Credentials can be added later with a server restart, no code changes needed.
