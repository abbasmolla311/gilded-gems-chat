import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { storefrontQuery } from "@/lib/storefront.functions";
import { useCart } from "@/lib/cart";

export function SiteLayout({ children }: { children: ReactNode }) {
  const { data } = useSuspenseQuery(storefrontQuery);
  const { count } = useCart();
  const collections = data.collections.filter((c) => c.active);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link to="/" className="leading-tight">
            <span className="block font-display text-2xl text-foreground">
              {data.settings.store_name}
            </span>
            <span className="block text-[10px] tracking-luxe text-muted-foreground">
              {data.settings.tagline}
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-xs tracking-luxe text-muted-foreground">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                to="/collections/$slug"
                params={{ slug: collection.slug }}
                className="transition-colors hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {collection.name}
              </Link>
            ))}
            <Link
              to="/cart"
              className="rounded-full border border-primary/40 px-4 py-1.5 text-primary transition-colors hover:bg-accent"
            >
              Cart{count > 0 ? ` (${count})` : ""}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-border/70 bg-secondary/50">
        <div className="mx-auto max-w-6xl px-5 py-12 text-sm text-muted-foreground">
          <p className="font-display text-xl text-foreground">{data.settings.store_name}</p>
          <p className="mt-2 max-w-md">{data.settings.tagline}</p>
          <div className="gold-rule my-6" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>Prices are indicative and confirmed on WhatsApp before dispatch.</p>
            <Link to="/auth" className="hover:text-primary">
              Store admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
