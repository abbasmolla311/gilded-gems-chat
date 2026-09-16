import { Link } from "@tanstack/react-router";
import type { Product, StoreSettings } from "@/lib/store-types";
import { formatMoney, formatWeight } from "@/lib/pricing";

export function ProductCard({
  product,
  settings,
}: {
  product: Product;
  settings: StoreSettings;
}) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-sm border border-border/70 bg-card transition-all hover:-translate-y-1 hover:shadow-luxe"
    >
      <div className="aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          width={600}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="space-y-1 p-5">
        <p className="text-[10px] tracking-luxe text-muted-foreground">
          {product.purity} · {formatWeight(product.net_weight)}
        </p>
        <h3 className="font-display text-xl text-foreground">{product.name}</h3>
        <p className="text-sm text-primary">
          {formatMoney(Number(product.price), settings.currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          {product.stock > 0 ? "In stock" : "Made to order"}
        </p>
      </div>
    </Link>
  );
}
