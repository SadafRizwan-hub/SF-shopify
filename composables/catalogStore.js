/*
 * The catalog, in the shape the UI was built against.
 *
 * ── THIS IS THE ONLY FILE THAT KNOWS ABOUT SHOPIFY ──
 * Every view and component below speaks `fabric` / `designGroups` / `slabs`.
 * Shopify's own shape stops here, so a change to how stock is entered — a new
 * metafield, a renamed option — is a change to this file and nothing else.
 *
 * How a fabric is expected to be entered in Shopify:
 *
 *   product              one quality (e.g. "Mercerized Cambric 44\"")
 *   product type         the quality name — becomes the fabric type filter
 *   option "Design"      optional; one value per design it is printed on
 *   option "Shade"       one value per dyed colour (matched to data/shades.js)
 *   collection design-*  the design book entry, for its thumbnail and tag
 *   variant price        THE RATE FOR ONE CUT UNIT (0.5 m) — see UNIT_METRES
 *   variant metafield    custom.min_cut     per-shade MOQ in metres
 *   product metafield    custom.subtitle    the line under the name
 *                        custom.width       e.g. '44"'
 *                        custom.note        counter note shown on the page
 *                        custom.price_slabs [{"from":10,"price":210}] wholesale
 *
 * `catalog` is module-level reactive state, not per-request state: it holds
 * the public catalogue, identical for every visitor, so one shared copy is
 * correct and saves refetching on every navigation.
 */
import { computed, reactive } from 'vue'
import { CATALOG_QUERY, FABRIC_QUERY } from './queries.js'
import { shopifyRequest } from './useShopify.js'
import { SHADES, UNKNOWN_SHADE_HEX, slugify } from '../data/shades.js'

/*
 * Cloth is sold in half metres, but a Shopify cart line quantity is an
 * INTEGER — it cannot hold 6.5. So one unit of stock is half a metre, and a
 * variant's price is the rate for that half metre. Metres shown anywhere in
 * the UI are `quantity * UNIT_METRES`, and the per-metre rate the shopper
 * reads is `variantPrice / UNIT_METRES`.
 *
 * Consequence for the admin: a cloth at ₹240/m is entered in Shopify as 120.
 */
export const UNIT_METRES = 0.5

/** Collections whose handle starts with this are design-book entries. */
const DESIGN_PREFIX = 'design-'

const SHADE_OPTIONS = ['shade', 'shades', 'colour', 'colours', 'color', 'colors']
const DESIGN_OPTIONS = ['design', 'designs', 'pattern', 'patterns']

/** At or below this many metres on the shelf, a card says "low stock". */
export const LOW_STOCK_METRES = 25

export const catalog = reactive({
  fabrics: [],
  fabricTypes: [],
  shades: [],
  designs: [],
  loaded: false,
  /** set when the fetch failed, so the catalog page can say so plainly */
  failed: false,
  /** why it failed, in developer terms — shown by SetupNotice under dev only */
  reason: '',
})

/** id → { id, name, hex }. Seeded from the table, extended by unlisted shades. */
export const shadeById = Object.fromEntries(SHADES.map(s => [s.id, s]))

/** id → design record. An object, not a function — the views index into it. */
export const designById = reactive({})

function ensureShade(value) {
  const id = slugify(value)
  if (!id) return null
  if (!shadeById[id]) shadeById[id] = { id, name: String(value).trim(), hex: UNKNOWN_SHADE_HEX }
  return id
}

const optionNamed = (product, names) =>
  product.options?.find(o => names.includes(o.name.trim().toLowerCase())) ?? null

const valueOf = (variant, names) =>
  variant.selectedOptions.find(o => names.includes(o.name.trim().toLowerCase()))?.value ?? null

const metresOf = variant => (variant.quantityAvailable ?? 0) * UNIT_METRES

/** Rate per metre, from a variant priced per cut unit. */
const perMetre = money => Number(money.amount) / UNIT_METRES

