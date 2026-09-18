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
          <nav className="flex flex-wrap items-center gap-4 text-xs tracking-luxe text-muted-foreground">
            <Link
              to="/"
              className="transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              Shop
            </Link>
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
              to="/about"
              className="transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              About
            </Link>
            <Link
              to="/faq"
              className="transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              FAQ
            </Link>
            <Link
              to="/contact"
              className="transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              Contact
            </Link>
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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-display text-xl text-foreground">{data.settings.store_name}</p>
              <p className="mt-2 max-w-xs">{data.settings.tagline}</p>
              <p className="mt-3 text-xs">Prices are indicative and confirmed on WhatsApp before dispatch.</p>
            </div>
            <div>
              <p className="font-display text-base text-foreground">Shop</p>
              <ul className="mt-3 space-y-1.5 text-xs">
                <li><Link to="/shop" className="hover:text-primary">All Jewellery</Link></li>
                {collections.map((c) => (
                  <li key={c.id}>
                    <Link to="/collections/$slug" params={{ slug: c.slug }} className="hover:text-primary">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display text-base text-foreground">Discover</p>
              <ul className="mt-3 space-y-1.5 text-xs">
                <li><Link to="/shop" className="hover:text-primary">New Arrivals</Link></li>
                <li><Link to="/shop" className="hover:text-primary">Best Sellers</Link></li>
                <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
                <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
                <li><Link to="/contact" className="hover:text-primary">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-display text-base text-foreground">Customer Support</p>
              <ul className="mt-3 space-y-1.5 text-xs">
                <li><Link to="/cart" className="hover:text-primary">Cart</Link></li>
                <li><Link to="/contact" className="hover:text-primary">Shipping & Returns</Link></li>
                <li><Link to="/faq" className="hover:text-primary">Help Centre</Link></li>
                <li><Link to="/auth" className="hover:text-primary">Store Admin</Link></li>
              </ul>
            </div>
          </div>
          <div className="gold-rule my-8" />
          <p className="text-center text-xs">
            &copy; {new Date().getFullYear()} {data.settings.store_name}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
