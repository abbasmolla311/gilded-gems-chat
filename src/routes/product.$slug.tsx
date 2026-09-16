import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { storefrontQuery } from "@/lib/storefront.functions";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/lib/cart";
import { formatMoney, formatWeight, priceBreakdown } from "@/lib/pricing";
import { buildSingleMessage, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: ({ params }) => {
    const title = `${params.slug.replace(/-/g, " ")} — Aurelia Fine Jewellery`;
    const description =
      "See purity, gross and net weight, stone details, making charges and an indicative price, then order on WhatsApp.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductPage,
  errorComponent: () => (
    <SiteLayout>
      <p className="mx-auto max-w-6xl px-5 py-24">This piece could not be loaded.</p>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <p className="mx-auto max-w-6xl px-5 py-24">This piece does not exist.</p>
    </SiteLayout>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(storefrontQuery);
  const { add } = useCart();

  const product = data.products.find((p) => p.slug === slug && p.active);
  if (!product) throw notFound();

  const breakdown = priceBreakdown(product, data.rates);
  const currency = data.settings.currency;
  const message = buildSingleMessage(product, data.settings);
  const href = whatsappUrl(data.settings.whatsapp_number, message);
  const related = data.products
    .filter((p) => p.active && p.collection_id === product.collection_id && p.id !== product.id)
    .slice(0, 4);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <img
            src={product.image_url}
            alt={product.name}
            width={900}
            height={900}
            className="aspect-square w-full rounded-sm object-cover shadow-luxe"
          />

          <div>
            <p className="text-[10px] tracking-luxe text-primary">Code {product.code}</p>
            <h1 className="mt-2 font-display text-4xl text-foreground">{product.name}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{product.description}</p>
            <p className="mt-6 font-display text-3xl text-primary">
              {formatMoney(Number(product.price), currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.stock > 0 ? `In stock (${product.stock} available)` : "Made to order"}
            </p>

            <div className="gold-rule my-8" />

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[10px] tracking-luxe text-muted-foreground">Purity</dt>
                <dd>{product.purity}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-luxe text-muted-foreground">Metal</dt>
                <dd className="capitalize">{product.metal}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-luxe text-muted-foreground">Gross weight</dt>
                <dd>{formatWeight(product.gross_weight)}</dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-luxe text-muted-foreground">Net weight</dt>
                <dd>{formatWeight(product.net_weight)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] tracking-luxe text-muted-foreground">Stones</dt>
                <dd>{product.stone_details || "No stones"}</dd>
              </div>
            </dl>

            <div className="mt-8 rounded-sm border border-border/70 bg-card p-5 text-sm">
              <p className="font-display text-lg text-foreground">Indicative price breakdown</p>
              <ul className="mt-3 space-y-2">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">
                    Metal value ({formatMoney(breakdown.ratePerGram, currency)}/g)
                  </span>
                  <span>{formatMoney(breakdown.metalValue, currency)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">
                    Making charges ({Number(product.making_charge_percent)}%)
                  </span>
                  <span>{formatMoney(breakdown.makingCharges, currency)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">GST estimate (3%)</span>
                  <span>{formatMoney(breakdown.gst, currency)}</span>
                </li>
                <li className="flex justify-between border-t border-border/70 pt-2">
                  <span>Indicative total</span>
                  <span className="text-primary">
                    {formatMoney(breakdown.indicativeTotal, currency)}
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm bg-primary px-6 py-3 text-xs tracking-luxe text-primary-foreground transition-opacity hover:opacity-90"
              >
                Order on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  add(product);
                  toast.success(`${product.name} added to your cart`);
                }}
                className="rounded-sm border border-primary/50 px-6 py-3 text-xs tracking-luxe text-primary transition-colors hover:bg-accent"
              >
                Add to cart
              </button>
              <Link
                to="/cart"
                className="self-center text-xs tracking-luxe text-muted-foreground hover:text-primary"
              >
                Go to cart
              </Link>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display text-3xl text-foreground">You may also like</h2>
            <div className="gold-rule my-6" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to="/product/$slug"
                  params={{ slug: item.slug }}
                  className="group overflow-hidden rounded-sm border border-border/70 bg-card"
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    width={600}
                    height={600}
                    className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="p-4">
                    <h3 className="font-display text-lg text-foreground">{item.name}</h3>
                    <p className="text-sm text-primary">
                      {formatMoney(Number(item.price), currency)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
