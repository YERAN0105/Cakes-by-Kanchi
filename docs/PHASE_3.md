# Phase 3: Cart, Checkout & Orders

> **Read `MASTER_SPEC.md` first.** Phases 1 and 2 must be complete.

---

## Goal of Phase 3

Customers can fully purchase cakes — from adding to cart, through customization and checkout, paying via PayHere or bank transfer or COD, and receiving a confirmed order. By the end of this phase:
- Cart works end-to-end (drawer + full page) with customizations preserved
- Checkout works for both guest and logged-in users
- Both delivery and pickup flows function
- All three payment methods work: PayHere (sandbox), Bank Transfer (with receipt upload), COD
- Orders are created in the database with proper status flow
- Customers see an order confirmation page

> **Notifications (email/WhatsApp) are NOT in this phase.** Just create the orders. Phase 6 wires notifications.

---

## Tasks

### 1. Cart State (Zustand)

Create `stores/cart.ts`:
- Items array with: product reference, snapshot (name, image, base price), customization (full structured object from PDP), unit_price (calculated), quantity, line_total
- Methods: `addItem`, `removeItem`, `updateQuantity`, `updateCustomization`, `clearCart`, `getSubtotal`
- Persist in `localStorage` (using zustand persist middleware)
- Hydrate carefully to avoid SSR mismatch (only render cart contents after hydration)
- Apply coupon state: `appliedCoupon` (with id, code, discount calculation)
- Cart count derived selector for header badge

### 2. Wire "Add to Cart" on PDP

- Validate customization (Zod)
- Upload photo cake image to Supabase Storage if present (before adding to cart). Store URL in customization object.
- Calculate `unit_price` server-side via Server Action (recompute base + modifiers — never trust client price). Return validated price.
- Add to cart store
- Show success toast with "View Cart" CTA + open cart drawer briefly
- Animate cart icon (subtle pulse/bounce)

### 3. Cart Drawer

- Slide-in from right (Framer Motion)
- Lists items with:
  - Thumbnail
  - Name
  - Customization summary (small text — size, flavor, etc.)
  - Quantity controls
  - Line total
  - Remove (X) button
- Subtotal at bottom
- "View Full Cart" + "Checkout" buttons
- Empty state: branded illustration + "Start Browsing" CTA
- Closes on backdrop click or ESC

### 4. Full Cart Page (`/cart`)

- Two columns desktop:
  - **Left:** Detailed cart items list with all customizations expanded (read-only summary, with edit link → reopens product page with selections pre-filled), thumbnail, quantity controls, remove
  - **Right:** Summary card
    - Subtotal
    - Coupon code input + Apply button → server validates → shows applied discount with X to remove
    - Delivery fee row (shows "Calculated at checkout" until checkout)
    - Total
    - "Proceed to Checkout" button (primary)
- Mobile: single column, summary card sticks to bottom
- Empty state: large branded illustration, "Browse our cakes" CTA
- Show low-stock warning if any item's stock is below threshold

### 5. Checkout (`/checkout`)

Single-page checkout with collapsible sections (clean, premium feel):

#### Section 1: Contact
- If logged in: shows name + email + phone (editable inline)
- If guest: form with name, email, phone (with +94 validation), optional "Create an account" checkbox (creates account on order placement)
- Login link for existing users

#### Section 2: Fulfillment Type
- Radio cards: **Delivery** / **Pickup**
- On selection, reveals relevant fields

#### Section 3a: Delivery (if selected)
- If logged in and has saved addresses → list with radio selection + "Add new address" option
- Otherwise: address form (label, recipient name, phone, line 1, line 2, city, postal code)
- "Save this address" checkbox (only if logged in)
- **Delivery zone dropdown** (loaded from `delivery_zones` table) → automatically displays fee
- Delivery date picker:
  - Calendar (react-day-picker), branded
  - Disables: dates before min lead time (default 24h), holidays (from `holidays` table), past dates
  - Highlights today
- Time slot picker:
  - Loaded from `time_slots` table
  - Shows remaining capacity (e.g., "3 slots left") — disabled if full
- Order note for delivery driver (optional textarea)

#### Section 3b: Pickup (if selected)
- Show shop address card with embedded map (use a static OpenStreetMap image or Google Maps embed)
- Pickup date picker (same logic as delivery)
- Pickup time slot picker
- No delivery fee applied

#### Section 4: Payment Method
- Radio cards:
  - **Pay Online (PayHere)** — primary, recommended badge
  - **Bank Transfer** — with note "Upload receipt after order"
  - **Cash on Delivery** — only show if delivery selected; gray-out if order total exceeds configured COD limit
- Each card shows brief description + relevant icons

#### Section 5: Order Summary (sticky right sidebar on desktop, bottom drawer on mobile)
- Itemized list (compact)
- Subtotal
- Delivery fee (live, updates with zone selection)
- Discount (if coupon applied)
- Loyalty points redeem field (if logged in and has points) — input box accepting points to redeem with live discount calculation respecting max redemption %
- Tax (if configured)
- **Total** (large)
- "Place Order" button (large, primary, disabled until all required sections valid)
- Reassurance text below: secure payment icons, money-back guarantee, freshness guarantee

#### Validation
- All Zod-validated
- Inline error messages
- Cannot proceed unless: contact valid, fulfillment valid, payment method selected, valid date/slot selected, lead time satisfied
- If cart is empty: redirect to `/cart`

### 6. Order Placement Logic (Server Action)

Build a robust Server Action `createOrder(payload)`:

