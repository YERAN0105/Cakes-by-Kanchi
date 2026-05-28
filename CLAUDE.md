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

There are no automated tests yet. Verify changes by running `npm run build` (catches TypeScript + lint errors) and checking the browser.

## Architecture

### Route groups and layouts

| Route group | Layout | Purpose |
|---|---|---|
| `app/(storefront)/` | Header + Footer + WhatsApp FAB | All customer-facing pages |
| `app/(auth)/` | Centered card on cream bg | Login, register, password reset |
| `app/admin/` | Minimal dark shell | Admin panel (Phase 5) |
| `app/api/` | — | API routes (PayHere webhook, etc.) |

`middleware.ts` handles session refresh on every request and guards `/admin/*` — it checks `users.role = 'admin'` in the DB before allowing access.

### Supabase client pattern

Three separate clients — never mix them up:

- `lib/supabase/client.ts` — `createClient()` for browser (Client Components)
- `lib/supabase/server.ts` — `createClient()` async, for Server Components and Server Actions
- `lib/supabase/admin.ts` — `createAdminClient()` uses the service role key, bypasses RLS — **never import in client components**

Auth mutations use **Server Actions** in `lib/actions/auth.ts`. The OAuth callback route is `app/auth/callback/route.ts`.

### Brand system

`lib/brand.ts` is the single source of truth for shop name, contact info, WhatsApp number, and social links. CSS custom properties in `app/globals.css` define the full colour palette (cream, blush, rose, wine, champagne, ink). Tailwind theme in `tailwind.config.ts` maps those variables to utility classes. Fonts (Cormorant Garamond / DM Sans / Great Vibes) are loaded in `app/layout.tsx` via `next/font/google` and exposed as CSS variables `--font-display`, `--font-body`, `--font-accent`.

### Database

All tables, ENUMs, indexes, and `updated_at` triggers are in `supabase/migrations/001_initial_schema.sql`. RLS policies are in `supabase/migrations/002_rls_policies.sql`. Seed data (categories, delivery zones, time slots, add-ons, settings) is in `supabase/seed.sql`. Run all three manually in the Supabase SQL Editor in order.

TypeScript types for the DB are hand-maintained in `types/database.ts`. Each table needs a `Relationships: []` field or Supabase's client type inference returns `never`.

### Money

All money values in the DB are `numeric(12,2)`. They come back from Supabase as strings — use `parseFloat()` before arithmetic. Use `formatCurrency()` from `lib/brand.ts` for display.

### Phased build

The project is built in 6 phases. Phase 1 (foundation) is complete. Stub pages for later phases (`/cakes`, `/cart`, `/account`, `/custom-cake`) exist to keep the build green but have no real content yet. Add features only within the phase currently being built — do not implement Phase 3+ features while working on Phase 2.
