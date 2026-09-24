# Singhania Fabrics — Shopify theme (Liquid)

The Liquid twin of the Nuxt storefront in the root of this repository. Same
counter, same design, same data model — one is served by Shopify's Online
Store, the other by a headless front on the Storefront API. Either can be the
public face of the shop, and both read exactly the same products, `design-*`
collections and `custom.*` metafields, so the admin never has to keep two
conventions in their head.

## Import it

Shopify's theme import expects a ZIP whose **root** is this directory — not a
ZIP containing a `theme/` folder.

```bash
# from the repository root
./scripts/package-theme.sh          # writes dist/sf-shopi-theme.zip
```

Then in the admin: **Online Store → Themes → Add theme → Upload zip file**,
pick `dist/sf-shopi-theme.zip`, and preview before publishing.

Working on it with the CLI instead:

```bash
cd theme
shopify theme dev --store your-store.myshopify.com
shopify theme push
```

## Read this first: cloth is sold in half metres

A Shopify cart line quantity is a **whole number** — it cannot hold 6.5. So
**one unit of stock is half a metre**, and a variant's price is the rate for
that half metre.

> A cloth at **₹240/m** is entered in Shopify as **120**.

Everything the shopper reads is converted back up: rates are
`variant price / cut unit`, metres are `quantity × cut unit`. The constant is
**Theme settings → The counter → Metres in one cut unit**, and it must match
`UNIT_METRES` in the headless storefront's `composables/catalogStore.js`. Get
it wrong in the admin and every cut is billed at half price.

## How a fabric is entered in Shopify

Identical to the headless storefront — this theme adds no new conventions.

| Shopify field | Becomes |
|---|---|
| product | one quality, e.g. `Mercerized Cambric 44"` |
| product type | the fabric-type filter chip |
| option **Design** | one value per design it is printed on (optional) |
| option **Shade** | one value per dyed colour, matched to the shade table |
| collection `design-*` | the design book entry — its image and tag line |
| variant price | the rate for **one cut unit** (half a metre) |
| variant metafield `custom.min_cut` | per-shade MOQ in metres |
| product metafield `custom.subtitle` | the line under the name |
| product metafield `custom.width` | e.g. `44"` |
| product metafield `custom.note` | counter note on the fabric page |
| product metafield `custom.price_slabs` | `[{"from":10,"price":210}]` wholesale rungs |

The option names are matched loosely: **Shade**, Shades, Colour, Colours,
Color and Colors all read as the shade axis; **Design**, Designs, Pattern and
Patterns as the design axis.

`custom.price_slabs` holds **per-metre rates in major units** — `210` means
₹210 per metre, not 210 paise. That is the same shape the headless storefront
parses.

Metafields need **Storefront API access** enabled on their definition for the
headless front; the Liquid theme reads them either way, so a metafield that
works here can still read back null there.

### Shades

Shopify stores an option value as a **name** (`"Indigo"`), never a hex, so
every swatch on the site is coloured from a table keyed on the handle of what
the admin typed. The built-in table in `snippets/shade-table.liquid` mirrors
`data/shades.js` in the headless storefront. Add a shade without touching code
in **Theme settings → Shades → Extra shades**, one `Name:#hex` per line; those
rows also override a built-in of the same name. An unlisted shade still works
— it shows a neutral swatch until it is listed.

## Setting the store up

1. **Pages.** Create three pages and assign their templates:
   - *Design book* → template `page.design-book`
   - *Shortlist* → template `page.shortlist`
   - *The shop* → template `page.the-shop`
   Use exactly those handles — `design-book`, `shortlist`, `the-shop` — and
   the header and the mobile tabs pick them up on their own; a nav link whose
   page does not exist is hidden rather than left pointing at a 404.
2. **Header and footer.** Only needed to override the above: point the
   header's Catalog / Designs / The shop / Shortlist links somewhere else
   (Theme editor → Header), or set the two footer columns to specific menus.
   An unset footer column falls back to the store's own footer menu.
   Until a collection is chosen, the hero and *By the metre* both read from
   the whole shelf, so a freshly imported theme shows real stock rather than
   an empty page.
3. **Design collections.** Give each design collection a handle starting with
   `design-` and assign it the **design** collection template. Collections
   with no products are never shown — a design with nothing under it opens
   onto nothing.
4. **Filters.** Install **Search & Discovery** and add filters for Product
   type, the Shade option, the Design option and price. The catalog's rail and
   its mobile sheet are built from whatever filters the store defines, so no
   filter is hardcoded here.
5. **Free delivery.** Theme settings → The counter → *Free delivery over* only
   prints the threshold. Set the matching rate in **Settings → Shipping**, or
   the cut list will promise something checkout does not honour.
