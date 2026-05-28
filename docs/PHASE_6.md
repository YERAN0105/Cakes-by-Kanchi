# Phase 6: Notifications, Polish & Launch

> **Read `MASTER_SPEC.md` first.** Phases 1–5 must be complete.

---

## Goal of Phase 6

Wire all notifications (Email + WhatsApp), complete the custom inquiry payment-link flow, polish the entire app, and deploy to production. By the end of this phase the project is launch-ready.

---

## Tasks

### 1. Email Setup (Resend)

- Install `resend` and `@react-email/components`
- Create `lib/notifications/email.ts` with a typed `sendEmail({ to, subject, react, replyTo? })` wrapper
- Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` env vars
- Use Resend's React Email components for templates

### 2. WhatsApp Setup (Cloud API)

- Reference: https://developers.facebook.com/docs/whatsapp/cloud-api
- Set up Meta Business Account, WhatsApp Business App, phone number (or test number for dev)
- Register message templates with Meta (each one needs approval — start this process EARLY in this phase; takes up to 24h):
  - `order_confirmation` (variables: name, order_number, total, delivery_date)
  - `payment_received` (variables: name, order_number)
  - `order_confirmed` (variables: name, order_number)
  - `order_preparation` (variables: name, order_number)
  - `out_for_delivery` (variables: name, order_number, delivery_window)
  - `ready_for_pickup` (variables: name, order_number, pickup_window)
  - `order_delivered` (variables: name, order_number)
  - `order_cancelled` (variables: name, order_number, reason)
  - `bank_receipt_rejected` (variables: name, order_number, reason)
  - `review_request` (variables: name, order_number)
  - `custom_inquiry_received` (variables: name)
  - `custom_inquiry_quote` (variables: name, amount, payment_link, expiry)
  - `welcome` (variables: name)
- Create `lib/notifications/whatsapp.ts`:
  - Function `sendWhatsAppTemplate({ to, templateName, languageCode='en', components })` posts to `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`
  - Auth via `WHATSAPP_ACCESS_TOKEN`
  - E.164 phone validation utility (`+94XXXXXXXXX`)
  - Robust error handling — log failures but don't throw
- Webhook for delivery receipts: `app/api/whatsapp/webhook/route.ts` — verify `WHATSAPP_VERIFY_TOKEN`, log delivery status to DB

### 3. Notification Orchestrator

Create `lib/notifications/index.ts`:

```typescript
type NotificationEvent =
  | 'order_placed' | 'payment_received' | 'order_confirmed'
  | 'order_in_preparation' | 'out_for_delivery' | 'ready_for_pickup'
  | 'order_delivered' | 'order_cancelled' | 'bank_receipt_rejected'
  | 'review_request' | 'custom_inquiry_received' | 'custom_inquiry_quote'
  | 'welcome';

export async function notify(event: NotificationEvent, payload: any) {
  // 1. Load settings (email enabled? whatsapp enabled?)
  // 2. Fan out to handlers
  // 3. Each handler is fire-and-forget with try/catch + DB log
  // 4. Return immediately so user flow isn't blocked
}
```

- Implement each event handler
- Use `Promise.allSettled` + log failures
- Store notification log in a `notification_logs` table (add this to schema): event, channel, recipient, status, error, payload, sent_at
- Idempotency: a `notification_idempotency_key` (e.g., `order_id + event`) prevents duplicates on retries

### 4. Wire Notifications into Existing Flows

- **Phase 1**: signup → `welcome` email + WhatsApp
- **Phase 3**: order placed → `order_placed`; PayHere paid webhook → `payment_received`
- **Phase 3**: bank receipt rejected (admin action in Phase 5) → `bank_receipt_rejected`
- **Phase 5**: admin status transitions:
  - `confirmed` → `order_confirmed`
  - `in_preparation` → `order_in_preparation`
  - `out_for_delivery` → `out_for_delivery`
  - `ready_for_pickup` → `ready_for_pickup`
  - `delivered` → `order_delivered` + schedule `review_request` for 2 days later
  - `cancelled` → `order_cancelled` (with reason)
- **Phase 5**: custom inquiry submitted (customer-side, this phase to set up) → admin alert (email to shop email) + customer ack
- **Phase 5**: quote sent → `custom_inquiry_quote` with payment link

### 5. Scheduled Notifications (Review Request)

For `review_request` 2 days after delivery, you have two options:
- **Simple:** Vercel Cron job daily at e.g. 10am that queries orders delivered exactly 2 days ago and fires the notification
- **Robust:** Use Supabase pg_cron or a dedicated queue (Inngest, Trigger.dev). For v1, Vercel Cron is fine.

Implement Vercel Cron in `app/api/cron/review-requests/route.ts` and configure in `vercel.json`.

### 6. Custom Inquiry → Payment Link Flow

- Admin sends quote → generate unique token (UUID + HMAC), store on `custom_inquiries` row
- Customer receives WhatsApp + email with link `https://yourdomain.com/quote/[token]`
- Public `/quote/[token]` page:
  - Validates token
  - Shows quote details: inquiry summary, line items, quote message, total, expiry date (default 7 days)
  - "Accept & Pay" button → routes through a custom mini-checkout
  - On payment success → creates a full `orders` row linked to the inquiry, sets `converted_order_id`
- Same payment options (PayHere, bank transfer, COD) apply
- Expired or already-paid links show a friendly message

### 7. Notification Template Editor (Admin Settings)

In the Admin Settings → Notifications tab built in Phase 5:
- For each event, allow editing the email subject + body (markdown editor with placeholder pickers)
- WhatsApp templates are immutable (set in Meta dashboard), but show the template content + variable list for reference
- Per-event enable/disable toggle (email + WhatsApp independently)

