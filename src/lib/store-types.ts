export type StoreSettings = {
  store_name: string;
  tagline: string;
  whatsapp_number: string;
  currency: string;
  single_order_template: string;
  cart_order_template: string;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  sort_order: number;
  active: boolean;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  active: boolean;
};

export type Subcategory = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  sort_order: number;
  active: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string;
  collection_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  metal: string;
  purity: string;
  gross_weight: number;
  net_weight: number;
  stone_details: string;
  making_charge_percent: number;
  price: number;
  original_price: number;
  stock: number;
  featured: boolean;
  active: boolean;
  image_url: string;
  material: string;
  stone_type: string;
  size: string;
  colour: string;
  rating: number;
  review_count: number;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  images?: ProductImage[];
};

export type MetalRate = {
  id: string;
  metal: string;
  label: string;
  rate_per_gram: number;
};

export type Storefront = {
  settings: StoreSettings;
  collections: Collection[];
  categories: Category[];
  subcategories: Subcategory[];
  products: Product[];
  rates: MetalRate[];
};

export const FALLBACK_SETTINGS: StoreSettings = {
  store_name: "Aurelia Fine Jewellery",
  tagline: "Heirloom craftsmanship in gold, silver and diamond",
  whatsapp_number: "",
  currency: "INR",
  single_order_template: "",
  cart_order_template: "",
};
