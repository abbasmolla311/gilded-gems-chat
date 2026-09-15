import { formatMoney, formatWeight } from "./pricing";
import type { Product, StoreSettings } from "./store-types";
import type { CartItem } from "./cart";

export const DEFAULT_SINGLE_TEMPLATE = `Hello {store},

I would like to order this piece:

*{item}* ({code})
Purity: {purity}
Net weight: {weight}
Making charges: {making}
Price: {price}

Please confirm availability and delivery time.`;

export const DEFAULT_CART_TEMPLATE = `Hello {store},

I would like to place an order for {count} item(s):

{items}

Total: {total}

Please confirm availability and delivery time.`;

export const SINGLE_PLACEHOLDERS = [
  "{store}",
  "{item}",
  "{code}",
  "{purity}",
  "{weight}",
  "{making}",
  "{price}",
  "{link}",
];

export const CART_PLACEHOLDERS = ["{store}", "{items}", "{count}", "{total}", "{link}"];

export function renderTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? vars[key]! : match,
  );
}

export function singleOrderVars(
  product: Product,
  settings: StoreSettings,
  link = "",
): Record<string, string> {
  return {
    store: settings.store_name,
    item: product.name,
    code: product.code,
    purity: product.purity,
    weight: formatWeight(product.net_weight),
    making: `${Number(product.making_charge_percent)}%`,
    price: formatMoney(Number(product.price), settings.currency),
    link,
  };
}

export function cartOrderVars(
  items: CartItem[],
  settings: StoreSettings,
  link = "",
): Record<string, string> {
  const lines = items.map(
    (item, index) =>
      `${index + 1}. ${item.name} (${item.code}) — ${item.purity}, ${formatWeight(
        item.netWeight,
      )} x ${item.quantity} — ${formatMoney(item.price * item.quantity, settings.currency)}`,
  );
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return {
    store: settings.store_name,
    items: lines.join("\n"),
    count: String(items.reduce((sum, item) => sum + item.quantity, 0)),
    total: formatMoney(total, settings.currency),
    link,
  };
}

export function buildSingleMessage(product: Product, settings: StoreSettings, link = "") {
  const template = settings.single_order_template.trim() || DEFAULT_SINGLE_TEMPLATE;
  return renderTemplate(template, singleOrderVars(product, settings, link));
}

export function buildCartMessage(items: CartItem[], settings: StoreSettings, link = "") {
  const template = settings.cart_order_template.trim() || DEFAULT_CART_TEMPLATE;
  return renderTemplate(template, cartOrderVars(items, settings, link));
}

export function whatsappUrl(number: string, message: string) {
  const digits = (number || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