### 8. SEO Pass

- Generate `sitemap.xml` via `next-sitemap` or built-in Next.js sitemap
- Generate `robots.txt`
- Add structured data:
  - **Organization** schema on every page
  - **Product** schema on PDPs (already in Phase 2, verify)
  - **BreadcrumbList** schema on PDPs and category pages
  - **WebSite** with `SearchAction` on homepage
- Verify all dynamic pages have proper metadata
- OG image: design a branded default OG image; per-product OG uses main product image
- Add Google verification meta tag config
- Submit to Google Search Console manually post-deploy

### 9. Performance Pass

- Audit bundle size: remove unused imports, lazy-load heavy components
- Image audit: ensure every image has correct `sizes` attribute and proper aspect ratio
- Font optimization: subset, preload critical fonts
- Add `next/dynamic` for non-critical client components (e.g., the rich text editor in admin)
- Database query optimization: add missing indexes, use `select` to fetch only needed columns
- Implement ISR or static generation where possible (e.g., About, FAQ pages)
- Cache headers on API routes
- Lighthouse targets:
  - Homepage: 90+ all categories
  - PDP: 85+ Performance, 95+ others
  - Checkout: 80+ Performance, 95+ others
  - Admin: 75+ Performance (admin can be heavier), 90+ others

### 10. Accessibility Pass

- Run axe DevTools on all major pages
- Fix all violations
- Keyboard test every flow (no mouse)
- Screen reader test on signup, checkout, account dashboard
- Ensure all images have meaningful `alt`
- Color contrast: verify all text passes WCAG AA (4.5:1 normal, 3:1 large)
- Focus management: modals trap focus, return focus on close
- Skip-to-content link in storefront layout

### 11. Animation Polish Pass

- Smooth page transitions (Framer Motion `AnimatePresence`)
- Stagger animations on lists
- Cake card hover refinement
- Add-to-cart success: brief floating thumbnail animation flying into cart icon
- Loading skeletons match real layouts
- Toast notifications: branded, animated entrance/exit
- Respect `prefers-reduced-motion` everywhere

### 12. Final Polish

- Empty states everywhere (catalog, search, wishlist, orders, admin tables)
- Error states with retry CTAs
- 404 + 500 pages branded
- Favicon set (multiple sizes, including PWA icon)
- `manifest.json` for PWA-installability (basic)
- Cookie consent banner (if needed for SL — generally not required but good practice)
- Newsletter signup wired (collect into `newsletter_subscribers`, send welcome email)
- Contact form wired (sends to shop email)
- Final mobile QA: every page tested on actual mobile or 375px viewport
- Final cross-browser test: Chrome, Safari, Firefox

### 13. Deployment

- Push to GitHub
- Connect Vercel project
- Set all production env vars (real Supabase project URL/keys, PayHere live credentials, Resend prod key, WhatsApp prod credentials)
- Configure custom domain + SSL
- Configure Vercel Analytics + Web Analytics
- Test PayHere in live mode with a real small transaction (then refund)
- Test WhatsApp templates fire correctly with real numbers
- Run final Lighthouse on production URL
- Submit sitemap to Google Search Console
- Set up Vercel Cron for review requests

### 14. Documentation

Create / finalize:
- **README.md**: setup, env vars, migrations, seed, dev commands, deployment
- **docs/ADMIN_GUIDE.md**: how to add products, manage orders, handle inquiries, configure settings — written for a non-technical shop owner
- **docs/PAYHERE_SETUP.md**: step-by-step for PayHere merchant onboarding
- **docs/WHATSAPP_SETUP.md**: Meta Business setup, template approval, phone verification
- **docs/SUPABASE_SETUP.md**: project creation, RLS notes, storage buckets

### 15. Launch Checklist

- [ ] All Phase 1–5 features verified working in production
- [ ] All env vars set in Vercel (prod)
- [ ] Custom domain live with SSL
- [ ] Supabase production project provisioned and migrated
- [ ] PayHere live mode tested with real transaction
- [ ] WhatsApp templates all approved by Meta
- [ ] Email sending verified (check spam folders — set up SPF/DKIM)
- [ ] Sitemap submitted to Google Search Console
- [ ] Admin user created in production with secure password
- [ ] Initial products + categories seeded or migrated by admin
- [ ] Banner content set
- [ ] Delivery zones + time slots configured
- [ ] Settings configured: shop info, tax, payment keys, notification toggles
- [ ] Test order placed end-to-end on production
- [ ] Privacy policy + T&C reviewed for SL compliance
- [ ] Backup strategy in place (Supabase automatic backups verified)
- [ ] Error monitoring set up (Sentry recommended — free tier sufficient)
- [ ] Analytics tracking verified

---

## Phase 6 Completion Checklist

- [ ] All notification triggers fire correctly via email + WhatsApp
- [ ] Notification logs visible in DB
- [ ] Idempotency prevents duplicate notifications
- [ ] Review request cron fires daily for orders delivered 2 days ago
- [ ] Custom inquiry quote → payment link → order conversion flow complete
- [ ] SEO: sitemap, robots, structured data verified
- [ ] Lighthouse targets met on key pages
- [ ] Accessibility: axe shows no critical violations
- [ ] Animation polish complete, `prefers-reduced-motion` respected
- [ ] Deployment to Vercel successful with custom domain
- [ ] Documentation written
- [ ] Launch checklist fully ticked
- [ ] No TypeScript errors, no console errors anywhere
- [ ] **You can place a real order end-to-end on the live site**

🎉 **You're launched.**
