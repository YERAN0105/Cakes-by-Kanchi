# 🎂 Premium Cake Shop — Master Project Specification

> **This is the source of truth for the entire project.** Every phase prompt references this document. Keep this file in your repository root. When Claude Code needs to verify a requirement, design decision, or scope boundary, it reads from here.

---

## 1. Project Overview

A **full-featured, professional e-commerce platform** for a single-shop premium cake business based in Sri Lanka. The platform consists of two completely separate experiences:

- **Customer storefront** — for browsing, customizing, and ordering cakes
- **Admin dashboard** — for full operational control over products, orders, customers, and marketing

The application must feel like a high-end boutique patisserie online — not a generic e-commerce template. Every detail (typography, spacing, animations, micro-interactions) should reinforce a premium, handcrafted brand.

### Business Context

- **Market:** Sri Lanka (primarily Colombo and suburbs)
- **Currency:** LKR (Sri Lankan Rupee), formatted as `Rs. 4,500.00`
- **Language:** English only
- **Single shop**, no multi-branch support
- **Admin-only** staff role (no separate baker/delivery accounts)
- **Brand name and logo:** Not yet decided — use a tasteful placeholder (`Cakery` or `Maison de Cake` or similar) with a typographic logo. Easy-to-replace from a single config file.

---

## 2. Tech Stack (Non-Negotiable)

| Layer | Technology |
|---|---|
| Framework | **Next.js 14+ (App Router)** with TypeScript (strict mode) |
| Database | **Supabase PostgreSQL** with Row Level Security (RLS) |
| Auth | **Supabase Auth** — Email/Password + Google OAuth |
| File Storage | **Supabase Storage** (product images, custom cake refs, payment receipts) |
| Styling | **Tailwind CSS** + **shadcn/ui** components |
| Animations | **Framer Motion** |
| Forms | **React Hook Form** + **Zod** schema validation |
| Client State | **Zustand** (cart, wishlist) |
| Server State | **TanStack Query** (React Query v5) |
| Charts | **Recharts** (admin dashboard) |
| Payments | **PayHere** (Sri Lankan gateway) + Bank Transfer + Cash on Delivery |
| Email | **Resend** for transactional emails |
| WhatsApp | **WhatsApp Cloud API** (Meta) for order notifications |
| Deployment | **Vercel** |
| Image Handling | `next/image` with Supabase Storage as source |
| Icons | **Lucide React** |
| Date/Time | **date-fns** + **react-day-picker** for delivery date selection |

### Required Code Quality
- TypeScript strict mode, no `any` types
- ESLint + Prettier configured
- Component-driven architecture (small, focused components)
- Server Components by default, Client Components only when needed
- Server Actions for mutations where appropriate
- Proper loading states, error boundaries, and empty states everywhere
- Accessibility: semantic HTML, ARIA labels, keyboard navigation, focus rings
- Responsive: mobile-first; tested at 375px, 768px, 1024px, 1440px

---

## 3. Design Direction — Elegant & Premium Boutique

The visual identity is the single most important differentiator. The site should feel like a Parisian patisserie crossed with a luxury fashion magazine.

### Aesthetic Pillars
- **Soft pastel palette** — think powder pink, cream, dusty rose, champagne, deep wine accent. Choose a cohesive palette of 5–7 colors. Avoid neon, avoid harsh blacks. Background should never be pure white — use a warm off-white/cream.
- **Typography pairing** — one elegant serif for headings (e.g., Cormorant Garamond, Playfair Display, Libre Caslon Text) and one refined sans-serif or humanist sans for body (e.g., Inter, Manrope, or DM Sans). Pick from Google Fonts. Consider an optional script accent font for very small ornamental touches.
- **Generous whitespace** — let the design breathe. Treat every page like a magazine spread.
- **Photography-first layouts** — large hero images, asymmetric galleries, mood-rich product shots. Build layouts that look incredible even before product photos are added (use elegant placeholders).
- **Subtle animations** — Framer Motion for fade-ins on scroll, gentle hover transitions, smooth page transitions, image parallax. Nothing flashy or distracting.
- **Tasteful ornamentation** — thin gold/copper hairlines, small decorative SVG flourishes, soft shadows. Use sparingly.
- **Micro-interactions** — buttons with elegant hover states, smooth cart drawer slide-in, refined toast notifications, skeleton loaders that match the brand tone.

