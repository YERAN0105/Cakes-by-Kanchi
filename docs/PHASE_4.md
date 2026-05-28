# Phase 4: Customer Account

> **Read `MASTER_SPEC.md` first.** Phases 1–3 must be complete.

---

## Goal of Phase 4

Build the complete logged-in customer experience: order history, status tracking, addresses, wishlist (persisted), loyalty points, reviews. By the end of this phase:
- Customers have a full self-service account
- Wishlist persists to DB and survives logout
- Loyalty points earn on delivery and redeem at checkout (we already redeem; here we earn + display)
- Customers can submit reviews on delivered products
- Customers can manage their addresses and profile

---

## Tasks

### 1. Account Layout (`/account`)

- Sidebar navigation (sticky on desktop, top nav scroll on mobile):
  - Dashboard / Overview
  - Orders
  - Addresses
  - Wishlist
  - Loyalty Points
  - Reviews
  - Profile
  - Logout
- Active route highlighted with brand-accent indicator
- Mobile: hamburger menu or top tab strip
- Brand-styled layout — generous spacing, serif headings

### 2. Account Dashboard (`/account`)

- Welcome banner: "Hello, {firstName}" with a subtle decorative flourish
- KPI cards:
  - Total Orders (clickable to /account/orders)
  - Loyalty Points balance (clickable to /account/loyalty)
  - Wishlist count (clickable to /account/wishlist)
- "Recent Order" card showing latest order with status badge + quick view
- "Continue Shopping" CTA

### 3. Orders List (`/account/orders`)

- Filterable list: by status (all, awaiting payment, confirmed, in preparation, out for delivery, delivered, cancelled), date range, search by order number
- Each row: order number, date, items count + thumbnails, total, status badge, "View Details" button
- Pagination
- Empty state if no orders

### 4. Order Detail (`/account/orders/[orderNumber]`)

- **Status Timeline** (horizontal stepper or vertical timeline):
  - Placed → Confirmed → Baking → Out for Delivery (or Ready for Pickup) → Delivered
  - Cancelled appears as separate state
  - Each step has a timestamp when reached
- **Order Items** — full breakdown with customizations expanded (size, flavor, message, color, photo if uploaded as a small thumbnail with click-to-view, add-ons, special instructions)
- **Delivery / Pickup Info** — address, date, time slot, delivery zone
- **Payment Info** — method, status
- **Pricing breakdown** — subtotal, delivery fee, discounts, loyalty redeemed, tax, total
- **Actions**:
  - **Reorder** button (adds same items to cart with customizations preserved; warns if any product no longer available)
  - **Cancel Order** (only if status is `awaiting_payment` or `pending_confirmation`) — confirmation modal, reason dropdown, then reverses stock + coupon + loyalty
  - **Upload Bank Receipt** (only if bank transfer pending) — same uploader as in checkout
  - **Download Invoice** (PDF — generate on demand using `@react-pdf/renderer`)
  - **Contact Support** (WhatsApp click-to-chat with order number pre-filled in message)
- If delivered: **Write a Review** button per item

### 5. Addresses (`/account/addresses`)

- List of saved addresses with default badge
- Each card: label (Home, Office, etc.), recipient, phone, full address
- Edit / Delete / Set as Default actions
- "Add New Address" button → modal with address form (same fields as checkout)
- Empty state with CTA

### 6. Wishlist (`/account/wishlist`)

- Migrate Zustand wishlist (from Phase 2) to DB-backed:
  - On login, merge local wishlist with DB (avoid duplicates)
  - All wishlist mutations go through DB now (with optimistic UI)
- Grid view of wishlisted products
- Each card: same as catalog card + "Add to Cart" button + "Remove" (X) button
- Empty state with branded illustration + "Discover cakes" CTA
- Wishlist count in header updates live

### 7. Loyalty Points (`/account/loyalty`)

