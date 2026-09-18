/*
# Expand catalogue schema for richer e-commerce experience

## Overview
Adds categories, subcategories, and multi-image support to the store.
Adds new product fields: original_price, category_id, subcategory_id, material,
stone_type, size, colour, rating, review_count, is_new_arrival, is_best_seller.
Seeds categories matching the store's full taxonomy (Rings, Earrings, Necklaces, etc.).

## New Tables
1. `categories` — top-level jewellery types (Rings, Earrings, Necklaces, Chains, etc.)
2. `subcategories` — sub-types within a category (e.g. Gold Rings under Rings)
3. `product_images` — multiple images per product (gallery on product page)

## Modified Tables
- `products` — adds columns: original_price, category_id, subcategory_id, material,
  stone_type, size, colour, rating, review_count, is_new_arrival, is_best_seller

## Security
- All new tables get RLS enabled with anon SELECT and admin CRUD via has_role()

## Important Notes
1. Existing products retain their data; new columns get safe defaults.
2. Categories and subcategories are seeded with the full taxonomy from the spec.
3. The `products.collection_id` column is kept for backward compatibility.
4. A unique constraint on (category_id, slug) prevents duplicate subcategories.
*/

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (active);

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SUBCATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
GRANT SELECT ON public.subcategories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO authenticated;
GRANT ALL ON public.subcategories TO service_role;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active subcategories" ON public.subcategories;
CREATE POLICY "Anyone can view active subcategories" ON public.subcategories
  FOR SELECT TO anon, authenticated USING (active);

DROP POLICY IF EXISTS "Admins manage subcategories" ON public.subcategories;
CREATE POLICY "Admins manage subcategories" ON public.subcategories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS subcategories_updated_at ON public.subcategories;
CREATE TRIGGER subcategories_updated_at BEFORE UPDATE ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- PRODUCT_IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images" ON public.product_images
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage product images" ON public.product_images;
CREATE POLICY "Admins manage product images" ON public.product_images
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- ============================================================
-- ADD COLUMNS TO PRODUCTS (idempotent)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'original_price') THEN
    ALTER TABLE public.products ADD COLUMN original_price numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
    ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'subcategory_id') THEN
    ALTER TABLE public.products ADD COLUMN subcategory_id uuid REFERENCES public.subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'material') THEN
    ALTER TABLE public.products ADD COLUMN material text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stone_type') THEN
    ALTER TABLE public.products ADD COLUMN stone_type text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'size') THEN
    ALTER TABLE public.products ADD COLUMN size text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'colour') THEN
    ALTER TABLE public.products ADD COLUMN colour text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'rating') THEN
    ALTER TABLE public.products ADD COLUMN rating numeric(2,1) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'review_count') THEN
    ALTER TABLE public.products ADD COLUMN review_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_new_arrival') THEN
    ALTER TABLE public.products ADD COLUMN is_new_arrival boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_best_seller') THEN
    ALTER TABLE public.products ADD COLUMN is_best_seller boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory_id ON public.products(subcategory_id);

