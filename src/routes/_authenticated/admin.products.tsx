import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminDataQuery } from "@/lib/admin-data";
import { deleteProduct, saveProduct, type ProductInput } from "@/lib/admin.functions";
import { ImageUpload } from "@/components/admin/image-upload";
import { discountPercent, formatMoney } from "@/lib/pricing";
import type { Product } from "@/lib/store-types";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "Products — Store admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

const EMPTY: ProductInput = {
  slug: "",
  code: "",
  name: "",
  description: "",
  collection_id: null,
  category_id: null,
  subcategory_id: null,
  metal: "gold",
  purity: "22K",
  gross_weight: 0,
  net_weight: 0,
  stone_details: "",
  making_charge_percent: 12,
  price: 0,
  original_price: 0,
  stock: 0,
  featured: false,
  active: true,
  image_url: "",
  material: "",
  stone_type: "",
  size: "",
  colour: "",
  rating: 0,
  review_count: 0,
  is_new_arrival: false,
  is_best_seller: false,
};

function toInput(product: Product): ProductInput {
  return {
    id: product.id,
    slug: product.slug,
    code: product.code,
    name: product.name,
    description: product.description,
    collection_id: product.collection_id,
    category_id: product.category_id,
    subcategory_id: product.subcategory_id,
    metal: product.metal,
    purity: product.purity,
    gross_weight: Number(product.gross_weight),
    net_weight: Number(product.net_weight),
    stone_details: product.stone_details,
    making_charge_percent: Number(product.making_charge_percent),
    price: Number(product.price),
    original_price: Number(product.original_price),
    stock: product.stock,
    featured: product.featured,
    active: product.active,
    image_url: product.image_url,
    material: product.material,
    stone_type: product.stone_type,
    size: product.size,
    colour: product.colour,
    rating: Number(product.rating),
    review_count: product.review_count,
    is_new_arrival: product.is_new_arrival,
    is_best_seller: product.is_best_seller,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputClass = "mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-luxe text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function AdminProducts() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(adminDataQuery);
  const [form, setForm] = useState<ProductInput | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading products…</p>;
  if (error)
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Could not load products."}
      </p>
    );
  if (!data) return null;

  const currency = data.settings?.currency ?? "INR";

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  const formSubcategories = form?.category_id
    ? data.subcategories.filter((s) => s.category_id === form.category_id)
    : [];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    try {
      await saveProduct({ data: { ...form, slug: form.slug || slugify(form.name) } });
      toast.success("Product saved");
      setForm(null);
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return;
    try {
      await deleteProduct({ data: { id } });
      toast.success("Product removed");
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove product");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-foreground">Products</h1>
        <button
          type="button"
          onClick={() => setForm({ ...EMPTY })}
          className="rounded-sm bg-primary px-5 py-3 text-xs tracking-luxe text-primary-foreground"
        >
          Add product
        </button>
      </div>

      {form ? (
        <form onSubmit={submit} className="space-y-5 rounded-sm border border-border/70 bg-card p-5">
          <p className="font-display text-xl text-foreground">
            {form.id ? "Edit product" : "New product"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Item code (SKU)">
              <input required value={form.code} onChange={(e) => set("code", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Web address (optional)">
              <input
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                placeholder={slugify(form.name)}
                className={inputClass}
              />
            </Field>
            <Field label="Collection">
              <select
                value={form.collection_id ?? ""}
                onChange={(e) => set("collection_id", e.target.value || null)}
                className={inputClass}
              >
                <option value="">No collection</option>
                {data.collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                value={form.category_id ?? ""}
                onChange={(e) => {
                  set("category_id", e.target.value || null);
                  set("subcategory_id", null);
                }}
                className={inputClass}
              >
                <option value="">No category</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Subcategory">
              <select
                value={form.subcategory_id ?? ""}
                onChange={(e) => set("subcategory_id", e.target.value || null)}
                className={inputClass}
              >
                <option value="">No subcategory</option>
                {formSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Metal">
              <select value={form.metal} onChange={(e) => set("metal", e.target.value)} className={inputClass}>
                {data.rates.map((rate) => (
                  <option key={rate.id} value={rate.metal}>{rate.label}</option>
                ))}
                <option value="diamond">Diamond / other</option>
              </select>
            </Field>
            <Field label="Purity">
              <input value={form.purity} onChange={(e) => set("purity", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Material">
              <input value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="Gold, Silver, Diamond…" className={inputClass} />
            </Field>
            <Field label="Stone type">
              <input value={form.stone_type} onChange={(e) => set("stone_type", e.target.value)} placeholder="Diamond, Pearl, None…" className={inputClass} />
            </Field>
            <Field label="Gross weight (g)">
              <input type="number" step="0.001" value={form.gross_weight} onChange={(e) => set("gross_weight", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Net weight (g)">
              <input type="number" step="0.001" value={form.net_weight} onChange={(e) => set("net_weight", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Making charges (%)">
              <input type="number" step="0.1" value={form.making_charge_percent} onChange={(e) => set("making_charge_percent", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Size">
              <input value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="16, 18, Free…" className={inputClass} />
            </Field>
            <Field label="Colour">
              <input value={form.colour} onChange={(e) => set("colour", e.target.value)} placeholder="Yellow Gold, Silver…" className={inputClass} />
            </Field>
            <Field label={`Offer price (${currency})`}>
              <input type="number" step="1" value={form.price} onChange={(e) => set("price", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label={`Original price (${currency})`}>
              <input type="number" step="1" value={form.original_price} onChange={(e) => set("original_price", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Stock">
              <input type="number" value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Stones">
              <input value={form.stone_details} onChange={(e) => set("stone_details", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Rating (0-5)">
              <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => set("rating", Number(e.target.value))} className={inputClass} />
            </Field>
            <Field label="Review count">
              <input type="number" value={form.review_count} onChange={(e) => set("review_count", Number(e.target.value))} className={inputClass} />
            </Field>
          </div>

          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
          </Field>

          <ImageUpload value={form.image_url} onChange={(url) => set("image_url", url)} label="Product photo" />

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Show on home page
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_new_arrival} onChange={(e) => set("is_new_arrival", e.target.checked)} />
              New arrival
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_best_seller} onChange={(e) => set("is_best_seller", e.target.checked)} />
              Best seller
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
              Visible in store
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="rounded-sm bg-primary px-6 py-3 text-xs tracking-luxe text-primary-foreground disabled:opacity-60">
              {busy ? "Saving…" : "Save product"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="rounded-sm border border-input px-6 py-3 text-xs tracking-luxe text-muted-foreground">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {data.products.map((product) => {
          const d = discountPercent(product);
          return (
            <div key={product.id} className="flex flex-wrap items-center gap-4 rounded-sm border border-border/70 bg-card p-4">
              <img src={product.image_url} alt={product.name} loading="lazy" width={64} height={64} className="h-16 w-16 rounded-sm object-cover" />
              <div className="min-w-44 flex-1">
                <p className="font-display text-lg text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.code} · {product.purity} · {product.active ? "Visible" : "Hidden"}
                  {product.is_new_arrival && " · NEW"}
                  {product.is_best_seller && " · BEST SELLER"}
                </p>
              </div>
              <p className="text-sm text-primary">{formatMoney(Number(product.price), currency)}</p>
              {d > 0 && <p className="text-xs text-muted-foreground line-through">{formatMoney(Number(product.original_price), currency)}</p>}
              <p className="text-xs text-muted-foreground">Stock {product.stock}</p>
              <div className="flex gap-3 text-xs tracking-luxe">
                <button type="button" onClick={() => setForm(toInput(product))} className="text-primary">Edit</button>
                <button type="button" onClick={() => remove(product.id, product.name)} className="text-muted-foreground hover:text-destructive">Remove</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
