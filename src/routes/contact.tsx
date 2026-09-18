import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { storefrontQuery } from "@/lib/storefront.functions";
import { SiteLayout } from "@/components/site-layout";
import { whatsappUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(storefrontQuery),
  head: () => ({
    meta: [
      { title: "Contact Us — Aurelia Fine Jewellery" },
      {
        name: "description",
        content: "Get in touch with our team for product information, orders and support.",
      },
      { property: "og:title", content: "Contact Us — Aurelia Fine Jewellery" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useSuspenseQuery(storefrontQuery);
  const settings = data.settings;
  const href = whatsappUrl(
    settings.whatsapp_number,
    `Hello ${settings.store_name}, I have a question about your jewellery.`,
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-[10px] tracking-luxe text-primary">Get in Touch</p>
        <h1 className="mt-2 font-display text-4xl text-foreground">Contact Us</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We're here to help with product information, orders and any questions you may have.
        </p>
        <div className="gold-rule my-8" />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-sm border border-border/70 bg-card p-6">
            <p className="font-display text-lg text-foreground">WhatsApp</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Chat with our team for the quickest response.
            </p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-sm bg-primary px-5 py-3 text-xs tracking-luxe text-primary-foreground transition-opacity hover:opacity-90"
            >
              Chat on WhatsApp
            </a>
          </div>
          <div className="rounded-sm border border-border/70 bg-card p-6">
            <p className="font-display text-lg text-foreground">Business Hours</p>
            <p className="mt-2 text-sm text-muted-foreground">Monday to Saturday</p>
            <p className="text-sm text-muted-foreground">10:00 AM to 7:00 PM</p>
            <p className="mt-3 text-sm text-muted-foreground">Sunday — by appointment</p>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