### What to Avoid
- Generic Bootstrap/Tailwind UI looks
- Loud gradients, neon colors, harsh borders
- Stock e-commerce layouts (Shopify default vibes)
- Sans-serif-only typography
- Childish or overly playful elements (we are premium, not novelty)

### Brand Configuration File
Create a single source of truth (e.g., `lib/brand.ts` and `app/globals.css` CSS variables) so the brand name, tagline, colors, and fonts can be changed in one place.

---

## 4. Feature Inventory

### 4.1 Customer-Facing Features

#### Homepage
- Cinematic hero section (full-width image + headline + CTA, with subtle parallax)
- Featured cakes carousel (manually curated by admin)
- Category showcase (Birthday / Wedding / Cupcakes / Pastries / Custom / etc.)
- Bestsellers grid
- "How it works" section (Choose → Customize → Delivered)
- Customer testimonials/reviews highlights
- Newsletter signup
- Instagram-style gallery section (optional, can be a CMS-driven row)

#### Product Catalog (`/cakes`)
- Filter sidebar: category, price range, flavor, dietary (eggless/vegan/gluten-free), occasion
- Sort: newest, price ↑/↓, popularity, rating
- Pagination or infinite scroll
- Quick view modal on cards
- Wishlist heart icon on each card
- Responsive grid (1 col mobile, 2 tablet, 3-4 desktop)

#### Search
- Sticky search bar with autocomplete suggestions
- Results page with same filtering as catalog

#### Product Detail Page (`/cakes/[slug]`)
- Image gallery with zoom + thumbnail navigation
- Product info: name, price (updates based on selections), description, ingredients, allergens
- **Customization controls** (see §5 below)
- Quantity selector
- Add-ons checklist
- "Add to Cart" + "Buy Now" CTAs
- Wishlist toggle
- Reviews section with star breakdown + filter
- "You may also like" section
- Estimated delivery info widget

#### Custom Cake Inquiry (`/custom-cake`)
- Separate form for fully bespoke cakes:
  - Name, phone, email
  - Event date, occasion type
  - Servings needed
  - Design description (textarea)
  - Reference image upload (up to 5 images)
  - Budget range
  - Special requirements
- Submission creates an entry in admin panel
- Customer receives confirmation email + WhatsApp
- Admin reviews → sends quote → customer can pay via a generated link

#### Cart (`/cart`)
- Cart drawer (slide-in from right) accessible from any page
- Full cart page with editable items
- Shows all customizations per item
- Quantity adjust, remove item
- Apply coupon code
- Show subtotal, delivery fee placeholder, total
- "Continue Shopping" + "Proceed to Checkout"

#### Checkout (`/checkout`)
- Multi-step or single-page layout (your choice — single-page with sections is cleaner)
- **Step 1: Contact** — guest (email + phone) or login
- **Step 2: Delivery or Pickup**
  - Toggle between Delivery / Pickup
  - **Delivery:** address fields + zone selector (dropdown of admin-configured zones) → auto-calculates delivery fee
  - **Pickup:** show shop address + map
  - Delivery date picker (calendar, blocks out closed days + enforces min lead time)
  - Time slot picker (admin-configured slots)
- **Step 3: Payment**
  - PayHere (cards, eZ Cash, mCash, etc.)
  - Bank Transfer (show bank details + receipt upload field after order is placed)
  - Cash on Delivery (with minimum/maximum amount checks if configured)
- **Step 4: Review** — final order summary + place order button
- Order confirmation page with order number + status
- Send confirmation email + WhatsApp message

#### Customer Account (`/account`)
- Dashboard overview: recent order, loyalty points balance, wishlist count
- **Order history** — list with filter by status, search by order number, click to see detail
- **Order detail** — full breakdown, timeline of status changes, ability to upload bank receipt if pending, reorder button, contact support
- **Saved addresses** — CRUD
- **Wishlist** — list view with "Add to cart" / "Remove"
- **Loyalty points** — points balance, earning history, redeem at checkout
- **Reviews** — list of reviews submitted by this customer, edit/delete
- **Profile** — name, phone, email, password change
- **Logout**

