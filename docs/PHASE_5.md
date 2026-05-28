# Phase 5: Admin Panel

> **Read `MASTER_SPEC.md` first.** Phases 1–4 must be complete.

---

## Goal of Phase 5

Build the complete admin dashboard for managing the entire shop. By the end of this phase, the admin has full control over: products, orders, customers, inquiries, coupons, banners, delivery zones, time slots, reviews, loyalty settings, and shop settings.

The admin panel should feel like a **professional SaaS dashboard** — clean, dense (where helpful), with great UX for repetitive tasks. Not as ornamental as the customer storefront. Use a refined, slightly more utilitarian design — neutral tones, clear typography, sharp data tables, but still consistent with the brand.

---

## Tasks

### 1. Admin Shell (`/admin`)

- **Sidebar** (collapsible on mobile):
  - Logo at top (links to /admin)
  - Nav items with icons:
    - Dashboard
    - Orders (with count badge for new/pending)
    - Products
    - Categories
    - Add-Ons
    - Customers
    - Custom Inquiries (badge)
    - Payments Pending (badge for bank transfers awaiting review)
    - Coupons
    - Banners
    - Delivery Zones
    - Schedule (time slots + holidays)
    - Reviews (badge for pending)
    - Loyalty
    - Settings
    - Activity Logs
  - Bottom: admin profile + logout
- **Top bar**: page title, search (global search across products/orders/customers), notifications icon, admin avatar
- Middleware enforces `role='admin'`; non-admins redirected to homepage with toast

### 2. Admin Dashboard (`/admin`)

- KPI cards (top row):
  - Today's Revenue (Rs. LKR formatted) + percentage vs yesterday
  - Today's Orders count + comparison
  - Pending Orders (count)
  - Low Stock (count)
- **Revenue Chart** (Recharts area chart): last 30 days default, toggle to 7d / 90d / 12mo
- **Top Selling Cakes** (last 30d, table or bar chart, top 10)
- **Orders by Status** donut chart
- **Recent Orders** table (last 10) with quick status-update dropdown per row
- **Pending Items** strip: custom inquiries count, bank transfer approvals count, pending reviews count — each clickable

### 3. Products (`/admin/products`)

**List view:**
- Data table with: checkbox (bulk), thumbnail, name, category, base price, stock indicator, published toggle, featured badge, actions menu (Edit, Duplicate, Delete)
- Filters: category, published, featured, low stock, search by name/SKU
- Sort by name, price, created, updated
- Pagination with per-page selector
- Bulk actions: delete, set published, set featured

**Create / Edit page (`/admin/products/new` and `/admin/products/[id]/edit`):**

Multi-section form (tabbed or stacked):

1. **Basic Info**
   - Name (required)
   - Slug (auto from name, editable)
   - Category (dropdown, required)
   - Short description
   - Description (rich text editor — TipTap or similar)
   - Ingredients (textarea or list)
   - Allergens (multi-select tags)

2. **Images** (multi-upload)
   - Drag-drop uploader (uppy.io or react-dropzone) → uploads to Supabase Storage
   - Reorder via drag (use `dnd-kit`)
   - Set primary image
   - Delete individual images
   - Alt text per image

3. **Pricing & Sizes**
   - Base price (required)
   - Repeatable size rows: label, weight (kg), price (this is the absolute price for this size, not a modifier)
   - Add/remove size rows

4. **Customization Options**
   - **Shapes**: multi-select (Round / Square / Heart / Custom)
   - **Flavors**: repeatable rows — name + price modifier (defaults 0)
   - **Tier Options**: repeatable rows — tier count (1, 2, 3) + price modifier
   - **Dietary Options**: repeatable rows — type (eggless / vegan / gluten_free) + price modifier
   - Toggle: Allow Message (max chars input)
   - Toggle: Allow Color Theme
   - Toggle: Allow Photo Upload

5. **Add-Ons**
   - Multi-select from global add-ons library (with search)
   - Drag to reorder display

6. **Stock**
   - Toggle: Track stock
   - If tracked: current stock, low stock threshold

7. **Display & Status**
   - Published toggle
   - Featured toggle
   - Bestseller toggle

8. **SEO**
   - Meta title (with character counter, target ~60)
   - Meta description (~155)

- Sticky "Save" / "Save & Publish" / "Discard" footer
- Validation errors highlighted per section
- Unsaved changes warning on navigation

**Delete:** confirmation modal warning that deletion is permanent; check for existing order references — soft delete if any exist (set `is_published=false` and a `deleted_at` timestamp); otherwise hard delete.

### 4. Categories (`/admin/categories`)

- Simple table + create/edit modal
- Fields: name, slug, description, image (single upload), display order, is_active
- Drag to reorder

### 5. Add-Ons Library (`/admin/addons`)

- Grid view with thumbnail, name, price, stock indicator, active toggle, edit/delete
- Create/edit modal with: name, description, image, price, stock toggle, stock qty, is_active

### 6. Orders (`/admin/orders`)

