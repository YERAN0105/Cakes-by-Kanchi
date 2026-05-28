-- ============================================================
-- Cakery — Product Seed Data (Phase 2)
-- Run AFTER seed.sql (which seeds categories and add-ons)
-- ============================================================

DO $$
DECLARE
  -- Category IDs
  v_cat_birthday       uuid;
  v_cat_wedding        uuid;
  v_cat_cupcakes       uuid;
  v_cat_pastries       uuid;
  v_cat_custom         uuid;

  -- Add-on IDs
  v_addon_candles      uuid;
  v_addon_num_candles  uuid;
  v_addon_knife        uuid;
  v_addon_card         uuid;
  v_addon_balloons     uuid;
  v_addon_flowers      uuid;
  v_addon_sparkler     uuid;
  v_addon_giftbox      uuid;

  -- Product IDs
  v_p1  uuid; v_p2  uuid; v_p3  uuid; v_p4  uuid; v_p5  uuid;
  v_p6  uuid; v_p7  uuid; v_p8  uuid; v_p9  uuid; v_p10 uuid;
  v_p11 uuid; v_p12 uuid; v_p13 uuid; v_p14 uuid; v_p15 uuid;
  v_p16 uuid; v_p17 uuid; v_p18 uuid; v_p19 uuid; v_p20 uuid;
  v_p21 uuid; v_p22 uuid;