#### Loyalty Points System
- Earn X points per Rs. spent (configurable in admin, default 1 point per Rs. 100)
- Points credited only after order is delivered (not on placement)
- Redeem at checkout: X points = Rs. Y discount (configurable rate)
- Maximum redemption per order (configurable, e.g., up to 20% of order value)
- Bonus points for first order, birthday month, reviews submitted (configurable)
- Points expire after 12 months (configurable)
- Visible in account dashboard

#### Static Pages
- About Us
- Contact (with form + map embed + WhatsApp click-to-chat)
- FAQ (accordion-style)
- Terms & Conditions
- Privacy Policy
- Delivery Information

#### Other
- Newsletter signup (footer + popup with delay)
- Cookie consent banner
- WhatsApp floating button (click to open WhatsApp chat with shop)
- 404 and error pages branded

---

### 4.2 Admin Features

All admin routes live under `/admin` and require an authenticated user with `role = 'admin'` (enforced via RLS + middleware).

#### Admin Dashboard (`/admin`)
- KPI cards: today's revenue, today's orders, pending orders, low stock count
- Revenue chart (last 30 days, switchable to 7d / 90d / 12 months)
- Top-selling cakes (last 30 days)
- Recent orders list (last 10) with quick status update
- Pending custom inquiries count
- Pending bank transfer approvals count

#### Product Management (`/admin/products`)
- Table view: thumbnail, name, category, base price, stock status, featured toggle, actions
- Filter by category, search by name, sort by various fields
- **Add/Edit product page** with sections:
  - Basic info: name, slug (auto-generated, editable), category, description (rich text), ingredients, allergens
  - **Images** (multi-upload, drag-to-reorder, set primary)
  - **Pricing & Sizes** — variable pricing table (e.g., 0.5kg → Rs.3500, 1kg → Rs.6500, etc.)
  - **Shape options** (round / square / heart / custom — multi-select)
  - **Flavor variants** with optional price modifiers
  - **Tier options** (single / two-tier / three-tier — with price modifiers)
  - **Dietary toggles** (eggless option, vegan option, gluten-free — each with price modifier)
  - **Customization toggles** — allow message, allow color theme, allow photo upload
  - **Add-ons** linked from a global add-ons library
  - SEO: meta title, meta description
  - Stock: track stock or not, current stock, low stock threshold
  - Status: published / draft, featured, bestseller
- Delete with confirmation (soft delete preferred)

#### Category Management (`/admin/categories`)
- CRUD with hero image, description, slug, display order

#### Add-Ons Library (`/admin/addons`)
- CRUD for candles, knife, greeting cards, balloons, flowers, etc.
- Each with name, image, price, stock toggle

#### Order Management (`/admin/orders`)
- Table with filters: status, date range, payment method, customer
- Search by order number, customer name/phone
- Status badge with color coding
- Click into order detail page:
  - Customer info, contact buttons (call, WhatsApp, email)
  - Delivery/pickup details with map link
  - Itemized order with all customizations expanded
  - Payment info, receipt image if bank transfer
  - Status timeline with manual update controls
  - Internal notes (admin-only)
  - **Print invoice** button (clean printable layout)
  - **Print kitchen ticket** button (simplified production sheet with sizes/customizations highlighted)
  - Refund / cancel actions with reason
- Bulk status update from list view

#### Customer Management (`/admin/customers`)
- Table with search, filter by registration date, sort by total spent
- Customer detail page:
  - Profile info, phone, email, addresses
  - Lifetime value, total orders, average order value
  - Loyalty points balance
  - Full order history
  - Manual notes
  - Block/unblock account
  - Manual customer creation (for walk-ins admin wants to track)
  - Edit/delete

#### Custom Inquiry Management (`/admin/inquiries`)
- List of all custom cake inquiries with status (new / in-progress / quoted / accepted / rejected / completed)
- Detail view with customer info, all uploaded references, requirements
- Internal reply with quote amount → generates a unique payment link sent via email + WhatsApp
- Convert accepted inquiry into a regular order

#### Bank Transfer Approvals (`/admin/payments/pending`)
- List of orders awaiting bank transfer verification
- View uploaded receipt image
- Approve / reject with reason → triggers customer notification

