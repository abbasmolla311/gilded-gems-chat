# Luxury Jewellery Store + WhatsApp Commerce

An ivory-and-gold boutique storefront where customers browse jewellery, build a cart, and send their order straight to your WhatsApp — plus a private dashboard for you to manage products, prices and stock.

## Look and feel

- Ivory base, warm gold accents, deep espresso text; thin gold hairlines and soft shadows.
- Serif display headings (Cormorant) with a clean sans for details (Karla).
- Generous whitespace, large product photography, subtle fade-and-lift on hover.

## Customer side

1. **Home** — hero, the four collections (Gold, Silver, Diamond, Bridal), featured pieces, trust strip.
2. **Collection pages** — grid with filters by purity, weight range and price; "in stock / made to order" labels.
3. **Product page** — gallery, purity (22K/18K/925), gross and net weight, stone details, making charges, live price breakdown (metal value + making charges + GST estimate), plus:
   - **Order on WhatsApp** — opens WhatsApp with a neatly formatted message: item name, code, purity, weight, making charges, price.
   - **Add to cart**.
4. **Cart** — multiple items, quantity, running total, single **Send order on WhatsApp** button that sends the whole itemised list with totals.

## Admin side

- Private sign-in (email + password) at `/auth`; only admin accounts reach the dashboard.
- Manage products: add, edit, hide, upload photo, set purity, weights, making charge, price, stock count, collection.
- Manage collections and metal rates (per-gram gold/silver rate used in price calculation).
- Stock overview with low-stock highlighting.
- **Settings page** — edit at any time, saved instantly:
  - Store name and tagline (shown in the header, footer and page titles).
  - WhatsApp contact number (used by every order button).
  - Two editable message templates — one for a single-item order/enquiry, one for a cart order — with simple placeholders like `{store}`, `{item}`, `{purity}`, `{weight}`, `{price}`, `{items}`, `{total}`, plus a live preview of the resulting message.

## Assumptions (tell me to change any)

- All text on the site is in English.
- Store name placeholder: **Aurelia Fine Jewellery**; WhatsApp number is a placeholder until you set the real one in Settings.
- Prices in INR, GST shown as an estimate line.
- Sample catalogue of ~16 pieces with generated imagery so the store looks real from the first load.

## Technical notes

- Lovable Cloud enabled for database, auth and image storage.
- Tables: `products`, `collections`, `metal_rates`, `store_settings` (single row: store name, tagline, WhatsApp number, `single_order_template`, `cart_order_template`); public read via narrow anon SELECT policies; writes restricted to admins via a separate `user_roles` table and `has_role()` security-definer function (no roles on profiles).
- Admin dashboard under `_authenticated/` with a role check; all writes through `createServerFn` with `requireSupabaseAuth` + role verification.
- Cart in browser local storage (no account needed to order).
- WhatsApp links via `https://wa.me/<number>?text=<encoded>`; one template renderer resolves `{...}` placeholders from settings, used by both single-item and cart checkout, with sensible defaults if a template is blank.
- Routes: `/`, `/collections/$slug`, `/product/$slug`, `/cart`, `/auth`, `/admin`, `/admin/products`, `/admin/stock`, `/admin/settings`; each public route gets its own head metadata.
