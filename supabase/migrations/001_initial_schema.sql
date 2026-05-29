-- ============================================================
-- Cakery — Initial Schema Migration
-- Run this in the Supabase SQL editor (or via supabase db push)
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Custom ENUM types ────────────────────────────────────────
create type user_role as enum ('customer', 'admin');
create type order_status as enum (
  'pending_confirmation', 'confirmed', 'in_preparation',
  'out_for_delivery', 'ready_for_pickup', 'delivered', 'completed',
  'cancelled', 'refunded'
);
create type payment_status as enum (
  'pending', 'pending_transfer', 'paid', 'failed',
  'cancelled', 'refunded', 'cod', 'rejected'
);
create type fulfillment_type as enum ('delivery', 'pickup');
create type payment_method as enum ('payhere', 'bank_transfer', 'cod');
create type coupon_type as enum ('percent', 'flat', 'free_delivery');
create type dietary_type as enum ('eggless', 'vegan', 'gluten_free');
create type review_status as enum ('pending', 'approved', 'hidden');
create type inquiry_status as enum (
  'new', 'in_progress', 'quoted', 'accepted', 'rejected', 'completed'
);
create type loyalty_transaction_type as enum ('earn', 'redeem', 'bonus', 'expire', 'adjust');

-- ── users (extends auth.users) ──────────────────────────────
create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null unique,
  name            text not null,
  phone           text,
  role            user_role not null default 'customer',
  loyalty_points  int not null default 0,
  blocked         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index users_role_idx on users(role);
create index users_email_idx on users(email);