#### Coupon Management (`/admin/coupons`)
- CRUD coupons
- Code, type (% off / flat off / free delivery), value, min order amount, max discount cap
- Usage limit (total + per customer)
- Valid from/until dates
- Active toggle
- Applicable to specific products/categories or all
- Usage history

#### Banner / Slider Management (`/admin/banners`)
- CRUD for homepage hero slides and promo banners
- Image, headline, sub-headline, CTA text, CTA link, position, active dates

#### Delivery Zones (`/admin/delivery-zones`)
- CRUD zones with name (e.g., Colombo 1-7), delivery fee, estimated delivery time, active toggle
- Set minimum order amount per zone (optional)
- Same-day delivery surcharge per zone (optional)

#### Time Slots & Calendar (`/admin/schedule`)
- Define daily delivery time slots (e.g., 10am-12pm, 2pm-4pm, 6pm-8pm)
- Per-slot capacity limit (max orders per slot)
- Mark holidays / closed days
- Set minimum lead time globally (e.g., 24 hours) + override per category (wedding cakes might need 5 days)

#### Review Moderation (`/admin/reviews`)
- List of all reviews, filter by approved/pending/hidden
- Approve, hide, delete
- Reply to reviews (publicly visible)

#### Loyalty Settings (`/admin/loyalty`)
- Configure earning rate, redemption rate, expiry, bonuses
- View loyalty stats (total points issued, redeemed, expired)

#### Settings (`/admin/settings`)
- Shop info: name, logo (upload), tagline, address, phone, email, WhatsApp number, social media links
- Business hours
- Tax configuration (rate, inclusive/exclusive)
- Payment keys: PayHere merchant ID + secret, bank account details
- Notification settings: enable email, enable WhatsApp, customize templates
- SEO: site-wide meta tags, OG image
- Maintenance mode toggle

#### Activity Logs (`/admin/logs`)
- Audit trail: admin user, action, target, timestamp
- Filterable

---

## 5. Cake Customization Engine — Deep Detail

This is **the core differentiator**. The product detail page must support deep, intuitive customization with real-time price updates.

### Customization Controls (configurable per product)

1. **Size / Weight** — required, radio cards (0.5kg / 1kg / 1.5kg / 2kg / 3kg, each with price)
2. **Shape** — radio cards (Round / Square / Heart / Custom)
3. **Flavor** — radio cards or dropdown (Vanilla / Chocolate / Red Velvet / etc., with optional +Rs price modifiers)
4. **Tier** — radio cards (Single / Two-tier / Three-tier, with price modifiers)
5. **Eggless toggle** — switch (+Rs modifier)
6. **Vegan / Gluten-free toggles** — switches (+Rs modifiers, only if enabled on product)
7. **Cake message** — text input (with character counter, e.g., max 50 chars)
8. **Color theme** — text input or simple color picker
9. **Photo cake upload** — file input (only if product allows photo customization)
10. **Add-ons** — checkboxes (candles, knife, greeting card, etc.) pulled from add-ons library
11. **Special instructions** — textarea (max 500 chars)

### UX Requirements
- All controls update the displayed price **live** without page reload
- Price breakdown visible: base price → +modifiers → final price
- Selected customizations preserved across page refresh (local state until added to cart)
- Validation: required fields blocked from "Add to Cart"
- Mobile: customizations collapse into accordion sections
- Visual feedback for every selection (radio cards with checkmarks, smooth transitions)

### Storage
When added to cart, customization is stored as a structured JSON blob on the cart item. When order is placed, this becomes part of the order line item — fully queryable in admin.

---

## 6. Database Schema Guidance

Claude Code should finalize the schema, but it must cover:

