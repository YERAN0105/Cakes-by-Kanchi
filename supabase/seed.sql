-- ============================================================
-- Cakery — Seed Data
-- Run AFTER 001_initial_schema.sql and 002_rls_policies.sql
-- ============================================================

-- ── Categories ───────────────────────────────────────────────
insert into categories (slug, name, description, image_url, display_order, is_active)
values
  ('birthday',        'Birthday Cakes',    'Make every birthday unforgettable with our handcrafted creations.',   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 1, true),
  ('wedding',         'Wedding Cakes',     'Elegantly designed cakes to celebrate your most special day.',        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800', 2, true),
  ('cupcakes',        'Cupcakes',          'Artisan cupcakes in a variety of flavours — perfect for any occasion.','https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800', 3, true),
  ('pastries',        'Pastries & Treats', 'Freshly baked pastries, tarts, and sweet treats made daily.',         'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800', 4, true),
  ('custom-designs',  'Custom Designs',    'Your vision, our craft. Fully bespoke cakes for any occasion.',       'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800', 5, true)
on conflict (slug) do nothing;

-- ── Delivery Zones ───────────────────────────────────────────
insert into delivery_zones (name, fee, estimated_time, min_order_amount, same_day_surcharge, is_active)
values
  ('Colombo 1–7',  500.00, '2–4 hours',  2000.00, 300.00, true),
  ('Colombo 8–15', 700.00, '3–5 hours',  2000.00, 400.00, true),
  ('Suburbs',      900.00, '4–6 hours',  3000.00, 500.00, true)
on conflict do nothing;

-- ── Time Slots ───────────────────────────────────────────────
insert into time_slots (label, start_time, end_time, capacity, is_active)
values
  ('Morning   10:00 AM – 12:00 PM', '10:00', '12:00', 8,  true),
  ('Afternoon  2:00 PM –  4:00 PM', '14:00', '16:00', 8,  true),
  ('Evening    6:00 PM –  8:00 PM', '18:00', '20:00', 6,  true)
on conflict do nothing;

-- ── Add-ons Library ──────────────────────────────────────────
insert into addons (name, description, price, is_active)
values
  ('Birthday Candles (Set of 5)', 'Elegant wax birthday candles',               150.00, true),
  ('Number Candles',              'Gold metallic number candles (0–9)',          200.00, true),
  ('Cake Knife & Server Set',     'Stainless steel cake cutting set',            350.00, true),
  ('Greeting Card',               'Personalised handwritten greeting card',      100.00, true),
  ('Balloons (Set of 6)',         'Latex balloons in assorted pastel colours',   250.00, true),
  ('Fresh Flowers',               'Small arrangement of seasonal fresh flowers', 500.00, true),
  ('Sparkler Candles (Set of 2)', 'Non-toxic indoor sparkler candles',           200.00, true),
  ('Gift Box Packaging',          'Premium ribbon-wrapped gift box',             300.00, true)
on conflict do nothing;

-- ── Default Settings ─────────────────────────────────────────
insert into settings (key, value) values
  ('shop_info', '{
    "name": "Cakery",
    "tagline": "Handcrafted with love, delivered to your door",
    "phone": "+94 77 123 4567",
    "whatsapp": "+94771234567",
    "email": "hello@cakery.lk",
    "address": "42 Flower Road, Colombo 03, Sri Lanka",
    "instagram": "https://instagram.com/cakery.lk",
    "facebook": "https://facebook.com/cakery.lk"
  }'),
  ('tax', '{
    "rate": 0,
    "inclusive": false,
    "label": "VAT"
  }'),
  ('loyalty', '{
    "earn_per_100_lkr": 1,
    "points_per_rupee": 0.5,
    "max_redemption_percent": 20,
    "expiry_months": 12,
    "first_order_bonus": 100,
    "review_bonus": 25
  }'),
  ('checkout', '{
    "min_lead_time_hours": 24,
    "pickup_address": "42 Flower Road, Colombo 03",
    "cod_min_amount": 0,
    "cod_max_amount": 50000
  }'),
  ('notifications', '{
    "email_enabled": false,
    "whatsapp_enabled": false
  }')
on conflict (key) do update set value = excluded.value, updated_at = now();
