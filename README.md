# Cakery — Premium Cake Shop Platform

A full-featured e-commerce platform for a premium cake bakery based in Sri Lanka.
Built with Next.js 15, Supabase, Tailwind CSS, and shadcn/ui.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required for Phase 1:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key

Optional (leave empty — features gracefully no-op):
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `PAYHERE_*` — PayHere payment gateway
- `RESEND_API_KEY` — transactional emails
- `WHATSAPP_*` — WhatsApp notifications

### 3. Run database migrations

Go to your **Supabase project → SQL Editor** and run the following files **in order**:

1. `supabase/migrations/001_initial_schema.sql` — all tables, types, indexes, and triggers
2. `supabase/migrations/002_rls_policies.sql` — Row Level Security policies
3. `supabase/seed.sql` — categories, delivery zones, time slots, add-ons, and default settings

**Tip:** In the SQL Editor, paste the entire file content and click **Run**.

### 4. Seed the admin user

Set your desired admin credentials in `.env.local`:

```
ADMIN_SEED_EMAIL=admin@cakery.lk
ADMIN_SEED_PASSWORD=YourStrongPassword123
```

Then run:

```bash
npm run seed-admin
```

This creates an auth user in Supabase and sets `role = 'admin'` in the `users` table.

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Supabase Storage Buckets

After running migrations, create these storage buckets in **Supabase Dashboard → Storage**:

| Bucket | Public? | Purpose |
|---|---|---|
| `product-images` | ✅ Public | Product photos |
| `custom-cake-refs` | 🔒 Private | Custom cake reference images |
| `payment-receipts` | 🔒 Private | Bank transfer receipt uploads |
| `review-images` | ✅ Public | Customer review photos |

---

## Google OAuth Setup (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add `https://rkgcwymhriezmyocozxg.supabase.co/auth/v1/callback` as an authorised redirect URI
4. In Supabase Dashboard → Authentication → Providers → Google, paste your Client ID and Secret
5. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`

---

## Project Structure

```
app/
├── (storefront)/       # Customer-facing pages
├── (auth)/             # Login, register, reset-password
├── admin/              # Admin dashboard (Phase 5)
├── api/                # API routes (webhooks, etc.)
└── auth/callback/      # OAuth callback handler

components/
├── storefront/         # Storefront-specific components
├── admin/              # Admin-specific components
└── shared/             # Reusable across the app

lib/
├── supabase/           # Supabase client instances
├── actions/            # Server Actions
├── validations/        # Zod schemas
└── brand.ts            # Brand config (name, colors, contact info)

supabase/
├── migrations/         # SQL migration files
└── seed.sql            # Seed data

scripts/
└── seed-admin.ts       # Admin user seeder
```

---

## Phases

| Phase | Description | Status |
|---|---|---|
| 1 | Foundation, Auth, DB Schema, Brand System | ✅ Done |
| 2 | Product System, Catalog, Search | 🔜 Next |
| 3 | Cart, Checkout, Payments, Orders | ⏳ |
| 4 | Customer Account, Loyalty, Wishlist | ⏳ |
| 5 | Admin Panel | ⏳ |
| 6 | Notifications, Polish, Launch | ⏳ |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run seed-admin` | Seed an admin user (requires env vars) |

---

## Brand Customisation

Edit `lib/brand.ts` to update the shop name, contact info, and social links.
Edit `app/globals.css` CSS variables to change the colour palette.
Fonts are configured in `app/layout.tsx` via `next/font/google`.