### Core Tables
- `users` (extends Supabase `auth.users` with profile: name, phone, role, loyalty_points, created_at, blocked)
- `addresses` (user_id, label, recipient, phone, line1, line2, city, postal_code, is_default)
- `categories` (id, slug, name, description, image_url, display_order, is_active)
- `products` (id, slug, category_id, name, description, ingredients, allergens, base_price, is_published, is_featured, is_bestseller, stock_tracked, stock_quantity, low_stock_threshold, allows_message, allows_color_theme, allows_photo_upload, meta_title, meta_description, created_at, updated_at)
- `product_images` (id, product_id, url, alt_text, display_order, is_primary)
- `product_sizes` (id, product_id, label, weight_kg, price)
- `product_shapes` (id, product_id, shape)
- `product_flavors` (id, product_id, name, price_modifier)
- `product_tier_options` (id, product_id, tier_count, price_modifier)
- `product_dietary_options` (id, product_id, type ['eggless', 'vegan', 'gluten_free'], price_modifier)
- `addons` (id, name, description, image_url, price, stock_tracked, stock_quantity, is_active)
- `product_addons` (product_id, addon_id) — junction
- `coupons` (id, code, type, value, min_order_amount, max_discount, usage_limit_total, usage_limit_per_user, valid_from, valid_until, applies_to, is_active)
- `coupon_usage` (coupon_id, order_id, user_id, used_at)
- `delivery_zones` (id, name, fee, estimated_time, min_order_amount, same_day_surcharge, is_active)
- `time_slots` (id, label, start_time, end_time, capacity, is_active)
- `holidays` (id, date, label)
- `orders` (id, order_number, user_id (nullable for guest), guest_email, guest_phone, status, fulfillment_type ['delivery','pickup'], delivery_zone_id, address_snapshot (jsonb), delivery_date, time_slot_id, payment_method, payment_status, subtotal, delivery_fee, discount_amount, tax_amount, loyalty_points_used, loyalty_discount, total, coupon_id, notes, internal_notes, created_at, updated_at)
- `order_items` (id, order_id, product_id, product_snapshot (jsonb), customization (jsonb), quantity, unit_price, line_total)
- `order_status_history` (id, order_id, status, note, changed_by, changed_at)
- `bank_transfer_receipts` (id, order_id, image_url, uploaded_at, status, reviewed_by, reviewed_at, reject_reason)
- `payments` (id, order_id, gateway, gateway_transaction_id, amount, status, raw_response (jsonb), created_at)
- `custom_inquiries` (id, name, email, phone, event_date, occasion, servings, description, budget_min, budget_max, special_requirements, status, quoted_amount, quote_message, payment_link, converted_order_id, created_at)
- `custom_inquiry_images` (id, inquiry_id, url)
- `reviews` (id, product_id, user_id, order_item_id, rating, title, body, status ['pending','approved','hidden'], admin_reply, created_at)
- `review_images` (id, review_id, url)
- `wishlist` (user_id, product_id, added_at) — composite PK
- `loyalty_transactions` (id, user_id, order_id (nullable), type ['earn','redeem','bonus','expire','adjust'], points, balance_after, note, created_at, expires_at)
- `banners` (id, image_url, headline, subheadline, cta_text, cta_link, position, display_order, valid_from, valid_until, is_active)
- `newsletter_subscribers` (id, email, subscribed_at, is_active)
- `activity_logs` (id, user_id, action, target_table, target_id, metadata (jsonb), created_at)
- `settings` (key, value (jsonb)) — single-row config style for shop info, tax, etc.

### Key Requirements
- All money columns use `numeric(12,2)` — never floats
- All timestamps `timestamptz` with `default now()`
- Use UUID primary keys (`gen_random_uuid()`)
- Set up indexes on frequently queried columns (slug, status, user_id, order_number)
- Use foreign keys with appropriate `on delete` actions
- Snapshot pattern for orders: store product data and address data as JSONB at time of order so historical orders aren't broken by future product/address changes

### Row Level Security (RLS)
- Customers can only read/write their own data (addresses, orders, wishlist, reviews, etc.)
- Public can read published products, categories, banners, approved reviews
- Only admin role can write to product/category/order/customer/coupon/etc. tables
- Guest checkout must work (orders with `user_id IS NULL` accessible only via signed order token in URL)

---

## 7. Authentication & Authorization

- **Supabase Auth** with Email/Password + Google OAuth
- **No phone OTP** (decided against due to SMS cost)
- Customer registration captures: name, email, phone, password
- Email verification required before checkout (optional — soft-prompt instead if it adds friction)
- **Admin role assignment** — manual (set in DB or via a seeded admin user). No public signup leads to admin role.
- Middleware (`middleware.ts`) protects `/admin/*` routes
- Auth state synced via Supabase SSR helpers (`@supabase/ssr`)
- Session cookies, secure, httpOnly
- Password reset flow via email

---

## 8. Payments — PayHere Integration

PayHere is Sri Lanka's leading payment gateway. Reference: https://www.payhere.lk/developers/

