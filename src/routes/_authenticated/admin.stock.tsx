import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminDataQuery } from "@/lib/admin-data";
import { updateStock } from "@/lib/admin.functions";
import { formatMoney } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin/stock")({
  head: () => ({
    meta: [{ title: "Stock — Store admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminStock,
});

function AdminStock() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(adminDataQuery);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading stock…</p>;
  if (error)
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Could not load stock."}
      </p>
    );
  if (!data) return null;

  const currency = data.settings?.currency ?? "INR";
  const lowStock = data.products.filter((p) => p.stock > 0 && p.stock <= 2).length;
  const outOfStock = data.products.filter((p) => p.stock === 0).length;

  async function save(id: string, stock: number) {
    setSavingId(id);
    try {
      await updateStock({ data: { id, stock } });
      toast.success("Stock updated");
      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update stock");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-foreground">Stock</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pieces listed" value={String(data.products.length)} />
        <Stat label="Low stock (2 or fewer)" value={String(lowStock)} />
        <Stat label="Made to order" value={String(outOfStock)} />
      </div>

      <div className="space-y-3">
        {data.products.map((product) => {
          const draft = drafts[product.id] ?? product.stock;
          const changed = draft !== product.stock;
          return (
            <div
              key={product.id}
              className={`flex flex-wrap items-center gap-4 rounded-sm border bg-card p-4 ${
                product.stock === 0
                  ? "border-destructive/40"
                  : product.stock <= 2
                    ? "border-primary/50"
                    : "border-border/70"
              }`}
            >
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                width={56}
                height={56}
                className="h-14 w-14 rounded-sm object-cover"
              />
              <div className="min-w-44 flex-1">
                <p className="font-display text-lg text-foreground">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.code} · {formatMoney(Number(product.price), currency)}
                </p>
              </div>
              <input
                type="number"
                min={0}
                value={draft}
                onChange={(e) =>
                  setDrafts({ ...drafts, [product.id]: Number(e.target.value) })
                }
                className="w-24 rounded-sm border border-input bg-background px-3 py-2 text-sm"
                aria-label={`Stock for ${product.name}`}
              />
              <button
                type="button"
                disabled={!changed || savingId === product.id}
                onClick={() => save(product.id, draft)}
                className="rounded-sm bg-primary px-5 py-2 text-xs tracking-luxe text-primary-foreground disabled:opacity-40"
              >
                {savingId === product.id ? "Saving…" : "Save"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border/70 bg-card p-5">
      <p className="text-[10px] tracking-luxe text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl text-foreground">{value}</p>
    </div>
  );
}
