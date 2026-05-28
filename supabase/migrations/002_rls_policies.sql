-- ============================================================
-- Cakery — Row Level Security Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Helper function: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ── Enable RLS on all tables ─────────────────────────────────
alter table users enable row level security;
alter table addresses enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_sizes enable row level security;
alter table product_shapes enable row level security;
alter table product_flavors enable row level security;
alter table product_tier_options enable row level security;
alter table product_dietary_options enable row level security;
alter table addons enable row level security;
alter table product_addons enable row level security;
alter table coupons enable row level security;
alter table coupon_usage enable row level security;
alter table delivery_zones enable row level security;
alter table time_slots enable row level security;
alter table holidays enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table bank_transfer_receipts enable row level security;
alter table payments enable row level security;
alter table custom_inquiries enable row level security;
alter table custom_inquiry_images enable row level security;
alter table reviews enable row level security;
alter table review_images enable row level security;
alter table wishlist enable row level security;
alter table loyalty_transactions enable row level security;
alter table banners enable row level security;
alter table newsletter_subscribers enable row level security;
alter table activity_logs enable row level security;
alter table settings enable row level security;

-- ── users ────────────────────────────────────────────────────
create policy "Users can read own profile"
  on users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update using (auth.uid() = id);

create policy "Admins can read all users"
  on users for select using (is_admin());

create policy "Admins can update all users"
  on users for update using (is_admin());

create policy "Service role can insert users"
  on users for insert with check (true);

-- ── addresses ────────────────────────────────────────────────
create policy "Users manage own addresses"
  on addresses for all using (auth.uid() = user_id);

create policy "Admins read all addresses"
  on addresses for select using (is_admin());

-- ── categories — public read, admin write ────────────────────
create policy "Public can read active categories"
  on categories for select using (is_active = true);

create policy "Admins manage categories"
  on categories for all using (is_admin());

-- ── products — public read (published), admin write ──────────
create policy "Public can read published products"
  on products for select using (is_published = true);

create policy "Admins manage products"
  on products for all using (is_admin());

-- ── product_images / sizes / shapes / flavors / tiers / dietary ─
create policy "Public read product_images"
  on product_images for select using (
    exists (select 1 from products p where p.id = product_id and p.is_published = true)
  );
create policy "Admins manage product_images"
  on product_images for all using (is_admin());

create policy "Public read product_sizes"
  on product_sizes for select using (
    exists (select 1 from products p where p.id = product_id and p.is_published = true)
  );
create policy "Admins manage product_sizes"
  on product_sizes for all using (is_admin());

create policy "Public read product_shapes"
  on product_shapes for select using (
    exists (select 1 from products p where p.id = product_id and p.is_published = true)
  );
create policy "Admins manage product_shapes"
  on product_shapes for all using (is_admin());

create policy "Public read product_flavors"
  on product_flavors for select using (
    exists (select 1 from products p where p.id = product_id and p.is_published = true)
  );
create policy "Admins manage product_flavors"
  on product_flavors for all using (is_admin());

create policy "Public read product_tier_options"
  on product_tier_options for select using (
    exists (select 1 from products p where p.id = product_id and p.is_published = true)
  );
create policy "Admins manage product_tier_options"
  on product_tier_options for all using (is_admin());

create policy "Public read product_dietary_options"
  on product_dietary_options for select using (
    exists (select 1 from products p where p.id = product_id and p.is_published = true)
  );
create policy "Admins manage product_dietary_options"
  on product_dietary_options for all using (is_admin());

-- ── addons ───────────────────────────────────────────────────
create policy "Public read active addons"
  on addons for select using (is_active = true);
create policy "Admins manage addons"
  on addons for all using (is_admin());

create policy "Public read product_addons"
  on product_addons for select using (true);
create policy "Admins manage product_addons"
  on product_addons for all using (is_admin());

-- ── coupons — customers can read active codes for validation ─
create policy "Customers can read active coupons"
  on coupons for select using (is_active = true);
create policy "Admins manage coupons"
  on coupons for all using (is_admin());

create policy "Users read own coupon_usage"
  on coupon_usage for select using (auth.uid() = user_id);
create policy "Service role can insert coupon_usage"
  on coupon_usage for insert with check (true);
create policy "Admins manage coupon_usage"
  on coupon_usage for all using (is_admin());

-- ── delivery_zones, time_slots, holidays — public read ───────
create policy "Public read active delivery_zones"
  on delivery_zones for select using (is_active = true);
