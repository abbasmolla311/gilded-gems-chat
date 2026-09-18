import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Aurelia Fine Jewellery" },
      {
        name: "description",
        content: "Learn about our heritage, craftsmanship and commitment to quality jewellery.",
      },
      { property: "og:title", content: "About Us — Aurelia Fine Jewellery" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-5 py-16">
        <p className="text-[10px] tracking-luxe text-primary">Our Story</p>
        <h1 className="mt-2 font-display text-4xl text-foreground">Jewellery Made for Your Moments</h1>
        <div className="gold-rule my-8" />
        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            At Aurelia Fine Jewellery, we believe jewellery is more than an accessory — it represents
            memories, emotions, celebrations and stories. Every piece in our collection is crafted with
            care, precision and an unwavering commitment to quality.
          </p>
          <p>
            Our collection brings together beautiful designs, quality products and a convenient shopping
            experience. Whether you are shopping for yourself, your family or someone special, we are here
            to help you find the perfect piece.
          </p>
        </div>

        <div className="mt-12 grid gap-8 border-y border-border/70 py-10 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <p className="font-display text-lg text-foreground">Beautiful Designs</p>
            <p className="mt-1">Classic, traditional and contemporary jewellery for every style.</p>
          </div>
          <div>
            <p className="font-display text-lg text-foreground">Quality Focused</p>
            <p className="mt-1">Carefully selected jewellery with attention to quality and finishing.</p>
          </div>
          <div>
            <p className="font-display text-lg text-foreground">WhatsApp Ordering</p>
            <p className="mt-1">Get personal assistance and place orders directly through WhatsApp.</p>
          </div>
        </div>

        <div className="mt-12">
          <Link
            to="/shop"
            className="rounded-sm bg-primary px-6 py-3 text-xs tracking-luxe text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explore our collection
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
