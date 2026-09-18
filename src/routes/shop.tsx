import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { storefrontQuery } from "@/lib/storefront.functions";
import { SiteLayout } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";
import { discountPercent } from "@/lib/pricing";

export const Route = createFileRoute("/shop")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "Shop All Jewellery — Aurelia Fine Jewellery" },
      {
        name: "description",
        content:
          "Browse our full collection of gold, silver, diamond and bridal jewellery. Filter by category, material, price and more.",
      },
      { property: "og:title", content: "Shop All Jewellery — Aurelia Fine Jewellery" },
      {
        property: "og:description",
        content: "Browse our full collection of gold, silver, diamond and bridal jewellery.",
      },
    ],
  }),
  component: ShopPage,
});

type SortOption = "newest" | "price-low" | "price-high" | "discount" | "rating";

function ShopPage() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const products = data.products.filter((p) => p.active);

  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("all");
  const [subSlug, setSubSlug] = useState("all");
  const [material, setMaterial] = useState("all");
  const [stoneType, setStoneType] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const subcategoriesForCategory = useMemo(
    () =>
      categorySlug === "all"
        ? data.subcategories
        : data.subcategories.filter(
            (s) => s.category_id === data.categories.find((c) => c.slug === categorySlug)?.id,
          ),
    [categorySlug, data.subcategories, data.categories],
  );

  const materials = useMemo(
    () => Array.from(new Set(products.map((p) => p.material).filter(Boolean))),
    [products],
  );
  const stoneTypes = useMemo(
    () => Array.from(new Set(products.map((p) => p.stone_type).filter(Boolean))),
    [products],
  );

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.code.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q)
        )
          return false;
      }
      if (categorySlug !== "all") {
        const cat = data.categories.find((c) => c.slug === categorySlug);
        if (cat && p.category_id !== cat.id) return false;
      }
      if (subSlug !== "all") {
        const sub = data.subcategories.find((s) => s.slug === subSlug);
        if (sub && p.subcategory_id !== sub.id) return false;
      }
      if (material !== "all" && p.material !== material) return false;
      if (stoneType !== "all" && p.stone_type !== stoneType) return false;
      if (availability === "stock" && p.stock <= 0) return false;
      if (availability === "order" && p.stock > 0) return false;
      if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "discount":
          return discountPercent(b) - discountPercent(a);
        case "rating":
          return Number(b.rating) - Number(a.rating);
        default:
          return (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0);
      }
    });

    return result;
  }, [products, search, categorySlug, subSlug, material, stoneType, availability, maxPrice, sort, data.categories, data.subcategories]);

  const selectClass =
    "rounded-sm border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  function resetFilters() {
    setSearch("");
    setCategorySlug("all");
    setSubSlug("all");
    setMaterial("all");
    setStoneType("all");
    setMaxPrice("");
    setAvailability("all");
    setSort("newest");
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-[10px] tracking-luxe text-primary">All Jewellery</p>
        <h1 className="mt-2 font-display text-4xl text-foreground">Shop</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Browse our full collection. Filter by type, material, price and more to find the perfect piece.
        </p>
        <div className="gold-rule my-8" />

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-48 flex-1 rounded-sm border border-input bg-card px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className={selectClass}>
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="discount">Biggest Discount</option>
            <option value="rating">Top Rated</option>
          </select>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-sm border border-input px-4 py-2 text-xs tracking-luxe text-muted-foreground hover:text-primary"
          >
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
        </div>

        {showFilters && (
          <div className="mb-8 grid gap-4 rounded-sm border border-border/70 bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] tracking-luxe text-muted-foreground">Category</span>
              <select
                value={categorySlug}
                onChange={(e) => {
                  setCategorySlug(e.target.value);
                  setSubSlug("all");
                }}
                className={selectClass}
              >
                <option value="all">All Categories</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] tracking-luxe text-muted-foreground">Subcategory</span>
              <select value={subSlug} onChange={(e) => setSubSlug(e.target.value)} className={selectClass}>
                <option value="all">All</option>
                {subcategoriesForCategory.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] tracking-luxe text-muted-foreground">Material</span>
              <select value={material} onChange={(e) => setMaterial(e.target.value)} className={selectClass}>
                <option value="all">All</option>
                {materials.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] tracking-luxe text-muted-foreground">Stone</span>
              <select value={stoneType} onChange={(e) => setStoneType(e.target.value)} className={selectClass}>
                <option value="all">All</option>
                {stoneTypes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] tracking-luxe text-muted-foreground">Availability</span>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={selectClass}>
                <option value="all">All</option>
                <option value="stock">In stock</option>
                <option value="order">Made to order</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] tracking-luxe text-muted-foreground">Max Price</span>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Any"
                className={selectClass}
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-sm border border-input px-4 py-2 text-xs tracking-luxe text-muted-foreground hover:text-primary"
              >
                Reset all
              </button>
            </div>
          </div>
        )}

        <p className="mb-6 text-xs text-muted-foreground">{filtered.length} piece(s)</p>

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