/**
 * Builds the design groups: one per design this fabric is sold under, each
 * carrying its own shade set, its sold-out shades and its per-shade stock.
 * A fabric with no Design option is one group, so both kinds read alike.
 */
function buildDesignGroups(product, variants) {
  const designOption = optionNamed(product, DESIGN_OPTIONS)

  const designCollections = product.collections.nodes
    .filter(c => c.handle.startsWith(DESIGN_PREFIX))
    .map(c => ({ slug: c.handle.slice(DESIGN_PREFIX.length), name: c.title }))

  const groupsFrom = designOption
    ? designOption.optionValues.map(v => ({ slug: slugify(v.name), name: v.name }))
    : designCollections.length
      ? designCollections
      : [{ slug: 'plain', name: 'Plain' }]

  return groupsFrom.map((g) => {
    // variants belonging to this design (all of them when there is no axis)
    const own = designOption
      ? variants.filter(v => slugify(valueOf(v, DESIGN_OPTIONS) ?? '') === g.slug)
      : variants

    const shades = []
    const out = []
    const shadeStock = {}

    for (const v of own) {
      const raw = valueOf(v, SHADE_OPTIONS)
      const id = raw ? ensureShade(raw) : 'plain'
      if (id === 'plain' && !shadeById.plain) {
        shadeById.plain = { id: 'plain', name: 'As shown', hex: UNKNOWN_SHADE_HEX }
      }
      if (!shades.includes(id)) shades.push(id)

      shadeStock[id] = {
        /* the cart line is added against this variant */
        stockUnitId: v.id,
        /* MOQ is per shade — one colour may cut from 0.5 m, another from 1 m */
        minCut: Number(v.minCut?.value) || UNIT_METRES,
        metres: metresOf(v),
        available: v.availableForSale,
        price: perMetre(v.price),
      }
      if (!v.availableForSale && !out.includes(id)) out.push(id)
    }

    // a shade is only struck through if nothing under it is sellable
    const reallyOut = out.filter(id => !shadeStock[id]?.available)

    return { slug: g.slug, name: g.name, shades, out: reallyOut, shadeStock }
  }).filter(g => g.shades.length)
}

/** Wholesale slabs from the product metafield, cheapest rung first. */
function parseSlabs(product) {
  if (!product.priceSlabs?.value) return []
  try {
    const rows = JSON.parse(product.priceSlabs.value)
    return rows
      .map(r => ({ from: Number(r.from), price: Number(r.price) }))
      .filter(r => r.from > 0 && r.price > 0)
      .sort((a, b) => a.from - b.from)
  }
  catch {
    /* a malformed metafield must not take the product page down */
    return []
  }
}

/** Shopify product → the `fabric` object the views expect. */
export function toFabric(product) {
  const variants = product.variants.nodes
  const designGroups = buildDesignGroups(product, variants)

  const price = perMetre(product.priceRange.minVariantPrice)
  const compareAt = variants.find(v => v.compareAtPrice)?.compareAtPrice
  const mrp = compareAt ? perMetre(compareAt) : null
  const metres = variants.reduce((t, v) => t + metresOf(v), 0)
  const slabs = parseSlabs(product)

  return {
    id: product.id,
    /* the handle is the code: it is what cards route on and the shortlist
       stores, and it stays readable in the Shopify admin */
    code: product.handle,
    name: product.title,
    sub: product.subtitle?.value || firstLine(product.description),
    type: slugify(product.productType || 'uncategorised'),
    typeName: product.productType || 'Uncategorised',
    price,
    mrp: mrp && mrp > price ? mrp : null,
    currency: product.priceRange.minVariantPrice.currencyCode,
    designGroups,
    /* flat shade list — the cards and the search read across every design */
    shades: [...new Set(designGroups.flatMap(g => g.shades))],
    slabs,
    /* the first rung, for the "10 m+ at ₹210/m" teaser under the total */
    slab: slabs[0] ?? null,
    width: product.width?.value || '—',
    note: product.note?.value || '',
    stock: !product.availableForSale
      ? 'out of stock'
      : metres > 0 && metres <= LOW_STOCK_METRES ? 'low stock' : 'in stock',
    metres,
    photo: product.featuredImage?.url ?? null,
    images: product.images.nodes,
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    options: product.options,
    variants,
  }
}

