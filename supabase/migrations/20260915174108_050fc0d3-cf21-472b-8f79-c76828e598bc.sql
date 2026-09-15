CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active collections" ON public.collections FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "Admins manage collections" ON public.collections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  code text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  metal text NOT NULL DEFAULT 'gold',
  purity text NOT NULL DEFAULT '22K',
  gross_weight numeric(10,3) NOT NULL DEFAULT 0,
  net_weight numeric(10,3) NOT NULL DEFAULT 0,
  stone_details text NOT NULL DEFAULT '',
  making_charge_percent numeric(6,2) NOT NULL DEFAULT 12,
  price numeric(12,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.metal_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metal text NOT NULL UNIQUE,
  label text NOT NULL,
  rate_per_gram numeric(12,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.metal_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metal_rates TO authenticated;
GRANT ALL ON public.metal_rates TO service_role;
ALTER TABLE public.metal_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view metal rates" ON public.metal_rates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage metal rates" ON public.metal_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER metal_rates_updated_at BEFORE UPDATE ON public.metal_rates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.store_settings (
  id boolean PRIMARY KEY DEFAULT true,
  store_name text NOT NULL DEFAULT 'Aurelia Fine Jewellery',
  tagline text NOT NULL DEFAULT '',
  whatsapp_number text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'INR',
  single_order_template text NOT NULL DEFAULT '',
  cart_order_template text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_single_row CHECK (id)
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view store settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage store settings" ON public.store_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.store_settings (id, store_name, tagline, whatsapp_number, single_order_template, cart_order_template) VALUES (
  true,
  'Aurelia Fine Jewellery',
  'Heirloom craftsmanship in gold, silver and diamond',
  '910000000000',
  E'Hello {store},\n\nI would like to order this piece:\n\n*{item}* ({code})\nPurity: {purity}\nNet weight: {weight} g\nMaking charges: {making}\nPrice: {price}\n\nPlease confirm availability and delivery time.',
  E'Hello {store},\n\nI would like to place an order for {count} item(s):\n\n{items}\n\nTotal: {total}\n\nPlease confirm availability and delivery time.'
);

INSERT INTO public.metal_rates (metal, label, rate_per_gram) VALUES
  ('gold', 'Gold (22K)', 7150.00),
  ('silver', 'Silver (925)', 95.00);

INSERT INTO public.collections (slug, name, description, image_url, sort_order) VALUES
  ('gold', 'Gold', 'Hand-finished 22K and 18K gold for every occasion.', '/catalog/collection-gold.jpg', 1),
  ('silver', 'Silver', 'Sterling 925 silver with contemporary detailing.', '/catalog/collection-silver.jpg', 2),
  ('diamond', 'Diamond', 'Certified solitaires and pave settings in 18K gold.', '/catalog/collection-diamond.jpg', 3),
  ('bridal', 'Bridal', 'Ceremonial sets crafted for the wedding day.', '/catalog/collection-bridal.jpg', 4);

INSERT INTO public.products (slug, code, name, description, collection_id, metal, purity, gross_weight, net_weight, stone_details, making_charge_percent, price, stock, featured, image_url)
SELECT v.slug, v.code, v.name, v.description, c.id, v.metal, v.purity, v.gross_weight, v.net_weight, v.stone_details, v.making_charge_percent, v.price, v.stock, v.featured, v.image_url
FROM (VALUES
  ('kalasha-gold-necklace','AU-N-101','Kalasha Temple Necklace','A temple-inspired 22K gold necklace with hand-chased motifs.','gold','gold','22K',42.500,41.200,'',14.00,352000.00,2,true,'/catalog/gold-necklace.jpg'),
  ('meena-gold-bangles','AU-B-102','Meena Enamel Bangles (Pair)','Pair of 22K gold bangles with soft enamel inlay.','gold','gold','22K',28.900,28.100,'',12.50,236000.00,4,true,'/catalog/gold-bangle.jpg'),
  ('surya-gold-jhumkas','AU-E-103','Surya Jhumkas','Classic 22K gold jhumkas with granulated beadwork.','gold','gold','22K',12.400,12.000,'',13.00,101500.00,6,false,'/catalog/gold-earrings.jpg'),
  ('anaya-gold-chain','AU-C-104','Anaya Rope Chain','18K gold rope chain, 20 inches, secure lobster clasp.','gold','gold','18K',9.800,9.800,'',10.00,71500.00,8,false,'/catalog/gold-chain.jpg'),
  ('ratna-gold-ring','AU-R-105','Ratna Signet Ring','22K gold signet ring with matte and mirror finish.','gold','gold','22K',6.200,6.000,'',12.00,49500.00,5,false,'/catalog/gold-ring.jpg'),
  ('chandra-silver-anklets','AU-A-201','Chandra Silver Anklets','Sterling 925 anklets with tiny hand-set ghungroo bells.','silver','silver','925',48.000,47.000,'',18.00,7400.00,12,true,'/catalog/silver-anklet.jpg'),
  ('nira-silver-pendant','AU-P-202','Nira Oxidised Pendant','Oxidised 925 silver pendant on an adjustable chain.','silver','silver','925',14.500,14.000,'',20.00,2650.00,20,false,'/catalog/silver-pendant.jpg'),
  ('mira-silver-hoops','AU-E-203','Mira Silver Hoops','Polished sterling silver hoops with a brushed inner face.','silver','silver','925',8.200,8.000,'',20.00,1850.00,25,false,'/catalog/silver-earrings.jpg'),
  ('vega-silver-cuff','AU-B-204','Vega Sculpted Cuff','Wide sterling silver cuff with a hand-hammered surface.','silver','silver','925',36.000,35.000,'',22.00,5600.00,7,false,'/catalog/silver-cuff.jpg'),
  ('aura-solitaire-ring','AU-D-301','Aura Solitaire Ring','0.70 ct VVS1 solitaire in an 18K gold six-prong setting.','diamond','gold','18K',4.100,3.400,'0.70 ct round brilliant, VVS1, E colour, IGI certified',9.00,412000.00,1,true,'/catalog/diamond-ring.jpg'),
  ('lucent-diamond-studs','AU-D-302','Lucent Diamond Studs','Pave halo studs set with 42 brilliant-cut diamonds.','diamond','gold','18K',3.600,3.100,'0.52 ct total, VS clarity, F-G colour',10.00,164000.00,3,true,'/catalog/diamond-studs.jpg'),
  ('celeste-diamond-pendant','AU-D-303','Celeste Diamond Pendant','Marquise cluster pendant in 18K white gold.','diamond','gold','18K',3.200,2.800,'0.38 ct total, VS clarity',11.00,118000.00,4,false,'/catalog/diamond-pendant.jpg'),
  ('lumen-tennis-bracelet','AU-D-304','Lumen Tennis Bracelet','Flexible 18K gold line bracelet with 52 diamonds.','diamond','gold','18K',11.900,10.400,'1.85 ct total, SI1 clarity',10.00,486000.00,1,false,'/catalog/diamond-bracelet.jpg'),
  ('vivaha-bridal-set','AU-W-401','Vivaha Bridal Set','Complete bridal set: long haram, choker, jhumkas and maang tikka.','bridal','gold','22K',158.000,152.000,'Uncut polki accents',15.00,1285000.00,1,true,'/catalog/bridal-set.jpg'),
  ('saubhagya-mangalsutra','AU-W-402','Saubhagya Mangalsutra','22K gold mangalsutra with black beads and a diamond pendant.','bridal','gold','22K',18.600,17.800,'0.22 ct diamond pendant',13.00,158000.00,5,false,'/catalog/mangalsutra.jpg'),
  ('padma-bridal-choker','AU-W-403','Padma Bridal Choker','Layered 22K gold choker with lotus repousse work.','bridal','gold','22K',64.000,62.000,'',15.00,528000.00,2,false,'/catalog/bridal-choker.jpg')
) AS v(slug, code, name, description, collection_slug, metal, purity, gross_weight, net_weight, stone_details, making_charge_percent, price, stock, featured, image_url)
JOIN public.collections c ON c.slug = v.collection_slug;