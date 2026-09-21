# SF Shopify — headless storefront

Nuxt 3 storefront on top of the Shopify Storefront API. Products, collections,
variant selection and cart all come from Shopify; checkout hands off to
Shopify's own hosted checkout page.

This repo is set up to **run locally**. No hosting provider config is included —
see [Going live later](#going-live-later) when you want to deploy.

## 1. Get Shopify credentials

In your Shopify admin:

1. **Settings → Apps and sales channels → Develop apps** (click
   *Allow custom app development* the first time).
2. **Create an app**, name it e.g. `headless-storefront`.
3. **Configuration → Storefront API integration → Configure**, enable at least:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_read_checkouts`
   - `unauthenticated_write_checkouts`
4. Save, then **API credentials → copy the Storefront API access token**.

The Storefront token is read/cart-scoped and safe to ship in frontend code.
An **Admin API token is not** — this project never needs one, keep it out of here.

## 2. Run it locally

```bash
npm install
cp .env.example .env    # then fill in your domain + token
npm run dev             # http://localhost:3000
```

`.env`:

```
NUXT_PUBLIC_SHOPIFY_DOMAIN=yourstore.myshopify.com
NUXT_PUBLIC_SHOPIFY_TOKEN=your-storefront-access-token
```

`.env` is git-ignored. If a page shows *"Could not load data from Shopify"*,
the message underneath tells you which of the two is wrong.

### Storefront API version

Set in `nuxt.config.ts`, overridable with
`NUXT_PUBLIC_SHOPIFY_API_VERSION`. Defaults to `2025-10`. Shopify releases a
new version quarterly and supports each for 12 months; if you see an
*invalid API version* error, bump this to a current one from
<https://shopify.dev/docs/api/usage/versioning>.

## 3. What's here

```
composables/
  useShopify.js        Storefront client + shopifyRequest() error wrapper
  queries.js           all GraphQL documents and fragments
stores/cart.js         Pinia cart: create, add, update, remove, checkout
pages/
  index.vue            shop name, collections, featured products
  collections/[handle].vue
  products/[handle].vue
  cart.vue
components/
  ProductGrid.vue      list of ProductCards
  ProductCard.vue      grid tile
  ProductGallery.vue   main image + thumbnails
  ProductForm.vue      variant options + add to cart
  CartLink.vue         header link with item count
  StorefrontError.vue  visible API failure reason
layouts/default.vue    header / main / footer shell
assets/css/main.css    minimal base styles — the file to replace with your design
utils/money.js         MoneyV2 formatting (auto-imported)
```

### Dropping in your own UI

Markup is plain semantic HTML with stable class names and **no CSS framework
installed**, so nothing fights your styles. Two ways in:

- **Restyle:** overwrite `assets/css/main.css` (or point the `css` array in
  `nuxt.config.ts` at your own files). The class names it targets —
  `.grid--products`, `.card`, `.product`, `.product-form`, `.cart-line`,
  `.button` — are all in the components listed above.
- **Replace markup:** edit each component's `<template>`. The logic lives in
  `<script setup>`, so you can rewrite the template freely as long as you keep
  using the same variables (`product`, `selectedVariant`, `cart.lines`, …).

If your design uses Tailwind, add it with
`npx nuxi module add @nuxtjs/tailwindcss` and delete `main.css` from the `css`
array.

### How the cart works

Shopify's Cart API is used, not the legacy Checkout API. The cart id is kept in
`localStorage` under `shopify:cartId` and no cart is created until the first
item is added. Cart state is browser-only — `cart.restore()` is called from
`onMounted`, and cart UI sits inside `<ClientOnly>` so SSR and static output
stay cacheable. If Shopify no longer recognises the stored cart (expired, or
already checked out) the store clears it and starts fresh.

`cart.goToCheckout()` redirects to Shopify's `checkoutUrl`. You never build a
payment form.

## 4. Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server with HMR at http://localhost:3000 |
| `npm run build` | server build into `.output/` |
| `npm run preview` | run the built server locally |
| `npm run generate` | static site into `.output/public/` |

`npm run generate` prerenders `/` and crawls the product and collection links
it renders, so every linked product gets a static HTML page. Prices and stock
in that output are frozen at build time — rebuild when catalog data changes.

## Going live later

Nothing in the Shopify or Nuxt code changes when you deploy; only the target
does.

- **Static host** (Cloudflare Pages, Netlify, Hostinger `public_html`): build
  command `npm run generate`, publish directory `.output/public`, and set the
  two `NUXT_PUBLIC_*` variables in the host's build environment (or in `.env`
  before building, if there is no build step).
- **Auto-rebuild on catalog changes:** create a build hook on the host, then in
  Shopify **Settings → Notifications → Webhooks** point *Product create /
  update / delete* at that hook URL.
- **Live prices and stock instead of build-time values:** deploy the server
  build (`npm run build`) to a Node host rather than generating static output.