function firstLine(text) {
  if (!text) return ''
  const line = text.split('\n').find(l => l.trim())
  return line ? line.trim().slice(0, 90) : ''
}

/** Fetches the counter once and fills `catalog`. Safe to await repeatedly. */
export async function loadCatalog() {
  if (catalog.loaded) return catalog

  try {
    const data = await shopifyRequest(CATALOG_QUERY, { first: 250, collections: 100 })
    const fabrics = data.products.nodes.map(toFabric)

    // Types are whatever the admin typed as product type — never a fixed list
    // that can drift away from what is actually on the shelf.
    const typeNames = new Map()
    for (const f of fabrics) if (!typeNames.has(f.type)) typeNames.set(f.type, f.typeName)

    for (const c of data.collections.nodes) {
      if (!c.handle.startsWith(DESIGN_PREFIX)) continue
      const id = c.handle.slice(DESIGN_PREFIX.length)
      designById[id] = {
        id,
        name: c.title,
        /* the design book's one-line description doubles as its tag */
        tag: firstLine(c.description),
        sub: c.description,
        photo: c.image?.url ?? null,
        count: c.products.nodes.length,
      }
    }

    // A design worn by a fabric but with no collection still needs a record,
    // or the book and the switcher would have nothing to name it by.
    for (const f of fabrics) {
      for (const g of f.designGroups) {
        if (!designById[g.slug]) {
          designById[g.slug] = { id: g.slug, name: g.name, tag: '', photo: null, count: 0 }
        }
      }
    }

    catalog.fabrics = fabrics
    catalog.fabricTypes = [...typeNames].map(([id, name]) => ({ id, name }))
    catalog.shades = Object.values(shadeById)
      .filter(s => fabrics.some(f => f.shades.includes(s.id)))
    catalog.designs = Object.values(designById)
    catalog.failed = false
    catalog.reason = ''
    catalog.loaded = true
  }
  catch (err) {
    catalog.failed = true
    catalog.reason = err?.statusMessage || err?.message || String(err)
    console.error('[catalog] could not load —', catalog.reason)
  }

  return catalog
}

/**
 * Pulls the full product for one fabric. The card data already on screen is
 * left alone while this lands, so nothing blanks out mid-read.
 */
export async function loadFabric(code) {
  if (!code) return null
  try {
    const data = await shopifyRequest(FABRIC_QUERY, { handle: code })
    if (!data.product) return null
    const fresh = toFabric(data.product)
    const i = catalog.fabrics.findIndex(f => f.code === code)
    if (i === -1) catalog.fabrics.push(fresh)
    else catalog.fabrics[i] = fresh
    return fresh
  }
  catch (err) {
    console.error('[catalog] could not load fabric', code, err)
    return null
  }
}

// --- lookups the views use ------------------------------------------------

export const hasProducts = computed(() => catalog.fabrics.length > 0)
export const fabricById = code => catalog.fabrics.find(f => f.code === code) ?? null
export const typeById = id => catalog.fabricTypes.find(t => t.id === id) ?? null

/** Designs with cloth actually posted under them — never a dead door. */
export function designsInStock() {
  return catalog.designs.filter(d => fabricsForDesign(d.id).length > 0)
}

export function fabricsForDesign(id) {
  return catalog.fabrics.filter(f => f.designGroups.some(g => g.slug === id))
}

export function designGroupFor(fabric, slug) {
  if (!fabric) return null
  return fabric.designGroups.find(g => g.slug === slug) ?? fabric.designGroups[0] ?? null
}

/** The first n fabrics the admin arranged — Shopify's own catalogue order. */
export const featured = (n = 8) => catalog.fabrics.slice(0, n)

/** ₹240 the way the counter writes it. */
export const rupee = n => '₹' + Number(n).toLocaleString('en-IN')
