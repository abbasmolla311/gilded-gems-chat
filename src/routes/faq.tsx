import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Aurelia Fine Jewellery" },
      {
        name: "description",
        content: "Answers to common questions about ordering, availability, delivery and more.",
      },
      { property: "og:title", content: "FAQ — Aurelia Fine Jewellery" },
    ],
  }),
  component: FaqPage,
});

const FAQS = [
  {
    q: "How can I place an order?",
    a: "Select your jewellery and click Order on WhatsApp. Our team will assist you with the order.",
  },
  {
    q: "Can I check availability before ordering?",
    a: "Yes. Send the product name or product code through WhatsApp and our team will confirm availability.",
  },
  {
    q: "Can I order multiple products?",
    a: "Yes. Add items to your cart and send the whole itemised order to our WhatsApp team at once.",
  },
  {
    q: "How can I track my order?",
    a: "After order confirmation, available tracking information will be shared with you via WhatsApp.",
  },
  {
    q: "Can I ask about size, material or price?",
    a: "Yes. Our WhatsApp team can help with product information before you place your order.",
  },
  {
    q: "Do you provide gift packaging?",
    a: "Gift packaging is available for eligible products. Please confirm before ordering.",
  },
];

function FaqPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-[10px] tracking-luxe text-primary">Help Centre</p>
        <h1 className="mt-2 font-display text-4xl text-foreground">Frequently Asked Questions</h1>
        <div className="gold-rule my-8" />

        <div className="space-y-6">
          {FAQS.map((faq, index) => (
            <div key={index} className="rounded-sm border border-border/70 bg-card p-5">
              <p className="font-display text-lg text-foreground">{faq.q}</p>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-sm border border-border/70 bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Still have questions?</p>
          <Link
            to="/contact"
            className="mt-3 inline-block rounded-sm bg-primary px-6 py-3 text-xs tracking-luxe text-primary-foreground transition-opacity hover:opacity-90"
          >
            Contact us
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