BEGIN
  -- Fetch category IDs
  SELECT id INTO v_cat_birthday      FROM categories WHERE slug = 'birthday';
  SELECT id INTO v_cat_wedding       FROM categories WHERE slug = 'wedding';
  SELECT id INTO v_cat_cupcakes      FROM categories WHERE slug = 'cupcakes';
  SELECT id INTO v_cat_pastries      FROM categories WHERE slug = 'pastries';
  SELECT id INTO v_cat_custom        FROM categories WHERE slug = 'custom-designs';

  -- Fetch add-on IDs
  SELECT id INTO v_addon_candles     FROM addons WHERE name = 'Birthday Candles (Set of 5)';
  SELECT id INTO v_addon_num_candles FROM addons WHERE name = 'Number Candles';
  SELECT id INTO v_addon_knife       FROM addons WHERE name = 'Cake Knife & Server Set';
  SELECT id INTO v_addon_card        FROM addons WHERE name = 'Greeting Card';
  SELECT id INTO v_addon_balloons    FROM addons WHERE name = 'Balloons (Set of 6)';
  SELECT id INTO v_addon_flowers     FROM addons WHERE name = 'Fresh Flowers';
  SELECT id INTO v_addon_sparkler    FROM addons WHERE name = 'Sparkler Candles (Set of 2)';
  SELECT id INTO v_addon_giftbox     FROM addons WHERE name = 'Gift Box Packaging';

  -- ════════════════════════════════════════════
  -- BIRTHDAY CAKES
  -- ════════════════════════════════════════════

  -- P1: Strawberry Delight Birthday Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, is_bestseller, allows_message, allows_color_theme,
    meta_title, meta_description)
  VALUES (
    'strawberry-delight-birthday-cake', v_cat_birthday,
    'Strawberry Delight Birthday Cake',
    'A celebration of summer in every layer. Fresh strawberry compote between clouds of vanilla sponge, crowned with hand-piped strawberry cream and jewel-like fresh berries. Each slice is a little moment of joy.',
    'Wheat flour, butter, eggs, sugar, fresh strawberries, double cream, vanilla extract, baking powder',
    'Contains: Gluten, Dairy, Eggs. May contain traces of nuts.',
    3500.00, true, true, true, true, true,
    'Strawberry Delight Birthday Cake | Cakery',
    'Fresh strawberry sponge with hand-piped cream and berries. Order a custom birthday cake delivered in Colombo.'
  ) RETURNING id INTO v_p1;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p1, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', 'Strawberry birthday cake with pink cream roses', 0, true),
    (v_p1, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80', 'Cake slice showing strawberry layers', 1, false),
    (v_p1, 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80', 'Birthday cake with candles', 2, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p1, '0.5 kg (Serves 4–6)',  0.50, 3500.00),
    (v_p1, '1 kg (Serves 8–10)',   1.00, 5800.00),
    (v_p1, '1.5 kg (Serves 12–15)',1.50, 8200.00),
    (v_p1, '2 kg (Serves 18–20)',  2.00, 10500.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p1, 'Strawberry & Vanilla', 0),
    (v_p1, 'Vanilla Bean', 0),
    (v_p1, 'White Chocolate & Strawberry', 300.00);

  INSERT INTO product_shapes (product_id, shape) VALUES
    (v_p1, 'round'), (v_p1, 'square'), (v_p1, 'heart');

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p1, 'eggless', 400.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p1, v_addon_candles), (v_p1, v_addon_num_candles), (v_p1, v_addon_card),
    (v_p1, v_addon_balloons), (v_p1, v_addon_sparkler), (v_p1, v_addon_giftbox);


  -- P2: Chocolate Fudge Birthday Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, is_bestseller, allows_message, allows_color_theme, allows_photo_upload,
    meta_title, meta_description)
  VALUES (
    'chocolate-fudge-birthday-cake', v_cat_birthday,
    'Chocolate Fudge Birthday Cake',
    'The ultimate chocolate lover''s dream. Rich Belgian chocolate sponge layered with velvety ganache and finished with a mirror-glaze or rustic chocolate bark decoration. Intensely indulgent, impossibly delicious.',
    'Wheat flour, Belgian dark chocolate, butter, eggs, sugar, cocoa powder, cream, vanilla extract',
    'Contains: Gluten, Dairy, Eggs. May contain traces of nuts.',
    3800.00, true, true, true, true, true, true,
    'Chocolate Fudge Birthday Cake | Cakery',
    'Rich Belgian chocolate fudge cake with ganache layers. Perfect birthday cake delivered in Colombo.'
  ) RETURNING id INTO v_p2;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p2, 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800&q=80', 'Dark chocolate fudge birthday cake', 0, true),
    (v_p2, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', 'Chocolate cake with ganache drip', 1, false),
    (v_p2, 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800&q=80', 'Chocolate cake slice', 2, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p2, '0.5 kg (Serves 4–6)',  0.50, 3800.00),
    (v_p2, '1 kg (Serves 8–10)',   1.00, 6200.00),
    (v_p2, '1.5 kg (Serves 12–15)',1.50, 8800.00),
    (v_p2, '2 kg (Serves 18–20)',  2.00, 11200.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p2, 'Belgian Dark Chocolate', 0),
    (v_p2, 'Milk Chocolate', 0),
    (v_p2, 'Mocha & Espresso', 250.00),
    (v_p2, 'Salted Caramel Chocolate', 350.00);

  INSERT INTO product_shapes (product_id, shape) VALUES
    (v_p2, 'round'), (v_p2, 'square');

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p2, 'eggless', 400.00),
    (v_p2, 'vegan', 600.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p2, v_addon_candles), (v_p2, v_addon_num_candles), (v_p2, v_addon_card),
    (v_p2, v_addon_knife), (v_p2, v_addon_sparkler), (v_p2, v_addon_giftbox);


  -- P3: Rainbow Layer Birthday Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, allows_message, allows_color_theme,
    meta_title, meta_description)
  VALUES (
    'rainbow-layer-birthday-cake', v_cat_birthday,
    'Rainbow Layer Birthday Cake',
    'Six spectacular layers of colour in a snow-white vanilla sponge — a magical reveal with every slice. Covered in cloud-soft white cream cheese frosting and finished with rainbow sprinkles. A guaranteed showstopper for kids and the young-at-heart.',
    'Wheat flour, butter, eggs, sugar, cream cheese, vanilla extract, food colouring, baking powder',
    'Contains: Gluten, Dairy, Eggs.',
    4200.00, true, false, true, true,
    'Rainbow Layer Birthday Cake | Cakery',
    'Six colourful vanilla sponge layers with cream cheese frosting. The perfect birthday surprise cake in Colombo.'
  ) RETURNING id INTO v_p3;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p3, 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800&q=80', 'Rainbow layer birthday cake cross-section', 0, true),
    (v_p3, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&q=80', 'White frosted birthday cake with sprinkles', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p3, '1 kg (Serves 8–10)',   1.00, 4200.00),
    (v_p3, '1.5 kg (Serves 12–15)',1.50, 5800.00),
    (v_p3, '2 kg (Serves 18–20)',  2.00, 7500.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p3, 'Classic Vanilla', 0),
    (v_p3, 'Lemon Zest', 0);

  INSERT INTO product_shapes (product_id, shape) VALUES
    (v_p3, 'round');

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p3, 'eggless', 500.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p3, v_addon_candles), (v_p3, v_addon_num_candles), (v_p3, v_addon_card), (v_p3, v_addon_balloons);


  -- P4: Lemon Velvet Birthday Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, allows_message, allows_color_theme,
    meta_title, meta_description)
  VALUES (
    'lemon-velvet-birthday-cake', v_cat_birthday,
    'Lemon Velvet Birthday Cake',
    'Bright, zesty lemon sponge kissed with a lemon curd centre and wrapped in silky lemon buttercream. Dusted with edible gold and adorned with candied lemon slices — a refined choice for those who prefer their celebrations a little more elegant.',
    'Wheat flour, butter, eggs, caster sugar, lemons, cream, icing sugar, baking powder',
    'Contains: Gluten, Dairy, Eggs.',
    3600.00, true, true, false,
    'Lemon Velvet Birthday Cake | Cakery',
    'Zesty lemon sponge with lemon curd filling and silky buttercream. Artisan birthday cake delivery Colombo.'
  ) RETURNING id INTO v_p4;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p4, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&q=80', 'Elegant lemon cake with gold accents', 0, true),
    (v_p4, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80', 'Lemon tart with lemon slices', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p4, '0.5 kg (Serves 4–6)', 0.50, 3600.00),
    (v_p4, '1 kg (Serves 8–10)',  1.00, 5900.00),
    (v_p4, '1.5 kg (Serves 12–15)', 1.50, 8400.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p4, 'Lemon & Elderflower', 0),
    (v_p4, 'Lemon & Lavender', 200.00);

  INSERT INTO product_shapes (product_id, shape) VALUES
    (v_p4, 'round'), (v_p4, 'square');

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p4, 'eggless', 400.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p4, v_addon_candles), (v_p4, v_addon_card), (v_p4, v_addon_flowers), (v_p4, v_addon_giftbox);


  -- P5: Vintage Floral Birthday Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, allows_message, allows_color_theme,
    meta_title, meta_description)
  VALUES (
    'vintage-floral-birthday-cake', v_cat_birthday,
    'Vintage Floral Birthday Cake',
    'Our most romantic birthday creation. Delicate hand-piped buttercream roses and peony blooms cascade down a three-tiered vanilla sponge, finished with trailing greenery and a soft dusty-rose colour palette. A timeless keepsake of a cake.',
    'Wheat flour, butter, eggs, sugar, vanilla extract, cream, food colouring, baking powder',
    'Contains: Gluten, Dairy, Eggs.',
    6500.00, true, true, true, true,
    'Vintage Floral Birthday Cake | Cakery',
    'Hand-piped buttercream roses on a vintage-inspired birthday cake. Premium celebration cakes Colombo.'
  ) RETURNING id INTO v_p5;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p5, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', 'Vintage floral birthday cake with buttercream roses', 0, true),
    (v_p5, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80', 'Pink buttercream floral cake', 1, false),
    (v_p5, 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800&q=80', 'Elegant celebration cake detail', 2, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p5, '1 kg (Serves 8–10)',   1.00, 6500.00),
    (v_p5, '1.5 kg (Serves 12–15)',1.50, 9200.00),
    (v_p5, '2 kg (Serves 18–20)',  2.00, 12000.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p5, 'Vanilla & Rose', 0),
    (v_p5, 'Strawberry & Cream', 0),
    (v_p5, 'Raspberry & White Chocolate', 300.00);

  INSERT INTO product_shapes (product_id, shape) VALUES
    (v_p5, 'round');

  INSERT INTO product_tier_options (product_id, tier_count, price_modifier) VALUES
    (v_p5, 1, 0),
    (v_p5, 2, 3500.00),
    (v_p5, 3, 7000.00);

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p5, 'eggless', 500.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p5, v_addon_card), (v_p5, v_addon_flowers), (v_p5, v_addon_knife), (v_p5, v_addon_giftbox);


  -- P6: Photo Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_bestseller, allows_message, allows_photo_upload,
    meta_title, meta_description)
  VALUES (
    'personalised-photo-cake', v_cat_birthday,
    'Personalised Photo Cake',
    'Make it unmistakably theirs. Upload any photo and we''ll print it in edible ink on a smooth fondant canvas, set atop a moist vanilla or chocolate sponge. A deeply personal gift that doubles as a showpiece.',
    'Wheat flour, butter, eggs, sugar, vanilla extract, fondant, edible ink',
    'Contains: Gluten, Dairy, Eggs.',
    4500.00, true, true, true, true,
    'Personalised Photo Cake | Cakery',
    'Custom edible photo cake for birthdays and celebrations. Upload your photo — delivered in Colombo.'
  ) RETURNING id INTO v_p6;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p6, 'https://images.unsplash.com/photo-1586985289906-406988974504?w=800&q=80', 'White fondant photo cake', 0, true),
    (v_p6, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80', 'Personalised birthday cake', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p6, '1 kg (Serves 8–10)',   1.00, 4500.00),
    (v_p6, '1.5 kg (Serves 12–15)',1.50, 6500.00),
    (v_p6, '2 kg (Serves 18–20)',  2.00, 8500.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p6, 'Vanilla', 0),
    (v_p6, 'Chocolate', 0),
    (v_p6, 'Strawberry', 250.00);

  INSERT INTO product_shapes (product_id, shape) VALUES
    (v_p6, 'round'), (v_p6, 'square');

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p6, 'eggless', 400.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p6, v_addon_num_candles), (v_p6, v_addon_card), (v_p6, v_addon_balloons), (v_p6, v_addon_giftbox);


  -- ════════════════════════════════════════════
  -- WEDDING CAKES
  -- ════════════════════════════════════════════

  -- P7: Classic White Wedding Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, allows_message, allows_color_theme,
    meta_title, meta_description)
  VALUES (
    'classic-white-wedding-cake', v_cat_wedding,
    'Classic White Wedding Cake',
    'Understated elegance at its finest. Crisp ivory fondant, hand-smooth finish with delicate embossed pearl detail, and a spray of white sugar flowers. Three tiers of moist vanilla sponge with white chocolate ganache filling — the cake your guests will still be talking about.',
    'Wheat flour, butter, eggs, sugar, white chocolate, cream, fondant, vanilla extract',
    'Contains: Gluten, Dairy, Eggs. May contain traces of nuts.',
    18000.00, true, true, false, false,
    'Classic White Wedding Cake | Cakery',
    'Elegant three-tier white wedding cake with fondant finish and sugar flowers. Custom wedding cakes Colombo.'
  ) RETURNING id INTO v_p7;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p7, 'https://images.unsplash.com/photo-1621955964441-c173e01c135b?w=800&q=80', 'Classic three-tier white wedding cake', 0, true),
    (v_p7, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80', 'Wedding cake with sugar flowers', 1, false),
    (v_p7, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80', 'White wedding cake detail', 2, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p7, 'Serves 50–60 guests',  NULL, 18000.00),
    (v_p7, 'Serves 80–100 guests', NULL, 26000.00),
    (v_p7, 'Serves 120+ guests',   NULL, 35000.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p7, 'Vanilla & White Chocolate', 0),
    (v_p7, 'Lemon & Elderflower', 0),
    (v_p7, 'Strawberry & Cream', 1500.00);

  INSERT INTO product_tier_options (product_id, tier_count, price_modifier) VALUES
    (v_p7, 2, 0),
    (v_p7, 3, 5000.00),
    (v_p7, 4, 12000.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p7, v_addon_knife), (v_p7, v_addon_flowers), (v_p7, v_addon_card);


  -- P8: Rustic Naked Wedding Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_bestseller, allows_message, allows_color_theme,
    meta_title, meta_description)
  VALUES (
    'rustic-naked-wedding-cake', v_cat_wedding,
    'Rustic Naked Wedding Cake',
    'Natural, unpretentious, utterly beautiful. Bare sponge tiers with barely-there cream, festooned with seasonal fresh flowers, berries, and trailing greenery. Perfect for garden weddings, bohemian celebrations, and couples who believe beauty lies in simplicity.',
    'Wheat flour, butter, eggs, sugar, cream, seasonal fresh fruits, vanilla extract',
    'Contains: Gluten, Dairy, Eggs.',
    16000.00, true, true, false, true,
    'Rustic Naked Wedding Cake | Cakery',
    'Beautiful naked wedding cake with fresh flowers and berries. Bohemian & rustic style. Colombo delivery.'
  ) RETURNING id INTO v_p8;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p8, 'https://images.unsplash.com/photo-1519869325930-281384150729?w=800&q=80', 'Rustic naked wedding cake with flowers', 0, true),
    (v_p8, 'https://images.unsplash.com/photo-1501901609772-df0848060b33?w=800&q=80', 'Naked cake with berries and greenery', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p8, 'Serves 40–50 guests',  NULL, 16000.00),
    (v_p8, 'Serves 70–80 guests',  NULL, 24000.00),
    (v_p8, 'Serves 100+ guests',   NULL, 32000.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p8, 'Vanilla & Honey', 0),
    (v_p8, 'Carrot & Cream Cheese', 0),
    (v_p8, 'Lemon & Blueberry', 1000.00);

  INSERT INTO product_tier_options (product_id, tier_count, price_modifier) VALUES
    (v_p8, 2, 0),
    (v_p8, 3, 4500.00);

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p8, 'eggless', 800.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p8, v_addon_knife), (v_p8, v_addon_flowers), (v_p8, v_addon_card);


  -- P9: Gold Leaf Fondant Wedding Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, allows_color_theme,
    meta_title, meta_description)
  VALUES (
    'gold-leaf-fondant-wedding-cake', v_cat_wedding,
    'Gold Leaf Fondant Wedding Cake',
    'For the couple who dreams of grandeur. Hand-applied real 24-carat edible gold leaf panels shimmer on a flawlessly smooth fondant canvas, complemented by geometric patterns or hand-painted botanical motifs. A museum-worthy centrepiece.',
    'Wheat flour, butter, eggs, sugar, fondant, edible gold leaf, vanilla extract, cream',
    'Contains: Gluten, Dairy, Eggs.',
    28000.00, true, true, true,
    'Gold Leaf Wedding Cake | Cakery',
    'Opulent gold leaf fondant wedding cake. Hand-applied 24-carat edible gold. Luxury wedding cakes Colombo.'
  ) RETURNING id INTO v_p9;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p9, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80', 'Gold leaf wedding cake with geometric pattern', 0, true),
    (v_p9, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80', 'Luxurious golden wedding cake', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p9, 'Serves 60–80 guests',  NULL, 28000.00),
    (v_p9, 'Serves 100–120 guests',NULL, 40000.00),
    (v_p9, 'Serves 150+ guests',   NULL, 55000.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p9, 'Champagne & Vanilla', 0),
    (v_p9, 'White Chocolate & Raspberry', 2000.00);

  INSERT INTO product_tier_options (product_id, tier_count, price_modifier) VALUES
    (v_p9, 3, 0),
    (v_p9, 4, 12000.00),
    (v_p9, 5, 25000.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p9, v_addon_knife), (v_p9, v_addon_flowers);


  -- P10: Floral Cascade Wedding Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, allows_color_theme,
    meta_title, meta_description)
  VALUES (
    'floral-cascade-wedding-cake', v_cat_wedding,
    'Floral Cascade Wedding Cake',
    'Sugar flowers individually hand-crafted to match your wedding bouquet, cascading down smooth ivory tiers in a breathtaking waterfall of blooms. Each petal is sculpted by hand — a labour of love that lasts long after the petals have fallen.',
    'Wheat flour, butter, eggs, sugar, cream, fondant, gum paste, food colouring',
    'Contains: Gluten, Dairy, Eggs.',
    22000.00, true, true,
    'Floral Cascade Wedding Cake | Cakery',
    'Handcrafted sugar flower cascade wedding cake. Customised to match your wedding bouquet. Colombo.'
  ) RETURNING id INTO v_p10;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p10, 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80', 'Floral cascade wedding cake with sugar roses', 0, true),
    (v_p10, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80', 'Wedding cake detail with pink flowers', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p10, 'Serves 50–70 guests',  NULL, 22000.00),
    (v_p10, 'Serves 80–100 guests', NULL, 32000.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p10, 'Vanilla & Rose', 0),
    (v_p10, 'Strawberry & Cream', 1500.00),
    (v_p10, 'Pistachio & Raspberry', 2500.00);

  INSERT INTO product_tier_options (product_id, tier_count, price_modifier) VALUES
    (v_p10, 2, 0),
    (v_p10, 3, 6000.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p10, v_addon_knife), (v_p10, v_addon_card);


  -- ════════════════════════════════════════════
  -- CUPCAKES
  -- ════════════════════════════════════════════

  -- P11: Classic Vanilla Cupcakes
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, is_bestseller, allows_message,
    meta_title, meta_description)
  VALUES (
    'classic-vanilla-cupcakes', v_cat_cupcakes,
    'Classic Vanilla Cupcakes (12-Pack)',
    'The perfect crowd-pleaser. Light-as-air vanilla sponge topped with a generous swirl of silky vanilla buttercream, finished with a sprinkle of edible pearl dust. Classic for a reason. Available in half-dozen and full dozen boxes.',
    'Wheat flour, butter, eggs, sugar, vanilla extract, icing sugar, cream',
    'Contains: Gluten, Dairy, Eggs.',
    2200.00, true, false, true, true,
    'Classic Vanilla Cupcakes | Cakery',
    'Artisan vanilla cupcakes with silky buttercream. Order a dozen for parties and celebrations. Colombo delivery.'
  ) RETURNING id INTO v_p11;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p11, 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&q=80', 'Classic vanilla cupcakes with white frosting', 0, true),
    (v_p11, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&q=80', 'Box of decorated cupcakes', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p11, '6 Cupcakes', NULL, 1200.00),
    (v_p11, '12 Cupcakes', NULL, 2200.00),
    (v_p11, '24 Cupcakes', NULL, 4200.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p11, 'Classic Vanilla', 0),
    (v_p11, 'French Vanilla Bean', 150.00),
    (v_p11, 'Salted Caramel', 200.00);

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p11, 'eggless', 300.00),
    (v_p11, 'vegan', 500.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p11, v_addon_card), (v_p11, v_addon_giftbox);


  -- P12: Chocolate Dream Cupcakes
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_bestseller, allows_message,
    meta_title, meta_description)
  VALUES (
    'chocolate-dream-cupcakes', v_cat_cupcakes,
    'Chocolate Dream Cupcakes (12-Pack)',
    'Moist, rich Belgian chocolate sponge with a hidden ganache centre, crowned with a towering swirl of dark chocolate buttercream. A few flakes of sea salt on top make these utterly irresistible. Not just a cupcake — an experience.',
    'Wheat flour, Belgian chocolate, butter, eggs, sugar, cream, sea salt, cocoa powder',
    'Contains: Gluten, Dairy, Eggs.',
    2400.00, true, true, true,
    'Chocolate Dream Cupcakes | Cakery',
    'Rich Belgian chocolate cupcakes with ganache centres. Artisan cupcakes delivered in Colombo.'
  ) RETURNING id INTO v_p12;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p12, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80', 'Dark chocolate cupcakes with chocolate frosting', 0, true),
    (v_p12, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&q=80', 'Chocolate cupcake cross-section', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p12, '6 Cupcakes', NULL, 1350.00),
    (v_p12, '12 Cupcakes', NULL, 2400.00),
    (v_p12, '24 Cupcakes', NULL, 4600.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p12, 'Dark Chocolate', 0),
    (v_p12, 'Milk Chocolate', 0),
    (v_p12, 'Chocolate Raspberry', 200.00),
    (v_p12, 'Mocha', 200.00);

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p12, 'eggless', 300.00),
    (v_p12, 'vegan', 500.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p12, v_addon_card), (v_p12, v_addon_giftbox);


  -- P13: Red Velvet Cupcakes
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, allows_message,
    meta_title, meta_description)
  VALUES (
    'red-velvet-cupcakes', v_cat_cupcakes,
    'Red Velvet Cupcakes (12-Pack)',
    'Deep crimson sponge with a hint of cocoa and a whisper of buttermilk tanginess, generously crowned with a pillowy cream cheese frosting. Our signature red velvets have a loyal following — and one taste will tell you why.',
    'Wheat flour, butter, eggs, sugar, buttermilk, red food colouring, cocoa powder, cream cheese',
    'Contains: Gluten, Dairy, Eggs.',
    2500.00, true, true, true,
    'Red Velvet Cupcakes | Cakery',
    'Signature red velvet cupcakes with cream cheese frosting. Order by the dozen. Colombo delivery.'
  ) RETURNING id INTO v_p13;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p13, 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80', 'Red velvet cupcakes with cream cheese frosting', 0, true),
    (v_p13, 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&q=80', 'Cupcakes with swirled frosting', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p13, '6 Cupcakes', NULL, 1400.00),
    (v_p13, '12 Cupcakes', NULL, 2500.00),
    (v_p13, '24 Cupcakes', NULL, 4800.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p13, 'Classic Red Velvet', 0),
    (v_p13, 'Red Velvet & Raspberry', 250.00);

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p13, 'eggless', 300.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p13, v_addon_card), (v_p13, v_addon_giftbox);


  -- P14: Mixed Flavour Cupcake Box
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_bestseller, allows_message,
    meta_title, meta_description)
  VALUES (
    'mixed-flavour-cupcake-box', v_cat_cupcakes,
    'Mixed Flavour Cupcake Box',
    'Can''t choose just one? You don''t have to. Our most popular selection box combines three flavours in one beautifully presented box: Classic Vanilla, Belgian Chocolate, and Red Velvet — four of each. Perfect for gifting, parties, and office treats.',
    'Wheat flour, butter, eggs, sugar, Belgian chocolate, cream cheese, buttermilk, vanilla extract',
    'Contains: Gluten, Dairy, Eggs.',
    2800.00, true, false, false,
    'Mixed Flavour Cupcake Box | Cakery',
    'Assorted cupcake gift box — vanilla, chocolate, and red velvet. Perfect for gifting. Colombo delivery.'
  ) RETURNING id INTO v_p14;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p14, 'https://images.unsplash.com/photo-1426523609927-e6e20dc80cd8?w=800&q=80', 'Assorted cupcake box with different flavours', 0, true),
    (v_p14, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80', 'Mixed cupcake selection', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p14, '12 Cupcakes (4×3 flavours)', NULL, 2800.00),
    (v_p14, '24 Cupcakes (8×3 flavours)', NULL, 5200.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p14, v_addon_card), (v_p14, v_addon_giftbox);


  -- ════════════════════════════════════════════
  -- PASTRIES & TREATS
  -- ════════════════════════════════════════════

  -- P15: French Macaron Collection
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, is_bestseller, allows_message,
    meta_title, meta_description)
  VALUES (
    'french-macaron-collection', v_cat_pastries,
    'French Macaron Collection',
    'Perfectly crisp shells with a tender, chewy interior — each macaron filled with a ganache, buttercream, or jam that complements its flavour. Choose from our seasonal selection of twelve elegant flavours. Each piece is a miniature work of art.',
    'Almond flour, egg whites, icing sugar, butter, cream, various natural flavourings',
    'Contains: Nuts (almonds), Eggs, Dairy. May contain: Gluten.',
    1800.00, true, true, true, false,
    'French Macaron Collection | Cakery',
    'Handcrafted French macarons in seasonal flavours. Gift boxes available. Colombo delivery.'
  ) RETURNING id INTO v_p15;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p15, 'https://images.unsplash.com/photo-1558326567-98ae2405596b?w=800&q=80', 'Colourful French macarons in a box', 0, true),
    (v_p15, 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=800&q=80', 'Close-up of pastel macarons', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p15, '6 Macarons', NULL, 950.00),
    (v_p15, '12 Macarons', NULL, 1800.00),
    (v_p15, '24 Macarons', NULL, 3400.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p15, 'Seasonal Chef''s Selection', 0),
    (v_p15, 'Custom Flavours (min. 12)', 300.00);

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p15, 'gluten_free', 0);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p15, v_addon_card), (v_p15, v_addon_giftbox);


  -- P16: Millefeuille
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, allows_message,
    meta_title, meta_description)
  VALUES (
    'classic-millefeuille', v_cat_pastries,
    'Classic Millefeuille',
    'A thousand flaky, buttery layers of puff pastry interleaved with clouds of crème pâtissière, finished with a marble-glazed fondant icing. Each piece is cut to order and served the same day for maximum crunch. A true French patisserie classic.',
    'Wheat flour, butter, eggs, milk, sugar, vanilla extract, icing sugar',
    'Contains: Gluten, Dairy, Eggs.',
    550.00, true, false,
    'Classic Millefeuille | Cakery',
    'Traditional French millefeuille — flaky pastry with crème pâtissière. Fresh daily. Colombo.'
  ) RETURNING id INTO v_p16;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p16, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80', 'Classic French millefeuille with marble glaze', 0, true),
    (v_p16, 'https://images.unsplash.com/photo-1586985289906-406988974504?w=800&q=80', 'Layered pastry dessert', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p16, '1 Piece', NULL, 550.00),
    (v_p16, '4 Pieces', NULL, 2000.00),
    (v_p16, '8 Pieces', NULL, 3800.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p16, 'Classic Vanilla', 0),
    (v_p16, 'Raspberry', 100.00),
    (v_p16, 'Pistachio', 150.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p16, v_addon_card), (v_p16, v_addon_giftbox);


  -- P17: Chocolate Éclairs
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, is_bestseller,
    meta_title, meta_description)
  VALUES (
    'chocolate-eclairs', v_cat_pastries,
    'Chocolate Éclairs (6-Pack)',
    'Delicate choux pastry, light as a sigh, filled with rich vanilla crème pâtissière and finished with a gleaming dark chocolate glaze. Each éclair is piped and assembled to order to guarantee the freshest possible texture.',
    'Wheat flour, butter, eggs, milk, sugar, Belgian dark chocolate, vanilla extract, cream',
    'Contains: Gluten, Dairy, Eggs.',
    1500.00, true, false, true,
    'Chocolate Éclairs | Cakery',
    'Classic chocolate éclairs with vanilla cream filling. Freshly made. Order for collection or delivery in Colombo.'
  ) RETURNING id INTO v_p17;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p17, 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=800&q=80', 'Glossy chocolate éclairs on a platter', 0, true),
    (v_p17, 'https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?w=800&q=80', 'Éclair cross-section showing cream filling', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p17, '4 Éclairs', NULL, 1050.00),
    (v_p17, '6 Éclairs', NULL, 1500.00),
    (v_p17, '12 Éclairs', NULL, 2800.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p17, 'Dark Chocolate', 0),
    (v_p17, 'Milk Chocolate', 0),
    (v_p17, 'Coffee & Caramel', 200.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p17, v_addon_card), (v_p17, v_addon_giftbox);


  -- P18: Fruit Tart
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_bestseller,
    meta_title, meta_description)
  VALUES (
    'seasonal-fruit-tart', v_cat_pastries,
    'Seasonal Fruit Tart',
    'A crisp, buttery shortcrust shell filled with silky crème pâtissière and crowned with a jewel-like mosaic of the season''s finest fruits, each one glazed to a mirror shine. Beautiful enough to frame, delicious enough to devour immediately.',
    'Wheat flour, butter, eggs, sugar, milk, vanilla extract, seasonal fresh fruits, apricot glaze',
    'Contains: Gluten, Dairy, Eggs.',
    750.00, true, true,
    'Seasonal Fruit Tart | Cakery',
    'Handmade fruit tart with seasonal fresh fruits and crème pâtissière. Individual or sharing sizes. Colombo.'
  ) RETURNING id INTO v_p18;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p18, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80', 'Seasonal fruit tart with glazed berries', 0, true),
    (v_p18, 'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=800&q=80', 'Close-up of fruit tart with kiwi and berries', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p18, 'Individual (1 person)',    NULL, 750.00),
    (v_p18, 'Small (Serves 4–5)',       NULL, 2500.00),
    (v_p18, 'Medium (Serves 6–8)',      NULL, 4200.00),
    (v_p18, 'Large (Serves 10–12)',     NULL, 6500.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p18, 'Classic Vanilla Crème', 0),
    (v_p18, 'Lemon Curd', 200.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p18, v_addon_card), (v_p18, v_addon_giftbox);


  -- ════════════════════════════════════════════
  -- CUSTOM DESIGNS
  -- ════════════════════════════════════════════

  -- P19: Baby Shower Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, allows_message, allows_color_theme, allows_photo_upload,
    meta_title, meta_description)
  VALUES (
    'baby-shower-cake', v_cat_custom,
    'Baby Shower Cake',
    'Welcome the newest addition to the family with a cake as special as they are. Soft pastels, fondant booties, tiny hearts, and a personalised message — we design with love and attention to every detail. Tell us the theme and we''ll make it magical.',
    'Wheat flour, butter, eggs, sugar, fondant, vanilla extract, food colouring, cream',
    'Contains: Gluten, Dairy, Eggs.',
    5500.00, true, true, true, true, false,
    'Baby Shower Cake | Cakery',
    'Custom baby shower cakes in Colombo. Personalised designs in your chosen colours. Order 48h in advance.'
  ) RETURNING id INTO v_p19;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p19, 'https://images.unsplash.com/photo-1590841609987-4ac5c8f85be9?w=800&q=80', 'Pastel baby shower cake with fondant decorations', 0, true),
    (v_p19, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80', 'Soft pink baby shower cake', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p19, '1 kg (Serves 8–10)',   1.00, 5500.00),
    (v_p19, '1.5 kg (Serves 12–15)',1.50, 7800.00),
    (v_p19, '2 kg (Serves 18–20)',  2.00, 10200.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p19, 'Vanilla', 0),
    (v_p19, 'Strawberry', 0),
    (v_p19, 'Lemon', 0),
    (v_p19, 'Chocolate', 0);

  INSERT INTO product_shapes (product_id, shape) VALUES
    (v_p19, 'round'), (v_p19, 'square');

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p19, 'eggless', 500.00),
    (v_p19, 'vegan', 800.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p19, v_addon_card), (v_p19, v_addon_flowers), (v_p19, v_addon_balloons), (v_p19, v_addon_giftbox);


  -- P20: Anniversary Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_featured, is_bestseller, allows_message, allows_color_theme, allows_photo_upload,
    meta_title, meta_description)
  VALUES (
    'anniversary-celebration-cake', v_cat_custom,
    'Anniversary Celebration Cake',
    'Celebrate love in its finest form. Romantic florals, metallic accents, and a heartfelt personalised message — every element of this cake is designed to reflect your unique story. From first anniversaries to golden milestones, we make every year count.',
    'Wheat flour, butter, eggs, sugar, cream, fondant, vanilla extract, food colouring',
    'Contains: Gluten, Dairy, Eggs.',
    6500.00, true, true, true, true, true, false,
    'Anniversary Cake | Cakery',
    'Personalised anniversary cakes in Colombo. Custom designs for every milestone. Order 48h in advance.'
  ) RETURNING id INTO v_p20;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p20, 'https://images.unsplash.com/photo-1522767131594-6b7e96a14afc?w=800&q=80', 'Romantic anniversary cake with gold details', 0, true),
    (v_p20, 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=800&q=80', 'Heart-shaped anniversary cake', 1, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p20, '1 kg (Serves 8–10)',   1.00, 6500.00),
    (v_p20, '1.5 kg (Serves 12–15)',1.50, 9200.00),
    (v_p20, '2 kg (Serves 18–20)',  2.00, 12000.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p20, 'Red Velvet', 0),
    (v_p20, 'Dark Chocolate', 0),
    (v_p20, 'Champagne & Raspberry', 400.00);

  INSERT INTO product_shapes (product_id, shape) VALUES
    (v_p20, 'round'), (v_p20, 'square'), (v_p20, 'heart');

  INSERT INTO product_tier_options (product_id, tier_count, price_modifier) VALUES
    (v_p20, 1, 0),
    (v_p20, 2, 3500.00);

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p20, 'eggless', 500.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p20, v_addon_card), (v_p20, v_addon_flowers), (v_p20, v_addon_knife), (v_p20, v_addon_sparkler), (v_p20, v_addon_giftbox);


  -- P21: Corporate Event Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, allows_message, allows_color_theme, allows_photo_upload,
    meta_title, meta_description)
  VALUES (
    'corporate-event-cake', v_cat_custom,
    'Corporate Event Cake',
    'Make your brand the centrepiece. Company logo, brand colours, and a sleek professional design — our corporate cakes command attention at product launches, office milestones, client events, and team celebrations. Available to serve any number of guests.',
    'Wheat flour, butter, eggs, sugar, fondant, edible ink, vanilla extract, cream',
    'Contains: Gluten, Dairy, Eggs.',
    8000.00, true, false, false, true,
    'Corporate Event Cake | Cakery',
    'Custom corporate cakes with company logo and brand colours. Professional cake delivery in Colombo.'
  ) RETURNING id INTO v_p21;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p21, 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80', 'Clean white corporate event cake with logo', 0, true);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p21, 'Serves 20–25',  NULL, 8000.00),
    (v_p21, 'Serves 40–50',  NULL, 14000.00),
    (v_p21, 'Serves 80–100', NULL, 24000.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p21, 'Vanilla', 0),
    (v_p21, 'Chocolate', 0),
    (v_p21, 'Lemon', 0);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p21, v_addon_knife), (v_p21, v_addon_card);


  -- P22: Themed Kids Birthday Cake
  INSERT INTO products (slug, category_id, name, description, ingredients, allergens,
    base_price, is_published, is_bestseller, allows_message, allows_color_theme, allows_photo_upload,
    meta_title, meta_description)
  VALUES (
    'themed-kids-birthday-cake', v_cat_birthday,
    'Themed Kids Birthday Cake',
    'Your child''s favourite character, world, or dream brought to life in cake form. Whether it''s dinosaurs, unicorns, superheroes, or princesses — our team of cake artists crafts each creation with joy and a healthy dose of magic. A birthday moment they''ll never forget.',
    'Wheat flour, butter, eggs, sugar, fondant, vanilla extract, food colouring, cream',
    'Contains: Gluten, Dairy, Eggs.',
    5800.00, true, true, true, true, true,
    'Themed Kids Birthday Cake | Cakery',
    'Custom themed birthday cakes for children. Unicorns, dinosaurs, superheroes and more. Colombo delivery.'
  ) RETURNING id INTO v_p22;

  INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
    (v_p22, 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80', 'Colourful themed birthday cake for children', 0, true),
    (v_p22, 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=800&q=80', 'Fun kids birthday cake with characters', 1, false),
    (v_p22, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', 'Decorated birthday cake for kids', 2, false);

  INSERT INTO product_sizes (product_id, label, weight_kg, price) VALUES
    (v_p22, '1 kg (Serves 8–10)',    1.00, 5800.00),
    (v_p22, '1.5 kg (Serves 12–15)', 1.50, 8200.00),
    (v_p22, '2 kg (Serves 18–20)',   2.00, 10800.00);

  INSERT INTO product_flavors (product_id, name, price_modifier) VALUES
    (v_p22, 'Vanilla', 0),
    (v_p22, 'Chocolate', 0),
    (v_p22, 'Strawberry', 0),
    (v_p22, 'Butterscotch', 250.00);

  INSERT INTO product_shapes (product_id, shape) VALUES
    (v_p22, 'round'), (v_p22, 'square');

  INSERT INTO product_dietary_options (product_id, type, price_modifier) VALUES
    (v_p22, 'eggless', 500.00);

  INSERT INTO product_addons (product_id, addon_id) VALUES
    (v_p22, v_addon_candles), (v_p22, v_addon_num_candles), (v_p22, v_addon_card),
    (v_p22, v_addon_balloons), (v_p22, v_addon_sparkler), (v_p22, v_addon_giftbox);

END $$;
