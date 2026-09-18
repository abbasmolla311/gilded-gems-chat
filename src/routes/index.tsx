import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { storefrontQuery } from "@/lib/storefront.functions";
import { SiteLayout } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";
import { formatMoney } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "Aurelia Fine Jewellery — Gold, Silver & Diamond Heirlooms" },
      {
        name: "description",
        content:
          "Hand-finished gold, silver, diamond and bridal jewellery with transparent purity, weight and making charges. Order on WhatsApp.",
      },
      { property: "og:title", content: "Aurelia Fine Jewellery" },
      {
        property: "og:description",
        content: "Heirloom craftsmanship in gold, silver and diamond. Order on WhatsApp.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const featured = data.products.filter((p) => p.active && p.featured).slice(0, 8);
  const newArrivals = data.products.filter((p) => p.active && p.is_new_arrival).slice(0, 4);
  const bestSellers = data.products.filter((p) => p.active && p.is_best_seller).slice(0, 4);
  const collections = data.collections.filter((c) => c.active);
  const currency = data.settings.currency;

  return (
    <SiteLayout>
      <section className="relative">
        <img
          src="/catalog/hero.jpg"
          alt="Gold jewellery arranged on ivory silk"
          width={1920}
          height={1080}
          className="h-[70vh] w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center bg-espresso/30">
          <div className="mx-auto w-full max-w-6xl px-5">
            <div className="max-w-xl rounded-sm bg-background/85 p-10 backdrop-blur">
              <p className="text-[10px] tracking-luxe text-primary">Since 1974</p>
              <h1 className="mt-3 font-display text-5xl leading-tight text-foreground">
                {data.settings.tagline}
              </h1>
              <p className="mt-4 text-sm text-muted-foreground">
                Every piece is listed with its purity, gross and net weight and making charges,
                so you know exactly what you are paying for.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="rounded-sm bg-primary px-6 py-3 text-xs tracking-luxe text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Shop now
                </Link>
                {collections[0] && (
                  <Link
                    to="/collections/$slug"
                    params={{ slug: collections[0].slug }}
                    className="rounded-sm border border-primary/50 px-6 py-3 text-xs tracking-luxe text-primary"
                  >
                    Explore collections
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-3xl text-foreground">Our collections</h2>
        <div className="gold-rule my-6" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to="/collections/$slug"
              params={{ slug: collection.slug }}
              className="group overflow-hidden rounded-sm border border-border/70 bg-card transition-all hover:-translate-y-1 hover:shadow-luxe"
            >
              <img
                src={collection.image_url}
                alt={collection.name}
                loading="lazy"
                width={600}
                height={600}
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="p-5">
                <h3 className="font-display text-xl text-foreground">{collection.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{collection.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-foreground">Featured pieces</h2>
          <Link to="/shop" className="text-xs tracking-luxe text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="gold-rule my-6" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} settings={data.settings} />
          ))}
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl text-foreground">New arrivals</h2>
            <Link to="/shop" className="text-xs tracking-luxe text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="gold-rule my-6" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} settings={data.settings} />
            ))}
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl text-foreground">Best sellers</h2>
            <Link to="/shop" className="text-xs tracking-luxe text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="gold-rule my-6" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} settings={data.settings} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-3xl text-foreground">Shop by category</h2>
        <div className="gold-rule my-6" />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.categories.filter((c) => c.active).slice(0, 10).map((cat) => (
            <Link
              key={cat.id}
              to="/shop"
              className="rounded-sm border border-border/70 bg-card px-4 py-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-luxe"
            >
              <p className="font-display text-base text-foreground">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="font-display text-3xl text-foreground">Shop by budget</h2>
        <div className="gold-rule my-6" />
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Under " + formatMoney(1000, currency), slug: "" },
            { label: formatMoney(1000, currency) + " — " + formatMoney(10000, currency), slug: "" },
            { label: formatMoney(10000, currency) + " — " + formatMoney(100000, currency), slug: "" },
            { label: "Above " + formatMoney(100000, currency), slug: "" },
          ].map((budget, i) => (
            <Link
              key={i}
              to="/shop"
              className="rounded-sm border border-border/70 bg-card px-4 py-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-luxe"
            >
              <p className="text-sm text-muted-foreground">{budget.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5">
        <div className="grid gap-8 border-y border-border/70 py-10 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="font-display text-lg text-foreground">Hallmarked purity</p>
            <p className="mt-1">BIS hallmarked gold and 925 sterling silver.</p>
          </div>
          <div>
            <p className="font-display text-lg text-foreground">Transparent pricing</p>
            <p className="mt-1">Metal rate, making charges and GST shown separately.</p>
          </div>
          <div>
            <p className="font-display text-lg text-foreground">Order on WhatsApp</p>
            <p className="mt-1">Send your selection to our team and get a quick confirmation.</p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
