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

export type Product = {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string;
  collection_id: string | null;
  metal: string;
  purity: string;
  gross_weight: number;
  net_weight: number;
  stone_details: string;
  making_charge_percent: number;
  price: number;
  stock: number;
  featured: boolean;
  active: boolean;
  image_url: string;
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
