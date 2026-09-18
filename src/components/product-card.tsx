import { Link } from "@tanstack/react-router";
import type { Product, StoreSettings } from "@/lib/store-types";
import { discountPercent, formatMoney, formatWeight, hasDiscount } from "@/lib/pricing";

export function ProductCard({
  product,
  settings,
}: {
  product: Product;
  settings: StoreSettings;
}) {
  const discount = discountPercent(product);
  const onSale = hasDiscount(product);

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-sm border border-border/70 bg-card transition-all hover:-translate-y-1 hover:shadow-luxe"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          width={600}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {onSale && (
          <span className="absolute left-3 top-3 rounded-sm bg-primary px-2.5 py-1 text-[10px] tracking-luxe text-primary-foreground">
            {discount}% OFF
          </span>
        )}
        {product.is_new_arrival && !onSale && (
          <span className="absolute left-3 top-3 rounded-sm bg-espresso px-2.5 py-1 text-[10px] tracking-luxe text-background">
            NEW
          </span>
        )}
      </div>
      <div className="space-y-1 p-5">
        <p className="text-[10px] tracking-luxe text-muted-foreground">
          {product.purity} · {formatWeight(product.net_weight)}
        </p>
        <h3 className="font-display text-xl text-foreground">{product.name}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-sm text-primary">{formatMoney(Number(product.price), settings.currency)}</p>
          {onSale && (
            <p className="text-xs text-muted-foreground line-through">
              {formatMoney(Number(product.original_price), settings.currency)}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {product.stock > 0 ? "In stock" : "Made to order"}
        </p>
      </div>
    </Link>
  );
}
