# Phase 2: Product System & Public Catalog

> **Read `MASTER_SPEC.md` in the project root first.** Phase 1 must be complete. Build only what's described in this phase.

---

## Goal of Phase 2

Build the full product catalog experience for customers — but **read-only**. No cart, no checkout yet. By the end of this phase:
- Customers can browse a beautiful product catalog with filters
- Customers can search products with autocomplete
- Customers can view detailed product pages with the full customization engine (size, shape, flavor, tier, dietary, message, color, photo upload, add-ons) with live price updates
- "Add to Cart" button exists but is non-functional placeholder (will wire in Phase 3)
- Wishlist heart icon exists on cards but non-functional (will wire in Phase 4)
- A minimal admin product seeding script exists so we have realistic products to display

---

## Prerequisites

- Phase 1 complete and verified
- Database schema deployed
- Brand design system in place

---

## Tasks

### 1. Seed Realistic Products (Temporary Seeding)

Until Phase 5 (admin panel), we need products in the DB to design against. Create a comprehensive `supabase/seed-products.sql` (or seed script) that inserts at least:

- **20+ products** across the 5 categories (Birthday, Wedding, Cupcakes, Pastries, Custom Designs)
- For each product:
  - Multiple high-quality placeholder images (use Unsplash URLs — make sure `next.config.js` allows them)
  - 3–5 size options with realistic LKR prices
  - 2–4 flavor options (vanilla, chocolate, red velvet, vanilla bean, mocha, etc.) with realistic price modifiers
  - Tier options for wedding category
  - Eggless option enabled where appropriate
  - Vegan option on 5–6 products
  - Detailed description, ingredients, allergens
  - Mark 6 as featured, 4 as bestseller
- **10+ add-ons** in the global add-ons library (candles single/numbered, cake knife, greeting card, mylar balloons, fresh flowers, sparkler, etc.)
- Link relevant add-ons to products
- All products `is_published = true`

Document how to run this seed in README.

### 2. Public Product Catalog (`/cakes`)

A beautiful, magazine-quality catalog page:

- **Filter sidebar** (sticky on desktop, drawer on mobile):
  - Category checkboxes (multi-select)
  - Price range slider with LKR formatting
  - Flavor checkboxes
  - Dietary toggles (Eggless / Vegan / Gluten-free)
  - Occasion toggles (if implemented as a tag, otherwise skip)
  - "Clear all filters" button
- **Sort dropdown**: Newest, Price ↑, Price ↓, Popularity (use rating × count), Rating
- **Product grid**:
  - Responsive: 1 col mobile, 2 sm, 3 md, 4 lg
  - Each card: large image with hover transition (e.g., subtle zoom or secondary image), product name in serif, starting price ("from Rs. 3,500"), star rating + count, wishlist heart toggle (non-functional placeholder), "Quick view" on hover (desktop)
  - Featured products get a subtle badge
  - Out-of-stock products visually muted with "Sold Out" tag
- **Quick view modal**: opens a Framer Motion modal showing main image, name, base price, quick description, "View Full Details" button (links to PDP)
- Pagination (12 per page) OR infinite scroll — pick infinite scroll for the boutique feel
- Empty state when no products match filters (branded illustration + "Reset filters" CTA)
- Loading state with skeleton cards matching the brand

URL state for filters (e.g., `/cakes?category=birthday&flavor=chocolate&minPrice=2000&sort=price_asc`) — shareable links.

### 3. Search

- **Sticky search input** in header (icon expands to input on click on desktop; full-screen on mobile)
- Autocomplete dropdown showing top 5 matching products as you type (debounced 250ms, server-side query)
- Each suggestion: thumbnail, name, category, starting price
- "View all results" link at bottom → goes to `/cakes?q=<query>` filtered results
- Keyboard navigation in dropdown (arrow keys + enter)
- Empty state in dropdown when no matches

### 4. Product Detail Page (`/cakes/[slug]`)

This is **the most important page in the customer experience**. Treat it like a luxury product page.

#### Layout (desktop, two-column above the fold):
- **Left:** image gallery
  - Main large image with smooth fade transitions between images
  - Click to zoom (lightbox modal)
  - Thumbnail strip below (clickable)
  - Aspect ratio square or 4:5
