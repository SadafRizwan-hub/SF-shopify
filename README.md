# Singhania Fabrics — headless storefront

The Singhania Fabrics counter as a Nuxt 3 storefront on the Shopify Storefront
API. Runs locally; no hosting provider config is included.

```bash
npm install
cp .env.example .env    # add your store domain + Storefront token
npm run dev             # http://localhost:3000
npm test                # the Shopify → fabric translation
```

Running `dev` before the credentials are in place is fine: the pages render
their own empty states, and a notice at the bottom of the screen names the
variable that is missing. That notice only ever appears under `nuxt dev`.

## Read this first: cloth is sold in half metres

A Shopify cart line quantity is a **whole number** — it cannot hold 6.5. So
**one unit of stock is half a metre**, and a variant's price is the rate for
that half metre.

> A cloth at **₹240/m** is entered in Shopify as **120**.

The UI multiplies back up: rates shown are `variantPrice / 0.5`, metres are
`quantity * 0.5`. The constant is `UNIT_METRES` in `composables/catalogStore.js`
and it is the only place that conversion happens. Get this wrong in the admin
and every cut is billed at half price.

## How a fabric is entered in Shopify

| Shopify field | Becomes |
|---|---|
| product | one quality, e.g. `Mercerized Cambric 44"` |
| product type | the fabric-type filter chip |
| option **Design** | one value per design it is printed on (optional) |
| option **Shade** | one value per dyed colour, matched to `data/shades.js` |
| collection `design-*` | the design book entry — its image and tag line |
| variant price | the rate for **one half metre** |
| variant metafield `custom.min_cut` | per-shade MOQ in metres |
| product metafield `custom.subtitle` | the line under the name |
| product metafield `custom.width` | e.g. `44"` |
| product metafield `custom.note` | counter note on the fabric page |
| product metafield `custom.price_slabs` | `[{"from":10,"price":210}]` wholesale rungs |

Metafields must have **Storefront API access** enabled on their definition or
they read back as null.

**Shade colours come from `data/shades.js`**, not Shopify — Shopify stores an
option value as a name (`"Indigo"`), never a hex. Add a row there for each
shade you dye. An unlisted shade still works; it just shows a neutral swatch
until you list it.

## Layout

```
composables/
  catalogStore.js   ← THE ONLY FILE THAT KNOWS ABOUT SHOPIFY
  store.js          search, filters, shortlist, cut list, toasts
  queries.js        GraphQL documents
  useShopify.js     client + error wrapper
stores/cart.js      Shopify Cart API — the cut list's backing store
data/shades.js      shade name → hex
data/photos.js      the shop's own photography (public/photos/)
components/         your ten components, unchanged in look
pages/              home, catalog, fabrics/[code], designs, designs/[id],
                    cut-list, shortlist, about
assets/css/base.css design tokens + the global primitives
test/               guards the Shopify → fabric translation
```

Every component and page speaks `fabric` / `designGroups` / `slabs`. Shopify's
own shape stops at `catalogStore.js`, so changing how stock is entered — a new
metafield, a renamed option — touches that one file and nothing else.

## Three limits to know about

These are live in the UI but **not enforced at checkout**:

1. **Slab pricing is display-only.** `fabric.slabs` renders the rungs and the
   fabric page totals against the selected tier, but Shopify's cart does not
   apply tier pricing on standard plans. **The shopper can be shown ₹210/m and
   charged ₹240/m.** To close it: a Shopify Function (product discount), or
   automatic quantity discounts mirroring each rung, or B2B quantity rules
   (Plus). Until then the tier is a quote, not a price.
2. **Per-shade MOQ is client-side only.** `custom.min_cut` drives the stepper
   floor; nothing stops a crafted cart from going under it.
3. **Order confirmation is Shopify's own page.** Its hosted checkout ends on a
   thank-you page you don't control, and the Storefront API cannot read an
   arbitrary order without customer accounts. There is no `/order/…` route here.

Checkout itself is Shopify's: it collects the customer's name, address and
payment, and calculates shipping from its own rules. Set the free-over-₹2,000
threshold as a Shopify shipping rate — `FREE_OVER` in `pages/cut-list.vue`
only prints the message, it does not price anything.

The ₹20 swatch card expects an ordinary Shopify product with handle
`swatch-card`; until it exists the button says so.

## Commands

| Command | Does |
|---|---|
| `npm run dev` | dev server, HMR |
| `npm test` | adapter tests |
| `npm run build` | server build into `.output/` |
| `npm run generate` | static site into `.output/public/` |

`generate` prerenders `/` and crawls the fabric and design links from it.
Rates and stock in static output are frozen at build time.
