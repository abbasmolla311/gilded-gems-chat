import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminDataQuery } from "@/lib/admin-data";
import { saveMetalRate, saveStoreSettings } from "@/lib/admin.functions";
import { FALLBACK_SETTINGS, type StoreSettings } from "@/lib/store-types";
import {
  CART_PLACEHOLDERS,
  DEFAULT_CART_TEMPLATE,
  DEFAULT_SINGLE_TEMPLATE,
  SINGLE_PLACEHOLDERS,
  renderTemplate,
} from "@/lib/whatsapp";
import { formatMoney, formatWeight } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [{ title: "Settings — Store admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(adminDataQuery);
  const [form, setForm] = useState<StoreSettings>(FALLBACK_SETTINGS);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data?.settings]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading settings…</p>;
  if (error)
    return (
      <p className="text-sm text-destructive">
        {error instanceof Error ? error.message : "Could not load settings."}
      </p>
    );
  if (!data) return null;

  async function saveAll() {
    setSaving(true);
    try {
      await saveStoreSettings({ data: form });
      const changedRates = data!.rates.filter(
        (rate) => rates[rate.metal] !== undefined && rates[rate.metal] !== Number(rate.rate_per_gram),
      );
      for (const rate of changedRates) {
        await saveMetalRate({
          data: {
            metal: rate.metal,
            label: rate.label,
            rate_per_gram: Number(rates[rate.metal]),
          },
        });
      }
      toast.success("Settings saved — the storefront is updated.");
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  const singlePreview = renderTemplate(form.single_order_template.trim() || DEFAULT_SINGLE_TEMPLATE, {
    store: form.store_name,
    item: "Kalasha Gold Necklace",
    code: "AU-N-101",
    purity: "22K",
    weight: formatWeight(18.4),
    making: "12%",
    price: formatMoney(146500, form.currency),
    link: "",
  });

  const cartPreview = renderTemplate(form.cart_order_template.trim() || DEFAULT_CART_TEMPLATE, {
    store: form.store_name,
    items: `1. Kalasha Gold Necklace (AU-N-101) — 22K, ${formatWeight(18.4)} x 1 — ${formatMoney(
      146500,
      form.currency,
    )}`,
    count: "1",
    total: formatMoney(146500, form.currency),
    link: "",
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-foreground">Settings</h1>
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="rounded-sm bg-primary px-6 py-3 text-xs tracking-luxe text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <section className="space-y-4 rounded-sm border border-border/70 bg-card p-5">
        <h2 className="font-display text-xl text-foreground">Store details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name">
            <input
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Tagline">
            <input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="WhatsApp number (with country code)">
            <input
              value={form.whatsapp_number}
              onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
              placeholder="919876543210"
              className={inputClass}
            />
          </Field>
          <Field label="Currency code">
            <input
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-sm border border-border/70 bg-card p-5">
        <h2 className="font-display text-xl text-foreground">Metal rates (per gram)</h2>
        <p className="text-xs text-muted-foreground">
          These rates drive the indicative price breakdown shown on every product page.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.rates.map((rate) => (
            <Field key={rate.id} label={rate.label}>
              <input
                type="number"
                min={0}
                step="0.01"
                value={rates[rate.metal] ?? Number(rate.rate_per_gram)}
                onChange={(e) => setRates({ ...rates, [rate.metal]: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-sm border border-border/70 bg-card p-5">
        <h2 className="font-display text-xl text-foreground">Single item order message</h2>
        <p className="text-xs text-muted-foreground">
          Placeholders: {SINGLE_PLACEHOLDERS.join(" ")}
        </p>
        <textarea
          rows={12}
          value={form.single_order_template}
          placeholder={DEFAULT_SINGLE_TEMPLATE}
          onChange={(e) => setForm({ ...form, single_order_template: e.target.value })}
          className={`${inputClass} font-mono text-xs`}
        />
        <Preview text={singlePreview} />
      </section>

      <section className="space-y-4 rounded-sm border border-border/70 bg-card p-5">
        <h2 className="font-display text-xl text-foreground">Cart order message</h2>
        <p className="text-xs text-muted-foreground">
          Placeholders: {CART_PLACEHOLDERS.join(" ")}
        </p>
        <textarea
          rows={12}
          value={form.cart_order_template}
          placeholder={DEFAULT_CART_TEMPLATE}
          onChange={(e) => setForm({ ...form, cart_order_template: e.target.value })}
          className={`${inputClass} font-mono text-xs`}
        />
        <Preview text={cartPreview} />
      </section>
    </div>
  );
}

const inputClass =
  "w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] tracking-luxe text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Preview({ text }: { text: string }) {
  return (
    <div className="rounded-sm border border-border/70 bg-secondary/60 p-4">
      <p className="text-[10px] tracking-luxe text-muted-foreground">Preview</p>
      <pre className="mt-2 whitespace-pre-wrap text-xs text-foreground">{text}</pre>
    </div>
  );
}
