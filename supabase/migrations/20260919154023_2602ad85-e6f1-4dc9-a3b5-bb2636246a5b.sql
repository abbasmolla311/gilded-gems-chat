ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid,
  ADD COLUMN IF NOT EXISTS subcategory_id uuid,
  ADD COLUMN IF NOT EXISTS original_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS material text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stone_type text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS size text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS colour text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS rating numeric NOT NULL DEFAULT 4.8,
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_new_arrival boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_best_seller boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_type text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT SELECT ON public.subcategories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO authenticated;
GRANT ALL ON public.subcategories TO service_role;
GRANT INSERT ON public.consultations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT ALL ON public.consultations TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (active);
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active subcategories" ON public.subcategories
  FOR SELECT USING (active);
CREATE POLICY "Admins manage subcategories" ON public.subcategories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can request a consultation" ON public.consultations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view consultations" ON public.consultations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update consultations" ON public.consultations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete consultations" ON public.consultations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subcategories_set_updated_at BEFORE UPDATE ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER consultations_set_updated_at BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.categories (slug, name, sort_order) VALUES
  ('necklaces', 'Necklaces', 1),
  ('earrings', 'Earrings', 2),
  ('rings', 'Rings', 3),
  ('bangles', 'Bangles', 4),
  ('bracelets', 'Bracelets', 5),
  ('anklets', 'Anklets', 6),
  ('pendants', 'Pendants', 7),
  ('bridal-sets', 'Bridal Sets', 8)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.products p SET
  original_price = ROUND(p.price * 1.12),
  material = initcap(p.metal),
  is_new_arrival = (p.featured AND p.stock > 0),
  is_best_seller = (p.stock > 2),
  review_count = 12 + (length(p.name) % 40),
  category_id = (
    SELECT c.id FROM public.categories c WHERE c.slug = CASE
      WHEN p.name ILIKE '%necklace%' OR p.name ILIKE '%choker%' OR p.name ILIKE '%mangalsutra%' THEN 'necklaces'
      WHEN p.name ILIKE '%earring%' OR p.name ILIKE '%jhumka%' OR p.name ILIKE '%stud%' OR p.name ILIKE '%hoop%' THEN 'earrings'
      WHEN p.name ILIKE '%ring%' THEN 'rings'
      WHEN p.name ILIKE '%bangle%' THEN 'bangles'
      WHEN p.name ILIKE '%bracelet%' OR p.name ILIKE '%cuff%' THEN 'bracelets'
      WHEN p.name ILIKE '%anklet%' THEN 'anklets'
      WHEN p.name ILIKE '%pendant%' THEN 'pendants'
      ELSE 'bridal-sets'
    END
  );