- **Current Balance** large display (e.g., "1,250 points = Rs. 625")
- Explanation card: earning rate, redemption rate, expiry policy (pulled from settings)
- **Transactions History**:
  - Table: date, type (Earn / Redeem / Bonus / Expire / Adjust), points, balance after, note
  - Filter by type
- **How it Works** section (engaging, brand-styled — earn on every order, special bonuses for first order/reviews/birthday)
- Note: loyalty earning happens automatically when an order is marked `delivered` by admin (handled in Phase 5 admin order status updates — earn rule: 1 point per Rs. 100 spent, configurable in settings)

### 8. Reviews (`/account/reviews`)

- List of reviews submitted by this customer
- Each: product name + thumbnail, rating, title, body, status (pending / approved / hidden), submitted date
- Edit (only if still pending) / Delete actions
- Empty state with "Browse your delivered orders" CTA

### 9. Review Submission

From order detail page, "Write a Review" button on each delivered item opens a modal:
- Star rating selector (1–5)
- Title (optional, max 80 chars)
- Body (textarea, max 1000 chars)
- Up to 3 image uploads
- Submit → creates review row with `status='pending'`
- Validation: only one review per `order_item_id` per user
- Toast confirmation: "Thanks! Your review will be visible after moderation."

Reviews on the public PDP only show those with `status='approved'`.

### 10. Profile (`/account/profile`)

- Editable form: name, email (verification required if changed), phone, password (current + new + confirm)
- "Save Changes" with confirmation
- Account deletion section (with strong warning, requires password confirmation, soft-deletes data per GDPR-style)

### 11. Stock & Availability Updates

- When viewing wishlist or reorder, check each product's current `is_published` and stock
- Show "No longer available" badge with disabled CTA where applicable

### 12. Header Updates

- Wishlist count badge updates live (subscribe to wishlist store)
- Cart count already wired in Phase 3
- User icon shows initials avatar when logged in; click opens dropdown (Account, Orders, Wishlist, Logout)
- Mobile: same items in slide-in menu

### 13. Loyalty Earn Logic (Trigger)

When an order moves to `delivered` status (admin will set this in Phase 5):
- Calculate earned points = `floor(order.total / earn_rate)` (rate from settings)
- Insert `loyalty_transactions` row with `type='earn'`, `expires_at = now + 12 months`
- Update `users.loyalty_points` (add)
- This logic lives in a Server Action that admin's order-status-update calls in Phase 5; here in Phase 4 we just stub the function ready to use.

Also handle:
- On order cancellation after points earned: subtract points (with `type='adjust'`)
- On loyalty redemption (already done in checkout): we already created a `redeem` transaction in Phase 3 — make sure that's correct

### 14. Empty States, Loading States, Error States

Every account sub-page needs all three states, branded.

### 15. Quality Checks

- All routes protected (redirect to login if not authenticated)
- RLS prevents access to other users' data
- Mobile experience polished
- Skeleton loaders match brand
- No console errors

---

## Phase 4 Completion Checklist

- [ ] Account dashboard renders with correct KPIs
- [ ] Orders list filters + paginates correctly
- [ ] Order detail page shows full info with status timeline
- [ ] Reorder works (adds items back with customizations)
- [ ] Cancel order works only for valid statuses + reverses stock/coupons/loyalty
- [ ] Invoice PDF download works
- [ ] Addresses CRUD fully functional
- [ ] Wishlist persists to DB, syncs across devices
- [ ] Local wishlist merges with DB on login
- [ ] Loyalty page shows balance + transaction history
- [ ] Review submission works with image upload
- [ ] Customer can only review delivered products they purchased
- [ ] Profile editing works with email re-verification
- [ ] Wishlist + cart counts in header live-update
- [ ] All RLS policies tested — cross-account access blocked
- [ ] No TypeScript errors, no console errors
- [ ] Mobile experience polished

Ready for **Phase 5: Admin Panel**.
