import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { storefrontQuery } from "@/lib/storefront.functions";
import { SiteLayout } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: ({ params }) => {
    const name = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
    const title = `${name} Jewellery — Aurelia Fine Jewellery`;
    const description = `Explore our ${params.slug} jewellery with purity, weight and making charges listed for every piece.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CollectionPage,
  errorComponent: () => (
    <SiteLayout>
      <p className="mx-auto max-w-6xl px-5 py-24">This collection could not be loaded.</p>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <p className="mx-auto max-w-6xl px-5 py-24">This collection does not exist.</p>
    </SiteLayout>
  ),
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(storefrontQuery);
  const collection = data.collections.find((c) => c.slug === slug);
  if (!collection) throw notFound();

  const items = data.products.filter((p) => p.active && p.collection_id === collection.id);
  const purities = Array.from(new Set(items.map((p) => p.purity)));

  const [purity, setPurity] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((p) => {
        if (purity !== "all" && p.purity !== purity) return false;
        if (availability === "stock" && p.stock <= 0) return false;
        if (availability === "order" && p.stock > 0) return false;
        if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
        return true;
      }),
    [items, purity, availability, maxPrice],
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-[10px] tracking-luxe text-primary">Collection</p>
        <h1 className="mt-2 font-display text-4xl text-foreground">{collection.name}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{collection.description}</p>
        <div className="gold-rule my-8" />

        <div className="mb-10 flex flex-wrap items-end gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] tracking-luxe text-muted-foreground">Purity</span>
            <select
              value={purity}
              onChange={(e) => setPurity(e.target.value)}
              className="rounded-sm border border-input bg-card px-3 py-2"
            >
              <option value="all">All</option>
              {purities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] tracking-luxe text-muted-foreground">Availability</span>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="rounded-sm border border-input bg-card px-3 py-2"
            >
              <option value="all">All</option>
              <option value="stock">In stock</option>
              <option value="order">Made to order</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] tracking-luxe text-muted-foreground">Max price</span>
            <input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              className="w-32 rounded-sm border border-input bg-card px-3 py-2"
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pieces match these filters.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} settings={data.settings} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