**List view:**
- Table: order number, customer name + phone (with click-to-call/WhatsApp icons), date, items count, total, payment method, payment status, order status, actions
- Status badges with semantic colors
- Filters:
  - Status (multi-select)
  - Payment method
  - Payment status
  - Date range
  - Fulfillment type (delivery/pickup)
  - Search (order number, customer name, phone, email)
- Sort by date, total, etc.
- Quick status update inline
- Bulk actions: status update, mark paid, export CSV
- Pagination (50 per page default, configurable)

**Order Detail (`/admin/orders/[orderNumber]`):**

Left column (~70%):
- **Header**: order number, status badge, payment status badge, created date
- **Status Timeline** (vertical) with timestamps; admin can advance to next status via buttons (or set to any status via dropdown). Each status change creates a row in `order_status_history` with the admin's user_id.
- **Items** — full breakdown:
  - For each item: image, name, quantity, customizations expanded:
    - Size, shape, flavor, tier, dietary
    - Cake message (highlighted in a styled box)
    - Color theme
    - Photo cake reference (click to view full)
    - Add-ons
    - Special instructions (highlighted)
    - Unit price + line total
- **Pricing**: subtotal, delivery fee, discount + coupon code, loyalty redeemed, tax, total
- **Internal Notes** (admin-only): textarea + add note button, list of notes with admin name + timestamp

Right column (~30%, sticky):
- **Customer**: name, phone (click to call / WhatsApp message templated with order info), email (mailto), "View Customer Profile" link
- **Fulfillment**:
  - Delivery / Pickup
  - Address (with map link)
  - Delivery zone, fee
  - Date + time slot
- **Payment**:
  - Method
  - Status
  - If bank transfer: receipt image (click to enlarge), Approve / Reject buttons (only if status is pending review)
  - If PayHere: gateway transaction ID + raw response JSON (collapsible)
- **Action Buttons**:
  - Print Invoice (opens print-optimized page)
  - Print Kitchen Ticket (simplified production sheet: customer phone, items with sizes/customizations bold, special instructions highlighted, delivery time)
  - Send Status Update via WhatsApp (Phase 6 will wire actual sending — for now disable or stub)
  - Refund (only if paid online)
  - Cancel Order (with reason)

### 7. Customers (`/admin/customers`)

**List view:**
- Table: name, phone, email, registration date, total orders, lifetime value, last order date, status (active / blocked), actions
- Filters: registration date range, has orders, blocked status
- Search
- Sort by lifetime value, last order, registration

**Customer Detail (`/admin/customers/[id]`):**
- Profile section (name, email, phone, registration date)
- KPIs: total orders, total spent, AOV, loyalty balance
- Tabs:
  - Orders (full list with status, click to view)
  - Addresses (read-only)
  - Reviews
  - Loyalty Transactions
  - Notes (admin-only)
- Actions: Edit profile, Block/Unblock, Adjust Loyalty Points (with reason), Send WhatsApp Message (templated)

**Manual Customer Creation** (for walk-ins or admin-created accounts):
- "Add Customer" button → modal with name, email, phone, optional address, send invite toggle
- Generates a temporary password emailed to customer (if invite enabled)

### 8. Custom Inquiries (`/admin/inquiries`)

- List view with status badges (new, in-progress, quoted, accepted, rejected, completed)
- Filter by status, date range
- Detail page:
  - Customer info
  - Event details: date, occasion, servings, budget range
  - Description
  - Reference images (gallery)
  - Special requirements
  - Internal notes
  - **Quote section**:
    - Internal price calculation (line items or single amount)
    - Customer-facing message (rich text)
    - "Send Quote" button → generates a unique payment link (token-based URL like `/quote/[token]`) and triggers email + WhatsApp (Phase 6) — for now save the link and we can copy it manually
  - **Convert to Order** button (after acceptance): creates an order with custom line item, opens edit flow
  - Status update controls

### 9. Payments Pending (`/admin/payments/pending`)

- List of orders with `payment_status = 'pending_transfer'` AND a receipt uploaded
- Each shows: order number, customer, amount, uploaded date, receipt thumbnail
- Click to view full receipt image
- Approve / Reject buttons:
  - Approve → sets `payment_status='paid'`, advances order to `confirmed`, logs in activity
  - Reject → opens reason modal, sets receipt `status='rejected'`, payment still `pending_transfer`, customer can re-upload

### 10. Coupons (`/admin/coupons`)

**List view:** code, type, value, usage count / limit, validity dates, active toggle, actions

**Create/Edit:**
- Code (uppercase, alphanumeric only)
- Type: % off / flat off / free delivery
- Value (e.g., 10% or Rs. 500)
- Min order amount
- Max discount cap (for % off)
- Usage limit total
- Usage limit per customer
- Valid from / valid until (date pickers)
- Applies to: all products / specific categories / specific products (selector)
- Active toggle

Usage history view per coupon.

### 11. Banners / Sliders (`/admin/banners`)

- Manage homepage hero slides
- List with thumbnails, headline, position, active dates
- Create/edit: image, headline, sub-headline, CTA text, CTA link, position (hero / promo strip), display order, valid from, valid until, is_active
- Drag to reorder

