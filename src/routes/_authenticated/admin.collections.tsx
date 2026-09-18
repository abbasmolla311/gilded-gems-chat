import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminDataQuery } from "@/lib/admin-data";
import { deleteCollection, saveCollection } from "@/lib/admin.functions";
import { ImageUpload } from "@/components/admin/image-upload";
import type { Collection } from "@/lib/store-types";

export const Route = createFileRoute("/_authenticated/admin/collections")({
  head: () => ({
    meta: [{ title: "Collections — Store admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminCollections,
});

type Form = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  image_url: string;
  sort_order: number;
  active: boolean;
};

const EMPTY: Form = {
  slug: "",
  name: "",
  description: "",
  image_url: "",
  sort_order: 0,
  active: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputClass = "mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm";

function AdminCollections() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(adminDataQuery);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading collections…</p>;
  if (error)
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Could not load collections."}
      </p>
    );
  if (!data) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    try {
      await saveCollection({ data: { ...form, slug: form.slug || slugify(form.name) } });
      toast.success("Collection saved");
      setForm(null);
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save collection");
    } finally {
      setBusy(false);
    }
  }

  async function remove(collection: Collection) {
    if (!window.confirm(`Remove ${collection.name}? Products stay but lose this category.`))
      return;
    try {
      await deleteCollection({ data: { id: collection.id } });
      toast.success("Collection removed");
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove collection");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-foreground">Collections</h1>
        <button
          type="button"
          onClick={() => setForm({ ...EMPTY, sort_order: data.collections.length })}
          className="rounded-sm bg-primary px-5 py-3 text-xs tracking-luxe text-primary-foreground"
        >
          Add collection
        </button>
      </div>

      {form ? (
        <form onSubmit={submit} className="space-y-5 rounded-sm border border-border/70 bg-card p-5">
          <p className="font-display text-xl text-foreground">
            {form.id ? "Edit collection" : "New collection"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] tracking-luxe text-muted-foreground">Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-luxe text-muted-foreground">
                Web address (optional)
              </span>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder={slugify(form.name)}
                className={inputClass}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[10px] tracking-luxe text-muted-foreground">Description</span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-luxe text-muted-foreground">Order shown</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
          </div>

          <ImageUpload
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            label="Collection photo"
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Visible in store
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-sm bg-primary px-6 py-3 text-xs tracking-luxe text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save collection"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-sm border border-input px-6 py-3 text-xs tracking-luxe text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {data.collections.map((collection) => {
          const count = data.products.filter((p) => p.collection_id === collection.id).length;
          return (
            <div
              key={collection.id}
              className="flex flex-wrap items-center gap-4 rounded-sm border border-border/70 bg-card p-4"
            >
              <img
                src={collection.image_url}
                alt={collection.name}
                loading="lazy"
                width={64}
                height={64}
                className="h-16 w-16 rounded-sm object-cover"
              />
              <div className="min-w-44 flex-1">
                <p className="font-display text-lg text-foreground">{collection.name}</p>
                <p className="text-xs text-muted-foreground">
                  {count} piece(s) · {collection.active ? "Visible" : "Hidden"}
                </p>
              </div>
              <div className="flex gap-3 text-xs tracking-luxe">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      id: collection.id,
                      slug: collection.slug,
                      name: collection.name,
                      description: collection.description,
                      image_url: collection.image_url,
                      sort_order: collection.sort_order,
                      active: collection.active,
                    })
                  }
                  className="text-primary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(collection)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
