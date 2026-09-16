import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { storefrontQuery } from "@/lib/storefront.functions";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/lib/cart";
import { formatMoney, formatWeight } from "@/lib/pricing";
import { buildCartMessage, whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/cart")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "Your Selection — Aurelia Fine Jewellery" },
      {
        name: "description",
        content:
          "Review the pieces you have chosen and send the whole itemised order to our team on WhatsApp.",
      },
      { property: "og:title", content: "Your Selection — Aurelia Fine Jewellery" },
      {
        property: "og:description",
        content: "Send your itemised jewellery order to our team on WhatsApp.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const { items, total, setQuantity, remove, clear } = useCart();
  const message = buildCartMessage(items, data.settings);
  const href = whatsappUrl(data.settings.whatsapp_number, message);
  const currency = data.settings.currency;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-5 py-16">
        <h1 className="font-display text-4xl text-foreground">Your selection</h1>
        <div className="gold-rule my-8" />

        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            <p>Your cart is empty.</p>
            <Link to="/" className="mt-4 inline-block text-primary">
              Browse the collections
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.slug}
                  className="flex flex-wrap items-center gap-4 rounded-sm border border-border/70 bg-card p-4"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-sm object-cover"
                  />
                  <div className="min-w-40 flex-1">
                    <p className="font-display text-xl text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.code} · {item.purity} · {formatWeight(item.netWeight)}
                    </p>
                    <p className="text-sm text-primary">
                      {formatMoney(item.price, currency)} each
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.slug, Number(e.target.value))}
                    className="w-20 rounded-sm border border-input bg-background px-3 py-2 text-sm"
                    aria-label={`Quantity for ${item.name}`}
                  />
                  <p className="w-28 text-right text-sm">
                    {formatMoney(item.price * item.quantity, currency)}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(item.slug)}
                    className="text-xs tracking-luxe text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-6">
              <p className="font-display text-2xl text-foreground">
                Total {formatMoney(total, currency)}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-sm border border-input px-5 py-3 text-xs tracking-luxe text-muted-foreground"
                >
                  Clear cart
                </button>
                <a
                  data-testid="cart-whatsapp"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm bg-primary px-6 py-3 text-xs tracking-luxe text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Send order on WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-10 rounded-sm border border-border/70 bg-card p-5">
              <p className="text-[10px] tracking-luxe text-muted-foreground">
                Message preview
              </p>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-foreground">
                {message}
              </pre>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
