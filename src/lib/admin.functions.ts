import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Collection, MetalRate, Product, StoreSettings } from "./store-types";

type Ctx = { supabase: any; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("You do not have admin access to this store.");
}

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context as unknown as Ctx).supabase.rpc("has_role", {
      _user_id: (context as unknown as Ctx).userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

/** Grants admin to the current user when the store has no admin yet. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) {
      throw new Error("An administrator already exists for this store.");
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: ctx.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { isAdmin: true };
  });

export const getAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const [products, collections, rates, settings] = await Promise.all([
      ctx.supabase.from("products").select("*").order("name", { ascending: true }),
      ctx.supabase.from("collections").select("*").order("sort_order", { ascending: true }),
      ctx.supabase.from("metal_rates").select("*").order("metal", { ascending: true }),
      ctx.supabase.from("store_settings").select("*").maybeSingle(),
    ]);
    if (products.error) throw new Error(products.error.message);
    return {
      products: (products.data ?? []) as Product[],
      collections: (collections.data ?? []) as Collection[],
      rates: (rates.data ?? []) as MetalRate[],
      settings: settings.data as StoreSettings | null,
    };
  });

export type ProductInput = {
  id?: string;
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

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProductInput) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { id, ...fields } = data;
    if (id) {
      const { error } = await ctx.supabase.from("products").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: inserted, error } = await ctx.supabase
      .from("products")
      .insert(fields)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id as string };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; stock: number }) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase
      .from("products")
      .update({ stock: data.stock })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id?: string;
      slug: string;
      name: string;
      description: string;
      image_url: string;
      sort_order: number;
      active: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { id, ...fields } = data;
    if (id) {
      const { error } = await ctx.supabase.from("collections").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await ctx.supabase.from("collections").insert(fields);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase.from("collections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveMetalRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { metal: string; label: string; rate_per_gram: number }) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase
      .from("metal_rates")
      .upsert(data, { onConflict: "metal" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveStoreSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StoreSettings) => input)
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase
      .from("store_settings")
      .upsert({ id: true, ...data }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