### Flow
1. Customer selects "Pay Online" at checkout
2. Order created in DB with `payment_status = 'pending'`
3. Customer redirected to PayHere checkout (hosted by PayHere) with order metadata
4. On success/failure, PayHere POSTs to our webhook (`/api/payments/payhere/webhook`)
5. Webhook verifies signature using merchant secret, updates order's payment_status
6. Customer redirected back to `/order-success/[orderNumber]`

### Implementation Notes
- Use PayHere's "Checkout" API (not the inline JS for simplicity)
- Verify webhook signature properly (MD5 hash of fields per PayHere docs)
- Handle all PayHere statuses: 2 (success), 0 (pending), -1 (cancelled), -2 (failed), -3 (chargedback)
- Store full raw webhook payload in `payments.raw_response` for debugging
- Use sandbox mode in development (configurable via env var)

### Bank Transfer Flow
1. Customer selects "Bank Transfer"
2. Order created with `payment_status = 'pending_transfer'`
3. Order success page shows bank details + upload form
4. Customer uploads receipt image → stored in Supabase Storage, row in `bank_transfer_receipts`
5. Admin reviews in `/admin/payments/pending`
6. Approve → payment_status = `paid`, order_status auto-advances + notifications fire
7. Reject → payment_status = `rejected`, customer notified with reason, can re-upload

### COD Flow
1. Customer selects "Cash on Delivery"
2. Order created with `payment_status = 'cod'`, order_status = `pending_confirmation`
3. Admin manually confirms (to filter fake orders)
4. On confirmation → order_status = `confirmed`, payment is collected upon delivery
5. Marked as paid when admin marks order as `delivered`

---

## 9. Notifications — Email + WhatsApp

### Triggers (in order of customer journey)
1. **Order placed** — confirmation with order number, items, total, delivery date
2. **Payment received / approved** (PayHere webhook or bank transfer approval)
3. **Order confirmed by admin** (especially for COD)
4. **Order in preparation** ("Your cake is being baked")
5. **Out for delivery** OR **Ready for pickup**
6. **Delivered / completed**
7. **Order cancelled** (with reason)
8. **Bank transfer rejected** (with reason + re-upload link)
9. **Review request** (sent 2 days after delivery)
10. **Custom inquiry received** (auto-ack to customer + alert to admin)
11. **Custom inquiry quote sent** (to customer with payment link)
12. **Welcome email** (on signup)
13. **Password reset** (handled by Supabase)
14. **Abandoned cart reminder** (optional Phase 6+, 1 hour after cart abandonment with logged-in user)

### Email (Resend)
- Use React Email components for templates
- Branded templates matching the boutique aesthetic
- All templates in `emails/` directory
- Wrap sends in a `lib/notifications/email.ts` service

### WhatsApp Cloud API
- Free tier: 1000 conversations/month, $0 setup
- Reference: https://developers.facebook.com/docs/whatsapp/cloud-api
- Must pre-register message templates with Meta (utility templates approved usually within 24h)
- Wrap sends in a `lib/notifications/whatsapp.ts` service
- Templates include order number, customer name, total, delivery date as variables
- Phone numbers must be E.164 format (e.g., +94771234567)

### Notification Orchestrator
A single `lib/notifications/index.ts` exports a `notify(event, payload)` function. Each event has handlers that fan out to email + WhatsApp based on settings. Failures are logged but never block the user flow (fire-and-forget with retry queue if possible).

---

## 10. Build Phases

The project is built in **6 phases**. Each phase is a separate prompt file (`PHASE_1.md` through `PHASE_6.md`). Run them sequentially. Do not skip ahead. Each phase ends with a checklist — verify all items pass before starting the next phase.

1. **Phase 1: Foundation** — Setup, auth, DB schema, RLS, base layout, brand system, navigation, footer
2. **Phase 2: Product System** — Categories, products, customization options, public catalog, search, product detail page (read-only — no cart yet)
3. **Phase 3: Cart, Checkout & Orders** — Cart state, customization in cart, checkout flow, PayHere, bank transfer, COD, order creation, order success
4. **Phase 4: Customer Account** — Order history, status tracking, addresses, wishlist, loyalty points, reviews
5. **Phase 5: Admin Panel** — Full admin: dashboard, products, orders, customers, inquiries, coupons, banners, zones, slots, reviews, settings, logs
6. **Phase 6: Notifications, Polish & Launch** — Email (Resend) + WhatsApp Cloud API, all triggers, custom inquiry flow with payment links, SEO, sitemap, OG images, animations pass, accessibility audit, performance pass, deployment to Vercel