-- ============================================================
-- SEED CATEGORIES
-- ============================================================
INSERT INTO public.categories (slug, name, sort_order) VALUES
  ('rings', 'Rings', 1),
  ('earrings', 'Earrings', 2),
  ('necklaces', 'Necklaces', 3),
  ('chains', 'Chains', 4),
  ('bracelets', 'Bracelets', 5),
  ('bangles-kada', 'Bangles & Kada', 6),
  ('pendants', 'Pendants', 7),
  ('anklets', 'Anklets & Foot Jewellery', 8),
  ('nose-jewellery', 'Nose Jewellery', 9),
  ('jewellery-sets', 'Jewellery Sets', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED SUBCATEGORIES
-- ============================================================
INSERT INTO public.subcategories (category_id, slug, name, sort_order)
SELECT c.id, s.slug, s.name, s.sort_order FROM public.categories c
JOIN (VALUES
  ('rings', 'gold-rings', 'Gold Rings', 1),
  ('rings', 'diamond-rings', 'Diamond Rings', 2),
  ('rings', 'silver-rings', 'Silver Rings', 3),
  ('rings', 'solitaire-rings', 'Solitaire Rings', 4),
  ('rings', 'engagement-rings', 'Engagement Rings', 5),
  ('rings', 'wedding-rings', 'Wedding Rings', 6),
  ('rings', 'couple-rings', 'Couple Rings', 7),
  ('rings', 'mens-rings', 'Men''s Rings', 8),
  ('earrings', 'stud-earrings', 'Stud Earrings', 1),
  ('earrings', 'hoop-earrings', 'Hoop Earrings', 2),
  ('earrings', 'jhumka', 'Jhumka', 3),
  ('earrings', 'chandbali', 'Chandbali', 4),
  ('earrings', 'drop-earrings', 'Drop Earrings', 5),
  ('earrings', 'gold-earrings', 'Gold Earrings', 6),
  ('earrings', 'diamond-earrings', 'Diamond Earrings', 7),
  ('earrings', 'silver-earrings', 'Silver Earrings', 8),
  ('earrings', 'pearl-earrings', 'Pearl Earrings', 9),
  ('necklaces', 'gold-necklaces', 'Gold Necklaces', 1),
  ('necklaces', 'diamond-necklaces', 'Diamond Necklaces', 2),
  ('necklaces', 'silver-necklaces', 'Silver Necklaces', 3),
  ('necklaces', 'pearl-necklaces', 'Pearl Necklaces', 4),
  ('necklaces', 'choker-necklaces', 'Choker Necklaces', 5),
  ('necklaces', 'pendant-necklaces', 'Pendant Necklaces', 6),
  ('necklaces', 'bridal-necklaces', 'Bridal Necklaces', 7),
  ('necklaces', 'necklace-sets', 'Necklace Sets', 8),
  ('chains', 'gold-chains', 'Gold Chains', 1),
  ('chains', 'silver-chains', 'Silver Chains', 2),
  ('chains', 'mens-chains', 'Men''s Chains', 3),
  ('chains', 'rope-chains', 'Rope Chains', 4),
  ('chains', 'designer-chains', 'Designer Chains', 5),
  ('bracelets', 'gold-bracelets', 'Gold Bracelets', 1),
  ('bracelets', 'diamond-bracelets', 'Diamond Bracelets', 2),
  ('bracelets', 'silver-bracelets', 'Silver Bracelets', 3),
  ('bracelets', 'tennis-bracelets', 'Tennis Bracelets', 4),
  ('bracelets', 'charm-bracelets', 'Charm Bracelets', 5),
  ('bracelets', 'couple-bracelets', 'Couple Bracelets', 6),
  ('bracelets', 'mens-bracelets', 'Men''s Bracelets', 7),
  ('bangles-kada', 'gold-bangles', 'Gold Bangles', 1),
  ('bangles-kada', 'diamond-bangles', 'Diamond Bangles', 2),
  ('bangles-kada', 'silver-bangles', 'Silver Bangles', 3),
  ('bangles-kada', 'bridal-bangles', 'Bridal Bangles', 4),
  ('bangles-kada', 'kada', 'Kada', 5),
  ('bangles-kada', 'mens-kada', 'Men''s Kada', 6),
  ('bangles-kada', 'bangle-sets', 'Bangle Sets', 7),
  ('pendants', 'gold-pendants', 'Gold Pendants', 1),
  ('pendants', 'diamond-pendants', 'Diamond Pendants', 2),
  ('pendants', 'initial-pendants', 'Initial Pendants', 3),
  ('pendants', 'name-pendants', 'Name Pendants', 4),
  ('pendants', 'heart-pendants', 'Heart Pendants', 5),
  ('pendants', 'religious-pendants', 'Religious Pendants', 6),
  ('pendants', 'couple-pendants', 'Couple Pendants', 7),
  ('pendants', 'pendant-sets', 'Pendant Sets', 8),
  ('anklets', 'gold-anklets', 'Gold Anklets', 1),
  ('anklets', 'silver-anklets', 'Silver Anklets', 2),
  ('anklets', 'designer-anklets', 'Designer Anklets', 3),
  ('anklets', 'payal', 'Payal', 4),
  ('anklets', 'bridal-anklets', 'Bridal Anklets', 5),
  ('anklets', 'toe-rings', 'Toe Rings', 6),
  ('nose-jewellery', 'nose-pins', 'Nose Pins', 1),
  ('nose-jewellery', 'nose-rings', 'Nose Rings', 2),
  ('nose-jewellery', 'nath', 'Nath', 3),
  ('nose-jewellery', 'diamond-nose-pins', 'Diamond Nose Pins', 4),
  ('nose-jewellery', 'gold-nose-pins', 'Gold Nose Pins', 5),
  ('jewellery-sets', 'gold-jewellery-sets', 'Gold Jewellery Sets', 1),
  ('jewellery-sets', 'diamond-jewellery-sets', 'Diamond Jewellery Sets', 2),
  ('jewellery-sets', 'bridal-sets', 'Bridal Sets', 3),
  ('jewellery-sets', 'matching-sets', 'Matching Sets', 4)
) AS s(cat_slug, slug, name, sort_order)
ON c.slug = s.cat_slug
ON CONFLICT (category_id, slug) DO NOTHING;

-- ============================================================
-- UPDATE EXISTING PRODUCTS: set original_price, categories, material, etc.
-- ============================================================
DO $$
DECLARE
  cat_rings uuid; cat_earrings uuid; cat_necklaces uuid; cat_chains uuid;
  cat_bracelets uuid; cat_bangles uuid; cat_anklets uuid; cat_pendants uuid;
  sub_gold_rings uuid; sub_gold_bangles uuid; sub_gold_earrings uuid;
  sub_gold_chains uuid; sub_silver_anklets uuid; sub_gold_pendants uuid;
  sub_silver_earrings uuid; sub_silver_bracelets uuid;
  sub_diamond_rings uuid; sub_diamond_earrings uuid; sub_diamond_pendants uuid;
  sub_diamond_bracelets uuid; sub_bridal_necklaces uuid;
  sub_gold_necklaces uuid; sub_bridal_bangles uuid;
BEGIN
  SELECT id INTO cat_rings FROM public.categories WHERE slug = 'rings';
  SELECT id INTO cat_earrings FROM public.categories WHERE slug = 'earrings';
  SELECT id INTO cat_necklaces FROM public.categories WHERE slug = 'necklaces';
  SELECT id INTO cat_chains FROM public.categories WHERE slug = 'chains';
  SELECT id INTO cat_bracelets FROM public.categories WHERE slug = 'bracelets';
  SELECT id INTO cat_bangles FROM public.categories WHERE slug = 'bangles-kada';
  SELECT id INTO cat_anklets FROM public.categories WHERE slug = 'anklets';
  SELECT id INTO cat_pendants FROM public.categories WHERE slug = 'pendants';

  SELECT id INTO sub_gold_rings FROM public.subcategories WHERE category_id = cat_rings AND slug = 'gold-rings';
  SELECT id INTO sub_gold_bangles FROM public.subcategories WHERE category_id = cat_bangles AND slug = 'gold-bangles';
  SELECT id INTO sub_gold_earrings FROM public.subcategories WHERE category_id = cat_earrings AND slug = 'gold-earrings';
  SELECT id INTO sub_gold_chains FROM public.subcategories WHERE category_id = cat_chains AND slug = 'gold-chains';
  SELECT id INTO sub_silver_anklets FROM public.subcategories WHERE category_id = cat_anklets AND slug = 'silver-anklets';
  SELECT id INTO sub_gold_pendants FROM public.subcategories WHERE category_id = cat_pendants AND slug = 'gold-pendants';
  SELECT id INTO sub_silver_earrings FROM public.subcategories WHERE category_id = cat_earrings AND slug = 'silver-earrings';
  SELECT id INTO sub_silver_bracelets FROM public.subcategories WHERE category_id = cat_bracelets AND slug = 'silver-bracelets';
  SELECT id INTO sub_diamond_rings FROM public.subcategories WHERE category_id = cat_rings AND slug = 'diamond-rings';
  SELECT id INTO sub_diamond_earrings FROM public.subcategories WHERE category_id = cat_earrings AND slug = 'diamond-earrings';
  SELECT id INTO sub_diamond_pendants FROM public.subcategories WHERE category_id = cat_pendants AND slug = 'diamond-pendants';
  SELECT id INTO sub_diamond_bracelets FROM public.subcategories WHERE category_id = cat_bracelets AND slug = 'tennis-bracelets';
  SELECT id INTO sub_bridal_necklaces FROM public.subcategories WHERE category_id = cat_necklaces AND slug = 'bridal-necklaces';
  SELECT id INTO sub_gold_necklaces FROM public.subcategories WHERE category_id = cat_necklaces AND slug = 'gold-necklaces';
  SELECT id INTO sub_bridal_bangles FROM public.subcategories WHERE category_id = cat_bangles AND slug = 'bridal-bangles';

  UPDATE public.products SET original_price = price WHERE original_price = 0;

  UPDATE public.products SET category_id = cat_necklaces, subcategory_id = sub_gold_necklaces WHERE code = 'AU-N-101';
  UPDATE public.products SET category_id = cat_bangles, subcategory_id = sub_gold_bangles WHERE code = 'AU-B-102';
  UPDATE public.products SET category_id = cat_earrings, subcategory_id = sub_gold_earrings WHERE code = 'AU-E-103';
  UPDATE public.products SET category_id = cat_chains, subcategory_id = sub_gold_chains WHERE code = 'AU-C-104';
  UPDATE public.products SET category_id = cat_rings, subcategory_id = sub_gold_rings WHERE code = 'AU-R-105';
  UPDATE public.products SET category_id = cat_anklets, subcategory_id = sub_silver_anklets WHERE code = 'AU-A-201';
  UPDATE public.products SET category_id = cat_pendants, subcategory_id = sub_gold_pendants WHERE code = 'AU-P-202';
  UPDATE public.products SET category_id = cat_earrings, subcategory_id = sub_silver_earrings WHERE code = 'AU-E-203';
  UPDATE public.products SET category_id = cat_bracelets, subcategory_id = sub_silver_bracelets WHERE code = 'AU-B-204';
  UPDATE public.products SET category_id = cat_rings, subcategory_id = sub_diamond_rings WHERE code = 'AU-D-301';
  UPDATE public.products SET category_id = cat_earrings, subcategory_id = sub_diamond_earrings WHERE code = 'AU-D-302';
  UPDATE public.products SET category_id = cat_pendants, subcategory_id = sub_diamond_pendants WHERE code = 'AU-D-303';
  UPDATE public.products SET category_id = cat_bracelets, subcategory_id = sub_diamond_bracelets WHERE code = 'AU-D-304';
  UPDATE public.products SET category_id = cat_necklaces, subcategory_id = sub_bridal_necklaces, is_best_seller = true WHERE code = 'AU-W-401';
  UPDATE public.products SET category_id = cat_necklaces, subcategory_id = sub_bridal_necklaces WHERE code = 'AU-W-402';
  UPDATE public.products SET category_id = cat_necklaces, subcategory_id = sub_bridal_necklaces WHERE code = 'AU-W-403';

  UPDATE public.products SET is_new_arrival = true WHERE code IN ('AU-N-101', 'AU-D-301', 'AU-A-201');
  UPDATE public.products SET is_best_seller = true WHERE code IN ('AU-B-102', 'AU-D-302', 'AU-E-103');

  UPDATE public.products SET material = 'Gold' WHERE metal = 'gold';
  UPDATE public.products SET material = 'Silver' WHERE metal = 'silver';
  UPDATE public.products SET material = 'Diamond' WHERE stone_details ILIKE '%diamond%' OR stone_details ILIKE '%polki%';

  UPDATE public.products SET stone_type = 'Diamond' WHERE stone_details ILIKE '%diamond%' OR stone_details ILIKE '%polki%';
  UPDATE public.products SET stone_type = 'Pearl' WHERE stone_details ILIKE '%pearl%';
  UPDATE public.products SET stone_type = 'None' WHERE stone_details = '';

  UPDATE public.products SET rating = 4.5, review_count = 12 WHERE code IN ('AU-N-101', 'AU-B-102', 'AU-D-301');
  UPDATE public.products SET rating = 4.0, review_count = 8 WHERE code IN ('AU-E-103', 'AU-C-104', 'AU-A-201');
  UPDATE public.products SET rating = 4.8, review_count = 15 WHERE code = 'AU-W-401';

  UPDATE public.products SET colour = 'Yellow Gold' WHERE metal = 'gold' AND purity IN ('22K', '18K');
  UPDATE public.products SET colour = 'Silver' WHERE metal = 'silver';
END $$;

-- ============================================================
-- SEED ADDITIONAL PRODUCTS
-- ============================================================
INSERT INTO public.products (
  slug, code, name, description, collection_id, category_id, subcategory_id,
  metal, purity, gross_weight, net_weight, stone_details, making_charge_percent,
  price, original_price, stock, featured, is_new_arrival, is_best_seller,
  image_url, material, stone_type, size, colour, rating, review_count
)
SELECT
  v.slug, v.code, v.name, v.description, c.id, cat.id, sub.id,
  v.metal, v.purity, v.gross_weight::numeric, v.net_weight::numeric, v.stone_details, v.making_charge_percent::numeric,
  v.price::numeric, v.original_price::numeric, v.stock::integer, v.featured::boolean, v.is_new_arrival::boolean, v.is_best_seller::boolean,
  v.image_url, v.material, v.stone_type, v.size, v.colour, v.rating::numeric, v.review_count::integer
FROM (VALUES
  ('priya-gemstone-ring', 'AU-R-106', 'Priya Gemstone Ring', '22K gold ring with a ruby-red gemstone centre.', 'gold', 'rings', 'gold-rings', 'gold', '22K', '5.500', '5.200', 'Ruby accent 0.15 ct', '12.00', '42000.00', '48000.00', '3', true, true, false, '/catalog/gold-ring.jpg', 'Gold', 'Ruby', '17', 'Yellow Gold', '4.3', '7'),
  ('tara-diamond-band', 'AU-R-107', 'Tara Diamond Band', 'Slim 18K gold band set with seven diamonds.', 'diamond', 'rings', 'diamond-rings', 'gold', '18K', '3.800', '3.500', '0.28 ct total, VS clarity', '9.00', '86000.00', '95000.00', '4', false, true, true, '/catalog/diamond-ring.jpg', 'Diamond', 'Diamond', '18', 'White Gold', '4.6', '11'),
  ('kiran-silver-band', 'AU-R-108', 'Kiran Silver Band', 'Hammered sterling silver band with matte finish.', 'silver', 'rings', 'silver-rings', 'silver', '925', '6.000', '5.800', '', '20.00', '1450.00', '1800.00', '15', false, true, false, '/catalog/silver-ring.jpg', 'Silver', 'None', '19', 'Silver', '4.1', '5'),
  ('amrita-jhumka', 'AU-E-109', 'Amrita Pearl Jhumka', '22K gold jhumka with pearl drops.', 'gold', 'earrings', 'jhumka', 'gold', '22K', '10.200', '9.800', 'Freshwater pearl drops', '13.00', '82000.00', '89000.00', '3', false, true, true, '/catalog/gold-earrings.jpg', 'Gold', 'Pearl', 'Free', 'Yellow Gold', '4.4', '6'),
  ('pave-diamond-hoop', 'AU-E-110', 'Pave Diamond Hoops', '18K gold hoops with pave-set diamonds.', 'diamond', 'earrings', 'diamond-earrings', 'gold', '18K', '5.200', '4.800', '0.45 ct total, VS clarity', '10.00', '128000.00', '140000.00', '2', true, false, true, '/catalog/diamond-studs.jpg', 'Diamond', 'Diamond', 'Free', 'White Gold', '4.7', '9'),
  ('devi-temple-haram', 'AU-N-111', 'Devi Temple Haram', 'Two-layer 22K gold temple haram with Lakshmi motif.', 'gold', 'necklaces', 'gold-necklaces', 'gold', '22K', '88.000', '85.000', '', '15.00', '685000.00', '720000.00', '1', true, false, false, '/catalog/gold-necklace.jpg', 'Gold', 'None', 'Free', 'Yellow Gold', '4.9', '4'),
  ('pearl-strand-necklace', 'AU-N-112', 'Classic Pearl Strand', '45 cm freshwater pearl strand with silver clasp.', 'silver', 'necklaces', 'pearl-necklaces', 'silver', '925', '0', '0', 'Freshwater pearls, 7-8 mm', '0.00', '3200.00', '3900.00', '10', false, true, false, '/catalog/silver-necklace.jpg', 'Pearl', 'Pearl', '45 cm', 'White', '4.2', '8'),
  ('gold-charm-bracelet', 'AU-B-113', 'Aishwarya Charm Bracelet', '18K gold bracelet with four removable charms.', 'gold', 'bracelets', 'gold-bracelets', 'gold', '18K', '7.500', '7.200', '', '11.00', '58000.00', '64000.00', '5', false, false, true, '/catalog/gold-bracelet.jpg', 'Gold', 'None', '18', 'Yellow Gold', '4.3', '6'),
  ('silver-tennis-bracelet', 'AU-B-114', 'Sara Silver Tennis Bracelet', 'Sterling silver tennis bracelet with cubic zirconia.', 'silver', 'bracelets', 'silver-bracelets', 'silver', '925', '12.000', '11.500', 'Cubic zirconia', '18.00', '3200.00', '3800.00', '14', false, true, false, '/catalog/silver-cuff.jpg', 'Silver', 'Cubic Zirconia', '17', 'Silver', '4.0', '10'),
  ('kundan-bangle-set', 'AU-B-115', 'Kundan Bangle Set (Pair)', '22K gold bangles with kundan stone edging.', 'bridal', 'bangles-kada', 'bridal-bangles', 'gold', '22K', '35.200', '34.000', 'Kundan stones', '14.00', '298000.00', '320000.00', '2', true, false, false, '/catalog/gold-bangle.jpg', 'Gold', 'Kundan', '2-4', 'Yellow Gold', '4.5', '3'),
  ('stackable-silver-bangles', 'AU-B-116', 'Stackable Silver Bangles (Set of 3)', 'Three slim sterling silver bangles for everyday wear.', 'silver', 'bangles-kada', 'silver-bangles', 'silver', '925', '18.000', '17.500', '', '20.00', '2400.00', '2900.00', '20', false, true, true, '/catalog/silver-earrings.jpg', 'Silver', 'None', '2-4', 'Silver', '4.1', '12'),
  ('diamond-heart-pendant', 'AU-P-117', 'Diamond Heart Pendant', '18K gold heart pendant set with a single diamond.', 'diamond', 'pendants', 'heart-pendants', 'gold', '18K', '2.800', '2.500', '0.10 ct solitaire, VS clarity', '10.00', '38000.00', '42000.00', '6', false, true, true, '/catalog/diamond-pendant.jpg', 'Diamond', 'Diamond', 'Free', 'Rose Gold', '4.6', '14'),
  ('gold-initial-pendant', 'AU-P-118', 'Gold Initial Pendant', '22K gold initial pendant, customizable.', 'gold', 'pendants', 'initial-pendants', 'gold', '22K', '3.200', '3.000', '', '12.00', '22000.00', '25000.00', '10', false, false, true, '/catalog/silver-pendant.jpg', 'Gold', 'None', 'Free', 'Yellow Gold', '4.2', '9')
) AS v(
  slug, code, name, description, collection_slug, cat_slug, sub_slug,
  metal, purity, gross_weight, net_weight, stone_details, making_charge_percent,
  price, original_price, stock, featured, is_new_arrival, is_best_seller,
  image_url, material, stone_type, size, colour, rating, review_count
)
JOIN public.collections c ON c.slug = v.collection_slug
JOIN public.categories cat ON cat.slug = v.cat_slug
JOIN public.subcategories sub ON sub.category_id = cat.id AND sub.slug = v.sub_slug
ON CONFLICT (slug) DO NOTHING;
