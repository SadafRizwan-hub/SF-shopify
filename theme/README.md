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

## Read this first: what the price you type means

A Shopify cart line quantity is a **whole number** — it cannot hold 6.5. So one
unit of stock is one **cut unit**, and a variant's price is the rate for that
unit. Shopify multiplies the two at checkout and nothing in a theme can change
that, which makes the cut unit the one decision everything else follows from.

Set it in **Theme settings → The counter → One cut unit is**.

| Cut unit | The price you type | Inventory of `40` | Cuts in |
|---|---|---|---|
| **1 m** (default) | **is the rate per metre** — type `200`, the page shows `Rs 200.00/m` | 40 m | whole metres |
| 0.5 m | is the rate per **half** metre — a cloth at `200/m` is entered as `100` | 20 m | half metres |

**You cannot have both**: typing the per-metre rate *and* cutting in half
metres would mean charging a full metre's price for half a metre. Getting both
needs a Shopify Function to reprice the line, which is outside a theme.

The default is 1 m because that is the one that cannot be entered wrong. Only
move to 0.5 m if half-metre cutting matters more than the entry being obvious —
and if you do, go back through every variant and halve its price, or every cut
bills at double.

## The design taxonomy

Shopify has no concept of a design, and none of a category of designs. So the
counter's own is built from two native pieces and needs no app:

| The counter calls it | Shopify carries it as |
|---|---|
| **a design** — one drawing, e.g. *Floral Printed* | a **collection** whose handle starts with `design-` |
| **a family** — the category it belongs to, e.g. *Florals* | the collection metafield **`custom.design_family`** |

Collections are the right carrier for a design: a real URL, real product
membership, pagination and native filtering all come free, and a product sits
under a design simply by being in that collection.

### Setting it up

1. **Settings → Custom data → Collections → Add definition.** Name it
   `Design family`, namespace and key **`custom.design_family`**, type
   *Single line text* — or *Single line text (list)* if you prefer picking
   several. Tick **Storefront API access** if the headless front should read it
   too.
2. Make a collection per design, handle `design-floral-printed`, and add the
   cloth it is printed on.
3. Fill `custom.design_family` on it — `Florals`, or `Florals, Block prints`
   for a design that belongs to more than one. A list metafield works as-is.
4. Give the collection an image and a one-line description; the book uses both.

That is the whole taxonomy. A design left unfiled still appears in the book —
it just cannot be reached by family.

### What it drives

- **The design book** (`page.design-book`) shows a chip per family, filters in
  the browser, and writes `?family=<slug>` so a family can be sent to someone.
  A family nothing is filed under never gets a chip.
- **A design page** (`collection.design`) names its families under the title,
  each linking back into the book filtered to it, and ends with up to four
  other designs in the same family.
- **The catalog** gains a **Design family** facet beside Fabric, Colour and
  Design, so the grid can be narrowed to a whole category rather than one
  drawing.

Families are always theme-side, because Shopify has nothing to filter on — the
facet lists only the families something on the page is actually filed under.

## One photograph per shade

Attach a photograph to a **variant** in the admin (Products → the product →
Variants → the shade → its image) and the whole site starts answering in
colour:

- On the **fabric page**, picking that shade moves the main photograph to it.
- On the **catalog**, filtering by that colour shows each card in that colour —
  the grid is answering "show me the black ones", so it has to look like it.
- Filtering server-side (a Search & Discovery colour filter) and filtering in
  the browser both do this; the server picks the photo while rendering, the
  browser swaps it from a per-shade map on the card.

A shade with no image of its own keeps the product's default photograph. That
is deliberate: showing the wrong colour is worse than showing a generic one.

This is the one part of the colour story that is data, not code — without
variant images there is nothing to switch to, and every shade looks the same.

## Setting up stock

Stock is counted in **cut units**, so at the default of 1 m an inventory of 40
is 40 metres. The fabric page turns it back into metres everywhere it shows it.

For each product:

1. **Variants → tick every variant → Inventory.** Turn **Track quantity** on.
   Without it Shopify reports no quantity, the theme cannot say how many metres
   are on the shelf, and the Stock line reads `in stock` with nothing behind it.
2. **Set the available quantity** to the metres you hold of that shade. Shopify
   counts per location; if the godown is a second location, add it there too.
3. **"Continue selling when out of stock"** — leave it **off** if the than is
   finite and you would rather the shade struck through than oversell. Turn it
   **on** for a cloth you can always reorder; the shade then stays sellable at
   zero.
4. Prices are per variant, so a shade dyed at a different rate carries its own.

What the theme does with it:

- **Sold-out shades** strike through in the picker and cannot be chosen — a
  shade is only struck through when nothing under it is sellable.
- **`Low stock`** appears on a card and on the fabric page when the metres left
  fall at or below **Theme settings → The counter → Low stock below this many
  metres** (default 25).
- **`Out of stock`** disables Add to cut list. The button in your screenshot
  said this because every variant was at 0 with tracking on.
- The **Stock** cell in the specs table reads `inventory x cut unit`.

Per-shade minimums are separate from stock: the variant metafield
`custom.min_cut` sets the smallest cut in **metres** for that shade, and the
stepper will not go below it.

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
   The header's navigation is your **Main menu** (Navigation → Main menu) —
   edit it there, as in any Shopify theme. Only when no menu has any links
   does the header fall back to built-in Home / Catalog / Designs / The shop
   doors, so a fresh import is never left without a nav.

   The same links appear behind a menu button on phones: below 900px the bar
   has no room for them, so they move into a drawer rather than disappearing.
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
4. **Filters.** The catalog always offers the counter's three facets —
   **Fabric** (product type), **Colour** (the Shade option) and **Design**
   (the Design option, or a `design-*` collection) — and serves each of them
   one of two ways:

   - **Native.** Install **Search & Discovery** and add a filter for that
     facet. Shopify then filters server-side, across the whole collection and
     through pagination. Always preferred, and the rail renders it as links
     that work with JavaScript off.
   - **Theme-side.** No such filter configured, so the rail builds that facet
     from the products on the page and filters the grid in the browser. This
     is why colour, design and fabric work on a shop with no app installed —
     but it only spans the products currently rendered, and the rail says so
     once a collection runs past one page.

   Any other filter the store defines (price, availability, vendor) is
   rendered below the three, so nothing is lost by this.
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

## Which build is installed

A re-uploaded ZIP does **not** update a theme already in the admin — Shopify
adds it as a separate theme, and an old preview link keeps serving the old
one. Two ways to tell which build you are looking at:

- **Online Store → Themes** shows the theme's version next to its name.
- **View source** on any page: the fourth line is
  `<!-- Singhania Fabrics theme, build X.Y.Z -->`.

If that number is not the one in `config/settings_schema.json`, the preview is
running an older upload and no amount of fixing will show up in it.

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