---

## 11. Environment Variables

Set up `.env.local` with these (placeholders are fine in dev):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BRAND_NAME=Cakery
NEXT_PUBLIC_CURRENCY=LKR

# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Payments
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
PAYHERE_MODE=sandbox  # or 'live'
PAYHERE_NOTIFY_URL=
PAYHERE_RETURN_URL=
PAYHERE_CANCEL_URL=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=orders@yourdomain.com

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=

# Optional
NEXT_PUBLIC_GA_ID=
```

Provide a `.env.example` committed to the repo with all keys blank.

---

## 12. Project Structure (suggested)

```
/
├── app/
│   ├── (storefront)/
│   │   ├── page.tsx                # Homepage
│   │   ├── cakes/
│   │   ├── custom-cake/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── account/
│   │   ├── about/
│   │   ├── contact/
│   │   └── ...
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── admin/
│   │   ├── layout.tsx              # Admin shell
│   │   ├── page.tsx                # Dashboard
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   └── ...
│   ├── api/
│   │   ├── payments/payhere/webhook/
│   │   └── ...
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn primitives
│   ├── storefront/
│   ├── admin/
│   └── shared/
├── lib/
│   ├── supabase/                   # client + server clients
│   ├── notifications/              # email + whatsapp services
│   ├── payments/                   # payhere client
│   ├── brand.ts
│   ├── utils.ts
│   └── validations/                # zod schemas
├── hooks/
├── stores/                         # zustand stores
├── types/                          # shared types
├── emails/                         # react-email templates
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── middleware.ts
└── public/
```

---

## 13. Quality Standards

Every page and component must satisfy:

- ✅ **Loading state** (skeleton or spinner, brand-styled)
- ✅ **Error state** (user-friendly, with retry)
- ✅ **Empty state** (with helpful CTA)
- ✅ **Responsive** at 375px, 768px, 1024px, 1440px
- ✅ **Keyboard navigable** (tab order, focus rings)
- ✅ **ARIA labels** on all interactive elements
- ✅ **No console errors or warnings** in production build
- ✅ **TypeScript strict** — no `any`, no `@ts-ignore`
- ✅ **Forms** validated with Zod, friendly inline error messages
- ✅ **Images** use `next/image` with proper width/height/sizes
- ✅ **Animations** smooth at 60fps, respect `prefers-reduced-motion`

---

## 14. Out of Scope (for v1)

These are explicitly **not** part of v1. Do not build them. They may come later.

- ❌ Multi-branch / multi-location support
- ❌ Multi-currency
- ❌ Multi-language (i18n)
- ❌ Phone/SMS OTP login
- ❌ Separate baker / delivery staff roles & dashboards
- ❌ Native mobile apps
- ❌ Subscription / recurring orders
- ❌ Affiliate / referral system
- ❌ Live chat (only WhatsApp click-to-chat)
- ❌ Real-time order tracking with GPS
- ❌ Integration with PickMe / Uber for delivery dispatch
- ❌ POS / in-store sales mode

---

## 15. Definition of Done — v1 Launch

The project is "done" when:

1. All 6 phases complete with their checklists ✅
2. Admin can add, edit, delete: products, categories, add-ons, coupons, banners, zones, slots, customers
3. Customer can: browse, search, customize a cake, add to cart, checkout via all 3 payment methods, track order, write reviews, redeem loyalty points
4. Email + WhatsApp notifications fire on all defined triggers
5. Custom cake inquiry flow works end-to-end (inquiry → quote → payment link → order)
6. Deployed to Vercel with custom domain ready
7. Supabase RLS policies tested — non-admins cannot access admin data
8. Lighthouse: Performance 85+, Accessibility 95+, Best Practices 95+, SEO 95+ on key pages
9. Mobile experience indistinguishable in quality from desktop
10. Brand feels boutique — soft pastel, serif, premium, photography-led

---

**END OF MASTER SPEC**