1. **Validate** payload server-side via Zod
2. **Re-fetch** product data and recalculate all prices (never trust client-sent prices)
3. **Validate coupon** (if any) — check eligibility, usage limits, dates, min order
4. **Validate slot capacity** — atomic check + decrement
5. **Calculate**:
   - subtotal (sum of line totals)
   - delivery_fee (from zone or 0 for pickup)
   - discount (coupon + loyalty)
   - tax (per settings)
   - total
6. **Generate** unique order number (e.g., `CKR-{YYYYMMDD}-{6 random chars}`)
7. **Create** order row + order_items rows (with full snapshot + customization JSONB)
8. **Set status**:
   - PayHere: `payment_status = 'pending'`, `order_status = 'awaiting_payment'`
   - Bank Transfer: `payment_status = 'pending_transfer'`, `order_status = 'awaiting_payment'`
   - COD: `payment_status = 'cod'`, `order_status = 'pending_confirmation'`
9. **Save address snapshot** as JSONB on order
10. **Record coupon usage** if applied
11. **Reserve loyalty points** redeemed (log a redeem transaction; reverse it on cancellation)
12. **Decrement product stock** if `stock_tracked`
13. **Return** order number + redirect URL based on payment method
14. **Clear cart** (client-side after navigation)

Run all DB mutations inside a single transaction or with proper rollback logic.

### 7. PayHere Integration

Reference https://www.payhere.lk/developers/

- Create `lib/payments/payhere.ts` with:
  - `generateCheckoutParams(order)` — returns object with `merchant_id`, `return_url`, `cancel_url`, `notify_url`, `order_id`, `items`, `currency`, `amount`, `first_name`, `last_name`, `email`, `phone`, `address`, `city`, `country`, plus the required `hash` (MD5 per PayHere spec)
  - `verifyNotification(payload)` — MD5 verification of webhook signature
- Build a checkout-redirect page: `/checkout/pay/[orderNumber]` that auto-submits a form to PayHere's hosted checkout URL using the generated params
- Build webhook handler: `app/api/payments/payhere/webhook/route.ts`
  - Verify signature
  - Map PayHere status codes (2 = paid, 0 = pending, -1 = cancelled, -2 = failed, -3 = chargedback)
  - Update `payment_status` and `order_status` accordingly
  - Insert `payments` row with raw response in JSONB
  - On success → progress order to `confirmed`
  - Return 200 always
- Build return/cancel URLs to land back on `/order-success/[orderNumber]` or `/checkout/failed/[orderNumber]`
- Use **sandbox** mode in dev (env var `PAYHERE_MODE=sandbox`)

### 8. Bank Transfer Flow

- After order placement with bank transfer, redirect to `/order-success/[orderNumber]`
- Order success page shows:
  - Order confirmed message (with note: "Pending payment verification")
  - Bank account details (from settings: bank name, account name, account number, branch)
  - **Receipt upload zone** — drag-drop file input, jpg/png/pdf, max 5MB
  - On upload: file → Supabase Storage, row in `bank_transfer_receipts`, order's `payment_status` stays `pending_transfer` but a flag indicates "receipt uploaded, awaiting review"
  - If they don't upload now, they can later from `/account/orders/[orderNumber]`

### 9. COD Flow

- After order placement with COD, redirect to `/order-success/[orderNumber]`
- Show "Order placed — pending confirmation" message
- Explain that admin will confirm by phone soon
- No further customer action needed

### 10. Order Success Page (`/order-success/[orderNumber]`)

- Large success animation (subtle checkmark with brand styling)
- Order number prominently displayed
- Order summary (compact)
- Delivery / pickup details
- Payment method + status
- Next steps section (varies by payment method)
- Buttons: "View Order" (if logged in, links to /account/orders/[number]) / "Continue Shopping"
- For guest checkout: show a "track order" link with a secure token (no login required for that specific order)

Use signed URL pattern for guest order access: token = HMAC of order_number, validated server-side.

### 11. Guest Order Tracking (`/orders/track`)

- Public page where guests can look up their order with order number + email/phone
- Shows order detail with status timeline (read-only)

### 12. Error Handling

- Stock depleted mid-checkout → friendly error, return to cart
- Slot full mid-checkout → friendly error, ask to choose another slot
- Coupon expired → toast + auto-remove from cart
- PayHere webhook failures → log to `payments.raw_response` for debugging, alert admin (manual review)
- Network errors → retry-able UI

### 13. Quality

- All forms accessible (label associations, error announcements)
- Mobile checkout is silky smooth (no awkward jumps when sections expand)
- Loading states on every async action
- Disable Place Order button while submitting (with spinner)
- Toast notifications consistent across the app

---

## Phase 3 Completion Checklist

- [ ] Cart store persists across reloads
- [ ] Add to cart from PDP works with full customization preserved
- [ ] Cart drawer + full cart page both polished
- [ ] Coupon application works (apply, validate, remove)
- [ ] Checkout flow works for guest and logged-in users
- [ ] Delivery zone fees calculate correctly
- [ ] Date picker blocks out lead time + holidays
- [ ] Time slot capacity enforcement works (try placing > capacity orders)
- [ ] PayHere sandbox payment completes end-to-end and updates order to paid
- [ ] PayHere webhook handles success, failure, and cancel
- [ ] Bank transfer flow: order created, receipt uploads to storage
- [ ] COD flow: order created with pending_confirmation status
- [ ] Order success page renders correctly for all three payment methods
- [ ] Guest order tracking works via order number + email lookup
- [ ] Stock decrements on order placement; coupon usage records
- [ ] Server-side price recalculation prevents client tampering
- [ ] All mobile flows work without issues
- [ ] No TypeScript errors, no console errors
- [ ] Lighthouse on checkout: Performance 80+, Accessibility 95+

Ready for **Phase 4: Customer Account**.