### 12. Delivery Zones (`/admin/delivery-zones`)

- Table: name, fee, est time, min order, same-day surcharge, active, actions
- Create/edit modal with all fields
- Reorder

### 13. Schedule (`/admin/schedule`)

Tabs:
- **Time Slots**: list + create/edit (label, start time, end time, capacity, active)
- **Holidays**: calendar view + add holiday (date + label). Disabled dates for customer checkout.
- **Lead Times**: global minimum lead time setting (hours) + per-category overrides

### 14. Reviews Moderation (`/admin/reviews`)

- Tabs: All / Pending / Approved / Hidden
- Table: product, customer, rating, title, body preview, submitted date, status, actions
- Click to view full review (with images)
- Approve, Hide, Delete
- Admin reply (optional, shows on public PDP under the review)

### 15. Loyalty Settings (`/admin/loyalty`)

- Settings form:
  - Earning rate (e.g., 1 point per Rs. 100)
  - Redemption rate (e.g., 100 points = Rs. 50)
  - Max redemption % per order
  - Bonus: welcome bonus (one-time), birthday bonus, review bonus (per approved review)
  - Expiry (months)
- Stats: total points issued, redeemed, expired, current outstanding
- Manual adjustment tool (for goodwill / refunds)

### 16. Settings (`/admin/settings`)

Tabs:
- **Shop Info**: name, tagline, logo upload, address, phone, WhatsApp number, email, business hours, social links
- **Tax**: rate, inclusive/exclusive
- **Payment**:
  - PayHere merchant ID + secret + mode (sandbox/live)
  - Bank account details (name, account name, account number, branch, swift)
  - COD: enable/disable, min/max order amount
- **Notifications** (will be wired in Phase 6 — just create the UI shell):
  - Email enable toggle
  - WhatsApp enable toggle
  - Template management (placeholders for each event)
- **SEO**: site title, default meta description, OG default image
- **Maintenance Mode**: toggle (when on, customer side shows a branded "back soon" page; admin still works)

### 17. Activity Logs (`/admin/logs`)

- Table: timestamp, admin user, action, target (with link if applicable), metadata preview
- Filters: admin user, action type, date range
- Sort by timestamp desc
- Pagination

All admin write operations should create activity log entries.

### 18. Hooking Loyalty Earn Logic

When admin sets order status to `delivered`:
- Trigger the loyalty earn function from Phase 4 (calculate points, insert transaction, update user balance)
- Show admin a toast: "Customer earned X loyalty points"

When admin cancels an already-delivered order (rare edge case):
- Reverse the earned points

### 19. Print Layouts

Create dedicated print-only pages:
- `/admin/orders/[orderNumber]/print/invoice` — clean A4 invoice with logo, business info, customer, items, totals, footer
- `/admin/orders/[orderNumber]/print/kitchen-ticket` — simplified production sheet: large fonts, customizations emphasized, special instructions and cake message in boxes

Use `@media print` CSS to hide UI chrome on these pages.

### 20. Global Admin Search

Top-bar search (cmd+K friendly):
- Searches products, orders (by order number, customer name, phone), customers
- Modal with quick-jump results
- Keyboard navigation

### 21. Quality

- All admin actions write activity logs
- All mutations confirm before destructive actions
- Inline validation everywhere
- Optimistic updates where safe (status changes), rollback on error
- Pagination + search + filter URL state preserved
- Mobile-responsive admin (down to tablet 768px at minimum — phones acceptable but not the primary target)

---

## Phase 5 Completion Checklist

- [ ] Admin login redirects to /admin dashboard
- [ ] Non-admins cannot access /admin/* (middleware + RLS)
- [ ] Dashboard KPIs and charts render with real data
- [ ] Products CRUD complete with multi-image upload + reorder + all customization options
- [ ] Categories CRUD with reorder
- [ ] Add-ons CRUD
- [ ] Orders list with all filters + bulk actions
- [ ] Order detail with full info, customization expanded, status timeline editable
- [ ] Invoice + kitchen ticket print pages work
- [ ] Bank transfer approval flow works (approve/reject with reason)
- [ ] Customers CRUD + detail view
- [ ] Manual customer creation works
- [ ] Custom inquiries: review, quote, payment link generation, convert to order
- [ ] Coupons CRUD with usage tracking
- [ ] Banners CRUD with reorder
- [ ] Delivery zones CRUD
- [ ] Time slots + holidays + lead times manageable
- [ ] Reviews moderation works (approve, hide, delete, reply)
- [ ] Loyalty settings save and apply to earn/redeem logic
- [ ] Manual loyalty adjustment works
- [ ] Settings tabs save correctly
- [ ] Activity logs populate on every admin action
- [ ] Loyalty points earn correctly when order marked delivered
- [ ] Global admin search works
- [ ] Mobile/tablet admin layout works
- [ ] No TypeScript errors, no console errors

Ready for **Phase 6: Notifications, Polish & Launch**.
