# Phase 1: Foundation, Auth & Brand System

> **Read `MASTER_SPEC.md` in the project root first.** It is the source of truth for the entire project. This phase prompt references it heavily.

You are building Phase 1 of a 6-phase premium cake shop e-commerce platform for the Sri Lankan market. **Build only what's described in this phase. Do not build features from later phases.** Stay strictly within scope.

---

## Goal of Phase 1

Establish the technical and visual foundation. By the end of this phase, the project has:
- A working Next.js 14+ TypeScript app
- Supabase configured (DB + Auth + Storage)
- Complete database schema with RLS
- Email/password + Google OAuth login
- Branded base layout (header, footer, navigation, mobile menu)
- A polished design system reflecting the "Elegant & Premium boutique" aesthetic
- Placeholder homepage that demonstrates the brand
- A seeded admin user

---

## Tasks

### 1. Project Setup
- Initialize Next.js 14+ with App Router, TypeScript (strict), Tailwind, ESLint
- Install all dependencies listed in `MASTER_SPEC.md` §2
- Set up `shadcn/ui` (init with neutral base color, then we'll customize)
- Configure Prettier
- Create folder structure per `MASTER_SPEC.md` §12
- Create `.env.example` with all keys from `MASTER_SPEC.md` §11

### 2. Brand System
- Create `lib/brand.ts` exporting brand config: `brandName`, `tagline`, `phone`, `whatsapp`, `email`, `address`, `socials`
- Use placeholder name `Cakery` for now
- Choose a refined color palette of 5–7 colors fitting the "soft pastel, premium boutique" aesthetic. Define them as CSS variables in `app/globals.css` (e.g., `--color-cream`, `--color-blush`, `--color-rose`, `--color-wine`, `--color-ink`, etc.). Map them into Tailwind theme via `tailwind.config.ts`.
- Choose typography pairing: an elegant serif for headings + refined sans-serif for body. Load via `next/font/google`. Apply via Tailwind theme.
- Background: warm off-white/cream, never pure white
- Create base utility classes for headings (`.font-display`), body, captions
- Create a `BrandLogo` component — typographic logo using the display serif (e.g., the brand name in elegant serif with a small ornament). Should look stunning at multiple sizes.
- Create a `<Container>` wrapper with consistent max-width and padding
- Set up Framer Motion provider in root layout
- Respect `prefers-reduced-motion` globally

### 3. Supabase Setup
- Create `lib/supabase/client.ts` — browser client
- Create `lib/supabase/server.ts` — server client using `@supabase/ssr`
- Create `lib/supabase/admin.ts` — service-role client (for admin tasks only, never imported in client components)
- Set up middleware in `middleware.ts` for session refresh and admin route protection

### 4. Database Schema & RLS
- Create migrations in `supabase/migrations/` covering all tables from `MASTER_SPEC.md` §6
- Use UUIDs, `numeric(12,2)` for money, `timestamptz` for dates
- Add appropriate indexes
- Write RLS policies per `MASTER_SPEC.md` §6 (customers see only own data; public sees published content; only admins can write to admin tables)
- Create a `seed.sql` that:
  - Creates 5 categories: Birthday, Wedding, Cupcakes, Pastries, Custom Designs (with placeholder images)
  - Creates 3 delivery zones (e.g., Colombo 1-7 Rs.500, Colombo 8-15 Rs.700, Suburbs Rs.900)
  - Creates 3 time slots (10am-12pm, 2pm-4pm, 6pm-8pm)
  - Inserts default settings row (shop info, tax rate 0% initially, loyalty defaults: 1 point per Rs.100, 100 points = Rs.50 discount)
- Provide clear instructions in README on how to run migrations + seed

### 5. Auth Flows
- **Register page** (`/register`): name, email, phone, password, confirm password. Zod validation. On success, create auth user + insert into `users` table (with role='customer'). Auto-login. Redirect to homepage.
- **Login page** (`/login`): email + password OR "Continue with Google". On Google OAuth, callback handler creates `users` row if first time.
- **Reset password flow**: `/forgot-password` (enter email) + `/reset-password` (set new password from email link). Uses Supabase password reset.
- **Logout** action accessible from header user menu
- All auth pages use the brand design — elegant cards, generous spacing, subtle animations
- Show inline form errors with calm, branded styling
- Add a "Continue as guest" link on login page (just navigates back to wherever they came from)

### 6. Seed Admin User
- Provide a script `scripts/seed-admin.ts` that creates an admin user (reads email/password from env vars `ADMIN_SEED_EMAIL` + `ADMIN_SEED_PASSWORD`). Updates the `users.role` to `admin`. Document how to run it in README.

### 7. Base Layout
- **Root layout** (`app/layout.tsx`): sets up fonts, framer motion provider, toaster (use `sonner`), theme
- **Storefront layout** (`app/(storefront)/layout.tsx`):
  - Header with logo, nav links (Home, Cakes, Custom Cake, About, Contact), search icon, wishlist icon, account icon, cart icon with badge
  - Sticky on scroll with smooth shadow appearance
  - Mobile: hamburger → slide-in drawer menu (Framer Motion)
  - Announcement bar above header (e.g., "Free delivery on orders over Rs. 10,000" — placeholder)
  - Footer with brand info, quick links, contact info, newsletter signup form (visual only — no API yet), social icons, payment method icons, copyright
  - WhatsApp floating button (bottom right, opens `wa.me/<number>`)
- **Auth layout** (`app/(auth)/layout.tsx`): centered card on cream background with subtle decorative ornaments

### 8. Placeholder Homepage
- Build a striking placeholder homepage that **demonstrates the brand aesthetic** even without products:
  - Cinematic hero: full-viewport-height image (use a tasteful placeholder from Unsplash via `next/image` with a remote pattern in `next.config.js`), elegant headline in serif, sub-headline, primary + secondary CTAs
  - "Crafted with love" intro section (text + image, magazine-style)
  - Category showcase grid (5 categories from seed, with hover effects)
  - Empty "Featured cakes" section with elegant placeholder cards (will be replaced in Phase 2)
  - "How it works" — 3 steps with icons (Lucide), subtle dividers
  - Testimonial placeholder section
  - Newsletter signup band
- Every section: smooth fade-in on scroll (Framer Motion)
- Mobile: looks just as good as desktop

### 9. Static Pages (skeletons only)
- `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/delivery-info` — minimal branded placeholder pages with proper layout, headings, lorem-ish content. Contact page includes a form (visual only, no submit yet) and a `wa.me` link.

### 10. Error & Not Found
- Branded `not-found.tsx` and `error.tsx` with the design aesthetic
- 404 page with cake-themed illustration (SVG, elegant)

### 11. Quality Checks (must all pass)
- TypeScript strict, zero `any`
- ESLint clean
- Mobile (375px) and desktop (1440px) both look polished
- All auth flows work end-to-end (register → login → reset password → logout)
- Admin user can log in (we don't need an admin dashboard yet — just verify the role is set)
- RLS verified: in Supabase SQL editor, run as a regular user — confirm they cannot read other users' data
- `prefers-reduced-motion` respected
- All images use `next/image`
- No console warnings or errors

---

## Phase 1 Completion Checklist

Before moving to Phase 2, verify:

- [ ] Next.js app runs with `npm run dev` with no errors
- [ ] Tailwind + custom brand colors + fonts loaded
- [ ] Brand feels boutique — soft pastel, serif, premium (look at the homepage with fresh eyes — does it feel high-end?)
- [ ] Supabase connected, migrations applied, seed data loaded
- [ ] Admin user seeded and can log in
- [ ] Register / login / Google OAuth / password reset all work
- [ ] Header, mobile menu, footer all polished
- [ ] Homepage placeholder is striking even without products
- [ ] WhatsApp floating button works (opens correct number)
- [ ] All static page skeletons exist and are branded
- [ ] RLS policies tested manually
- [ ] `.env.example` complete; README has setup instructions including migration + seed steps
- [ ] No TypeScript errors, no console errors
- [ ] Lighthouse on homepage: Performance 85+, Accessibility 95+, SEO 90+

When everything is green, you're ready for **Phase 2: Product System**.