create policy "Admins manage delivery_zones"
  on delivery_zones for all using (is_admin());

create policy "Public read active time_slots"
  on time_slots for select using (is_active = true);
create policy "Admins manage time_slots"
  on time_slots for all using (is_admin());

create policy "Public read holidays"
  on holidays for select using (true);
create policy "Admins manage holidays"
  on holidays for all using (is_admin());

-- ── orders ───────────────────────────────────────────────────
create policy "Users read own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Authenticated can insert orders"
  on orders for insert with check (
    auth.uid() = user_id or user_id is null
  );

create policy "Users update own pending orders"
  on orders for update using (
    auth.uid() = user_id and status in ('pending_confirmation', 'confirmed')
  );

create policy "Admins manage all orders"
  on orders for all using (is_admin());

-- ── order_items ──────────────────────────────────────────────
create policy "Users read own order_items"
  on order_items for select using (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "Admins manage order_items"
  on order_items for all using (is_admin());
create policy "Service insert order_items"
  on order_items for insert with check (true);

-- ── order_status_history ─────────────────────────────────────
create policy "Users read own order status history"
  on order_status_history for select using (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "Admins manage order_status_history"
  on order_status_history for all using (is_admin());
create policy "Service insert order_status_history"
  on order_status_history for insert with check (true);

-- ── bank_transfer_receipts ───────────────────────────────────
create policy "Users manage own receipts"
  on bank_transfer_receipts for all using (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "Admins manage receipts"
  on bank_transfer_receipts for all using (is_admin());

-- ── payments ─────────────────────────────────────────────────
create policy "Users read own payments"
  on payments for select using (
    exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "Admins manage payments"
  on payments for all using (is_admin());
create policy "Service insert payments"
  on payments for insert with check (true);

-- ── custom_inquiries ─────────────────────────────────────────
create policy "Anyone can insert custom_inquiries"
  on custom_inquiries for insert with check (true);
create policy "Users read own inquiries by email" -- guests use email match
  on custom_inquiries for select using (
    auth.uid() is not null and
    email = (select u.email from users u where u.id = auth.uid())
  );
create policy "Admins manage custom_inquiries"
  on custom_inquiries for all using (is_admin());

create policy "Admins manage custom_inquiry_images"
  on custom_inquiry_images for all using (is_admin());
create policy "Service insert custom_inquiry_images"
  on custom_inquiry_images for insert with check (true);

-- ── reviews ──────────────────────────────────────────────────
create policy "Public read approved reviews"
  on reviews for select using (status = 'approved');
create policy "Users manage own reviews"
  on reviews for all using (auth.uid() = user_id);
create policy "Admins manage all reviews"
  on reviews for all using (is_admin());

create policy "Public read review_images"
  on review_images for select using (
    exists (select 1 from reviews r where r.id = review_id and r.status = 'approved')
  );
create policy "Admins manage review_images"
  on review_images for all using (is_admin());

-- ── wishlist ─────────────────────────────────────────────────
create policy "Users manage own wishlist"
  on wishlist for all using (auth.uid() = user_id);

-- ── loyalty_transactions ─────────────────────────────────────
create policy "Users read own loyalty_transactions"
  on loyalty_transactions for select using (auth.uid() = user_id);
create policy "Admins manage loyalty_transactions"
  on loyalty_transactions for all using (is_admin());
create policy "Service insert loyalty_transactions"
  on loyalty_transactions for insert with check (true);

-- ── banners ──────────────────────────────────────────────────
create policy "Public read active banners"
  on banners for select using (
    is_active = true
    and (valid_from is null or valid_from <= now())
    and (valid_until is null or valid_until >= now())
  );
create policy "Admins manage banners"
  on banners for all using (is_admin());

-- ── newsletter_subscribers ───────────────────────────────────
create policy "Anyone can subscribe"
  on newsletter_subscribers for insert with check (true);
create policy "Admins manage subscribers"
  on newsletter_subscribers for all using (is_admin());

-- ── activity_logs ────────────────────────────────────────────
create policy "Admins read activity_logs"
  on activity_logs for select using (is_admin());
create policy "Service insert activity_logs"
  on activity_logs for insert with check (true);

-- ── settings ─────────────────────────────────────────────────
create policy "Public read settings"
  on settings for select using (true);
create policy "Admins manage settings"
  on settings for all using (is_admin());