-- ── addresses ───────────────────────────────────────────────
create table addresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  label        text not null default 'Home',
  recipient    text not null,
  phone        text not null,
  line1        text not null,
  line2        text,
  city         text not null,
  postal_code  text,
  is_default        boolean not null default false,
  delivery_zone_id  uuid references delivery_zones(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index addresses_user_id_idx on addresses(user_id);

-- ── categories ──────────────────────────────────────────────
create table categories (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  description    text,
  image_url      text,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index categories_slug_idx on categories(slug);
create index categories_display_order_idx on categories(display_order);

-- ── products ────────────────────────────────────────────────
create table products (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  category_id          uuid references categories(id) on delete set null,
  name                 text not null,
  description          text,
  ingredients          text,
  allergens            text,
  base_price           numeric(12,2) not null,
  is_published         boolean not null default false,
  is_featured          boolean not null default false,
  is_bestseller        boolean not null default false,
  stock_tracked        boolean not null default false,
  stock_quantity       int not null default 0,
  low_stock_threshold  int not null default 5,
  allows_message       boolean not null default true,
  allows_color_theme   boolean not null default false,
  allows_photo_upload  boolean not null default false,
  meta_title           text,
  meta_description     text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index products_slug_idx on products(slug);
create index products_category_id_idx on products(category_id);
create index products_is_published_idx on products(is_published);
create index products_is_featured_idx on products(is_featured);

-- ── product_images ──────────────────────────────────────────
create table product_images (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  url            text not null,
  alt_text       text,
  display_order  int not null default 0,
  is_primary     boolean not null default false,
  created_at     timestamptz not null default now()
);
create index product_images_product_id_idx on product_images(product_id);

-- ── product_sizes ───────────────────────────────────────────
create table product_sizes (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  label       text not null,
  weight_kg   numeric(5,2),
  price       numeric(12,2) not null
);
create index product_sizes_product_id_idx on product_sizes(product_id);

-- ── product_shapes ──────────────────────────────────────────
create table product_shapes (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  shape       text not null
);
create index product_shapes_product_id_idx on product_shapes(product_id);

-- ── product_flavors ─────────────────────────────────────────
create table product_flavors (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  name            text not null,
  price_modifier  numeric(12,2) not null default 0
);
create index product_flavors_product_id_idx on product_flavors(product_id);

-- ── product_tier_options ────────────────────────────────────
create table product_tier_options (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  tier_count      int not null,
  price_modifier  numeric(12,2) not null default 0
);
create index product_tier_options_product_id_idx on product_tier_options(product_id);

-- ── product_dietary_options ─────────────────────────────────
create table product_dietary_options (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  type            dietary_type not null,
  price_modifier  numeric(12,2) not null default 0
);
create index product_dietary_options_product_id_idx on product_dietary_options(product_id);

-- ── addons ──────────────────────────────────────────────────
create table addons (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  image_url       text,
  price           numeric(12,2) not null,
  stock_tracked   boolean not null default false,
  stock_quantity  int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ── product_addons (junction) ───────────────────────────────
create table product_addons (
  product_id  uuid not null references products(id) on delete cascade,
  addon_id    uuid not null references addons(id) on delete cascade,
  primary key (product_id, addon_id)
);

-- ── coupons ─────────────────────────────────────────────────
create table coupons (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique,
  type                  coupon_type not null,
  value                 numeric(12,2) not null,
  min_order_amount      numeric(12,2),
  max_discount          numeric(12,2),
  usage_limit_total     int,
  usage_limit_per_user  int,
  valid_from            timestamptz,
  valid_until           timestamptz,
  applies_to            jsonb,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);
create index coupons_code_idx on coupons(code);

-- ── coupon_usage ────────────────────────────────────────────
create table coupon_usage (
  id          uuid primary key default gen_random_uuid(),
  coupon_id   uuid not null references coupons(id) on delete cascade,
  order_id    uuid references orders(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  used_at     timestamptz not null default now()
);
create index coupon_usage_coupon_id_idx on coupon_usage(coupon_id);
create index coupon_usage_user_id_idx on coupon_usage(user_id);

-- ── delivery_zones ──────────────────────────────────────────
create table delivery_zones (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  fee                   numeric(12,2) not null,
  estimated_time        text,
  min_order_amount      numeric(12,2),
  same_day_surcharge    numeric(12,2) not null default 0,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

-- ── time_slots ──────────────────────────────────────────────
create table time_slots (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  start_time  time not null,
  end_time    time not null,
  capacity    int not null default 10,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── holidays ────────────────────────────────────────────────
create table holidays (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  label       text,
  created_at  timestamptz not null default now()
);

-- ── orders ──────────────────────────────────────────────────
create table orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text not null unique,
  user_id              uuid references users(id) on delete set null,
  guest_email          text,
  guest_phone          text,
  status               order_status not null default 'pending_confirmation',
  fulfillment_type     fulfillment_type not null default 'delivery',
  delivery_zone_id     uuid references delivery_zones(id) on delete set null,
  address_snapshot     jsonb,
  delivery_date        date,
  time_slot_id         uuid references time_slots(id) on delete set null,
  payment_method       payment_method not null,
  payment_status       payment_status not null default 'pending',
  subtotal             numeric(12,2) not null,
  delivery_fee         numeric(12,2) not null default 0,
  discount_amount      numeric(12,2) not null default 0,
  tax_amount           numeric(12,2) not null default 0,
  loyalty_points_used  int not null default 0,
  loyalty_discount     numeric(12,2) not null default 0,
  total                numeric(12,2) not null,
  coupon_id            uuid references coupons(id) on delete set null,
  notes                text,
  internal_notes       text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index orders_order_number_idx on orders(order_number);
create index orders_user_id_idx on orders(user_id);
create index orders_status_idx on orders(status);
create index orders_payment_status_idx on orders(payment_status);
create index orders_created_at_idx on orders(created_at desc);

-- ── order_items ─────────────────────────────────────────────
create table order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders(id) on delete cascade,
  product_id        uuid references products(id) on delete set null,
  product_snapshot  jsonb not null,
  customization     jsonb not null default '{}',
  quantity          int not null default 1,
  unit_price        numeric(12,2) not null,
  line_total        numeric(12,2) not null
);
create index order_items_order_id_idx on order_items(order_id);

-- ── order_status_history ────────────────────────────────────
create table order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  status      order_status not null,
  note        text,
  changed_by  uuid references users(id) on delete set null,
  changed_at  timestamptz not null default now()
);
create index order_status_history_order_id_idx on order_status_history(order_id);

-- ── bank_transfer_receipts ──────────────────────────────────
create table bank_transfer_receipts (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  image_url      text not null,
  uploaded_at    timestamptz not null default now(),
  status         text not null default 'pending',
  reviewed_by    uuid references users(id) on delete set null,
  reviewed_at    timestamptz,
  reject_reason  text
);
create index bank_transfer_receipts_order_id_idx on bank_transfer_receipts(order_id);

-- ── payments ────────────────────────────────────────────────
create table payments (
  id                     uuid primary key default gen_random_uuid(),
  order_id               uuid not null references orders(id) on delete cascade,
  gateway                text not null,
  gateway_transaction_id text,
  amount                 numeric(12,2) not null,
  status                 text not null,
  raw_response           jsonb,
  created_at             timestamptz not null default now()
);
create index payments_order_id_idx on payments(order_id);

-- ── custom_inquiries ────────────────────────────────────────
create table custom_inquiries (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  email                 text not null,
  phone                 text not null,
  event_date            date,
  occasion              text,
  servings              int,
  description           text,
  budget_min            numeric(12,2),
  budget_max            numeric(12,2),
  special_requirements  text,
  status                inquiry_status not null default 'new',
  quoted_amount         numeric(12,2),
  quote_message         text,
  payment_link          text,
  converted_order_id    uuid references orders(id) on delete set null,
  created_at            timestamptz not null default now()
);
create index custom_inquiries_status_idx on custom_inquiries(status);
create index custom_inquiries_email_idx on custom_inquiries(email);

-- ── custom_inquiry_images ───────────────────────────────────
create table custom_inquiry_images (
  id          uuid primary key default gen_random_uuid(),
  inquiry_id  uuid not null references custom_inquiries(id) on delete cascade,
  url         text not null
);

-- ── reviews ─────────────────────────────────────────────────
create table reviews (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  user_id        uuid references users(id) on delete set null,
  order_item_id  uuid references order_items(id) on delete set null,
  rating         int not null check (rating between 1 and 5),
  title          text,
  body           text,
  status         review_status not null default 'pending',
  admin_reply    text,
  created_at     timestamptz not null default now()
);
create index reviews_product_id_idx on reviews(product_id);
create index reviews_user_id_idx on reviews(user_id);
create index reviews_status_idx on reviews(status);

-- ── review_images ───────────────────────────────────────────
create table review_images (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references reviews(id) on delete cascade,
  url        text not null
);

-- ── wishlist ────────────────────────────────────────────────
create table wishlist (
  user_id     uuid not null references users(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  added_at    timestamptz not null default now(),
  primary key (user_id, product_id)
);
create index wishlist_user_id_idx on wishlist(user_id);

-- ── loyalty_transactions ────────────────────────────────────
create table loyalty_transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  order_id       uuid references orders(id) on delete set null,
  type           loyalty_transaction_type not null,
  points         int not null,
  balance_after  int not null,
  note           text,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz
);
create index loyalty_transactions_user_id_idx on loyalty_transactions(user_id);

-- ── banners ─────────────────────────────────────────────────
create table banners (
  id             uuid primary key default gen_random_uuid(),
  image_url      text not null,
  headline       text,
  subheadline    text,
  cta_text       text,
  cta_link       text,
  position       text not null default 'hero',
  display_order  int not null default 0,
  valid_from     timestamptz,
  valid_until    timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ── newsletter_subscribers ──────────────────────────────────
create table newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  subscribed_at   timestamptz not null default now(),
  is_active       boolean not null default true
);
create index newsletter_subscribers_email_idx on newsletter_subscribers(email);

-- ── activity_logs ───────────────────────────────────────────
create table activity_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id) on delete set null,
  action        text not null,
  target_table  text,
  target_id     uuid,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);
create index activity_logs_user_id_idx on activity_logs(user_id);
create index activity_logs_created_at_idx on activity_logs(created_at desc);

-- ── settings (key-value config) ─────────────────────────────
create table settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ── updated_at trigger ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on users
  for each row execute function update_updated_at();
create trigger products_updated_at before update on products
  for each row execute function update_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function update_updated_at();

-- ── Supabase Storage buckets ─────────────────────────────────
-- Run these in the Supabase dashboard > Storage, or via the Storage API
-- bucket: product-images   (public)
-- bucket: custom-cake-refs (private)
-- bucket: payment-receipts (private)
-- bucket: review-images    (public)
