import type { MetalRate, Product } from "./store-types";

export function formatMoney(value: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-IN")}`;
  }
}

export function formatWeight(grams: number) {
  return `${Number(grams).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} g`;
}

export type Breakdown = {
  metalValue: number;
  makingCharges: number;
  gst: number;
  indicativeTotal: number;
  ratePerGram: number;
};

export function priceBreakdown(product: Product, rates: MetalRate[]): Breakdown {
  const rate = rates.find((r) => r.metal === product.metal)?.rate_per_gram ?? 0;
  const metalValue = Number(product.net_weight) * Number(rate);
  const makingCharges = (metalValue * Number(product.making_charge_percent)) / 100;
  const gst = (metalValue + makingCharges) * 0.03;
  return {
    metalValue,
    makingCharges,
    gst,
    indicativeTotal: metalValue + makingCharges + gst,
    ratePerGram: Number(rate),
  };
}