- **Right:** product info & customization
  - Breadcrumbs (Home / Cakes / Category / Product Name)
  - Product name in display serif (large)
  - Star rating + "(X reviews)" link that scrolls to reviews section
  - Live price (updates as customizations change), in large brand-accent color
  - Short tagline / lead paragraph
  - Customization controls (see §5)
  - Add-ons checklist
  - Quantity selector (min 1, max 10)
  - **"Add to Cart"** button (large, primary) — currently shows a toast "Cart coming soon" but maintains structure
  - **"Buy Now"** button (secondary)
  - Wishlist toggle button
  - Estimated delivery info widget (e.g., "Order by 6pm today for tomorrow delivery" — uses configured min lead time)
  - Trust badges row (secure payment, fresh ingredients, custom designs, etc.)

#### Below the fold:
- **Description** section (rich text)
- **Ingredients & Allergens** in elegant accordion
- **Reviews** section:
  - Star breakdown bar chart (5★ how many, 4★ how many, etc.)
  - List of reviews with author, date, rating, body, optional image
  - "Sort by" dropdown (most recent / most helpful / highest / lowest)
  - "Be the first to review" empty state (review submission UI itself is Phase 4)
- **You may also like** — 4 related products (same category)

#### Mobile:
- Image gallery first
- Sticky bottom bar with "Add to Cart" + price (always visible)
- Customizations stack vertically with smooth accordion option for compact sections

### 5. Customization Engine

Per `MASTER_SPEC.md` §5 — implement deeply. Use React Hook Form + Zod.

Controls:
1. **Size** — radio cards in a horizontal scroll/wrap row. Each card shows size label, weight, price. Required.
2. **Shape** — radio cards with shape icon previews. Required if more than one option.
3. **Flavor** — radio cards or elegant dropdown. Required.
4. **Tier** — radio cards (only shown if product has tier options).
5. **Eggless toggle** — switch with "+Rs.X" badge.
6. **Vegan toggle** — switch with badge (only if product allows).
7. **Cake message** — text input with character counter (max 50). Live preview shows the message in a script font in a small preview chip.
8. **Color theme** — text input with optional color swatch input (use a simple color picker).
9. **Photo cake upload** — file input (only if `allows_photo_upload`). Show preview thumbnail after selection. Max 5MB, jpg/png only. Upload happens at add-to-cart time, not on select (defer for now — Phase 3).
10. **Add-ons** — checkbox list with image + name + price for each add-on linked to the product.
11. **Special instructions** — textarea (max 500 chars).

All controls update the displayed price in real-time. Show a price breakdown popover ("How is this calculated?") — base + size adjustment + tier modifier + dietary modifiers + add-ons = final.

Persist selections in local state (React Hook Form). Validation: prevent Add to Cart until required fields are valid.

Animations: every selection has a subtle bounce or check animation (Framer Motion).

### 6. Category Pages (`/cakes/category/[slug]`)

- Same layout as `/cakes` but pre-filtered to the category
- Hero banner at top with category image + name + description
- Same filter sidebar (with category already selected and locked, or removed)

### 7. Wishlist (UI Only)

- Heart icon on every product card and PDP
- Click → animates filled (Framer Motion), shows toast "Saved to wishlist"
- Persists in local Zustand store for now (no DB write yet — Phase 4 will wire to DB)
- Wishlist count in header user icon area updates

### 8. Performance

- Use Server Components for catalog list, filters via URL state
- Stream product cards
- Image optimization: `next/image` with proper `sizes` attribute
- Avoid hydration mismatches
- Use `<Suspense>` and `loading.tsx` thoughtfully

### 9. SEO

- Each product page has dynamic metadata (title, description from product fields)
- Open Graph image = primary product image
- Add product structured data (JSON-LD) — Product schema with offers
- Category pages have proper metadata
- `/cakes` has good metadata

---

## Phase 2 Completion Checklist

- [ ] 20+ products seeded across all categories with full data
- [ ] `/cakes` catalog renders beautifully with all filters working
- [ ] Sort works, URL state persists filters
- [ ] Search autocomplete works smoothly with debouncing
- [ ] Product detail page is stunning — gallery, customizations, all sections present
- [ ] Customization controls update price live without lag
- [ ] All required validations trigger correctly
- [ ] Mobile experience is excellent (test on 375px viewport)
- [ ] Wishlist heart toggles with animation (UI only)
- [ ] Category-specific pages work
- [ ] Quick view modal works
- [ ] Empty states for "no results" and "no reviews" are branded
- [ ] SEO metadata + JSON-LD verified
- [ ] No TypeScript errors, no console errors
- [ ] Lighthouse on PDP: Performance 80+, Accessibility 95+, SEO 95+
- [ ] Brand still feels boutique — premium, not generic

Ready for **Phase 3: Cart, Checkout & Orders**.