6. **Swatch card.** The shade card is an ordinary product; put its handle in
   Theme settings so the design pages can link to it.

## Three limits to know about

The same three the headless storefront has, for the same reasons.

1. **Slab pricing is display-only.** The fabric page renders the rungs and
   totals against the selected tier, but Shopify's cart does not apply tier
   pricing on standard plans. **The shopper can be shown ₹210/m and charged
   ₹240/m.** To close it: a Shopify Function (product discount), automatic
   quantity discounts mirroring each rung, or B2B quantity rules on Plus.
   Until then the tier is a quote, not a price.
2. **Per-shade MOQ is client-side only.** `custom.min_cut` drives the stepper
   floor; nothing stops a crafted cart from going under it.
3. **Checkout is Shopify's.** It collects the name, address and payment and
   prices shipping from its own rules. There is no payment form in this theme
   by design.

## Headless compatibility

This theme is built to sit *beside* a headless front, not instead of it.

- **One data model.** Nothing here needs a metafield, a tag or a naming rule
  the headless storefront does not already use. Stock entered for one front is
  stock entered for both.
- **One cut unit.** `cut_unit_metres` in theme settings is the same constant
  as `UNIT_METRES`. Both fronts turn metres into whole cart units the same
  way, so a cart started on one and finished on the other bills the same.
- **Canonical hand-off.** Theme settings → Headless lets you point canonical
  tags at the headless origin, so the headless site owns the search result
  while Liquid keeps serving checkout, the customer account pages and the
  order status page.
- **Data views.** With *Expose the ?view=json-feed data views* on:

  | URL | Gives |
  |---|---|
  | `/products/<handle>?view=json-feed` | the full `fabric` shape — design groups, per-shade stock unit ids, MOQ, slabs, metres |
  | `/collections/<handle>?view=json-feed` | a paginated card-sized record per product |
  | `/products/<handle>?view=card` | the card markup alone, no layout |

  These let a headless front read this theme with no Storefront API token, and
  let you diff the two fronts when they disagree about a product. Liquid
  cannot set a response `Content-Type`, so they are served as `text/html` with
  a JSON body — parse them, don't content-sniff them. Turn the setting off to
  stop serving them.

## What the home page shows

The hero and *By the metre* read **newest first** by default, so a quality
entered at the counter today is the first thing on the page. Both have an
**Order** setting if you would rather keep a collection's own order.

Liquid hands a theme at most 50 products outside a paginated loop, so
"newest first" is the newest of those 50. Past that size, point the section at
a collection whose own sort order is *Newest first* in the admin — Shopify
then does the sorting and the cap stops mattering.

## Validating a change

The theme passes `shopify theme check` with no errors. Run it before pushing:

```bash
cd theme
shopify theme check
```

Three `RemoteAsset` warnings remain and are deliberate: the wordmark serif and
the body sans are loaded from Google Fonts, exactly as the headless storefront
loads them, so the two fronts render identically. Turn them off in **Theme
settings → Type** to fall back to the local stacks and drop the third-party
request.

Two Liquid rules this theme keeps tripping over, noted so the next change
doesn't reintroduce them:

- **Filters are not allowed on `{% render %}` arguments.** Assign first, pass
  the result.
- **An index cannot carry a filter** — `options[shade_pos | minus: 1]` is a
  syntax error. Worse, a negative index reads the *last* element rather than
  nothing, so `shade_i` is only ever indexed inside an `if shade_pos > 0`.

## Layout

```
layout/theme.liquid        palette from settings → CSS custom properties
assets/base.css            the design tokens and every component's styles
assets/theme.js            shortlist, toast, money, the filter sheet
assets/fabric-form.js      design / shade / tier / metres on the fabric page
sections/
  header, footer, mobile-tabs, whatsapp     the chrome, as section groups
  hero, quality-chips, featured-fabrics,
  design-book-row, counter-promise          the home page
  main-product + related-fabrics            the fabric page
  main-collection + filter-panel snippet    the catalog
  design-book, main-design                  the design book and one design
  main-cart                                 the cut list
  counter-story, main-page, main-search,
  main-404, shortlist
snippets/
  fabric-card, fabric-surface, shade-dots   what a product looks like
  shade-table, shade-hex                    name → colour, one source of truth
  axis-name, axis-values                    which option is Shade, which Design
  filter-panel, icon
templates/                 JSON templates, the two json-feed views, customers/
```

`snippets/fabric-card.liquid` is the only place a product becomes a card, and
`snippets/shade-table.liquid` the only place a shade becomes a colour — change
either once and the whole site follows.

There is deliberately **no woven-texture stand-in**: a CSS weave drawn for a
product nobody photographed reads as stock we hold. Until the photo is there
the surface stays an empty ground with the fabric's own line on it.
