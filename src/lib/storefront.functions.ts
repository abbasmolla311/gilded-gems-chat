import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  FALLBACK_SETTINGS,
  type Collection,
  type MetalRate,
  type Product,
  type Storefront,
  type StoreSettings,
} from "./store-types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getStorefront = createServerFn({ method: "GET" }).handler(
  async (): Promise<Storefront> => {
    const supabase = publicClient();
    const [settings, collections, products, rates] = await Promise.all([
      supabase
        .from("store_settings")
        .select(
          "store_name, tagline, whatsapp_number, currency, single_order_template, cart_order_template",
        )
        .maybeSingle(),
      supabase
        .from("collections")
        .select("id, slug, name, description, image_url, sort_order, active")
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select(
          "id, slug, code, name, description, collection_id, metal, purity, gross_weight, net_weight, stone_details, making_charge_percent, price, stock, featured, active, image_url",
        )
        .order("created_at", { ascending: true }),
      supabase.from("metal_rates").select("id, metal, label, rate_per_gram"),
    ]);

    return {
      settings: (settings.data as StoreSettings | null) ?? FALLBACK_SETTINGS,
      collections: (collections.data ?? []) as Collection[],
      products: (products.data ?? []) as Product[],
      rates: (rates.data ?? []) as MetalRate[],
    };
  },
);

export const storefrontQuery = queryOptions({
  queryKey: ["storefront"],
  queryFn: () => getStorefront(),
});
