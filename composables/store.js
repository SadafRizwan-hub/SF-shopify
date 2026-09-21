/*
 * Counter-side UI state: what is typed in the search box, which filters are
 * applied, what has been shortlisted, and where a tap should go.
 *
 * The original SPA kept its own `route` object and a `go()` that swapped it.
 * Nuxt owns routing here — real URLs, shareable on WhatsApp, prerenderable —
 * so `go()` is now just a translation from the old route names to paths.
 */
import { computed, reactive } from 'vue'
import { UNIT_METRES, designGroupFor, fabricById, shadeById } from '~/composables/catalogStore'
import { slugify as slugifyValue } from '~/data/shades'
import { useCartStore } from '~/stores/cart'

const SAVED_KEY = 'sf:shortlist'

export const store = reactive({
  search: '',
  sort: 'featured',
  sheetOpen: false,
  filters: {
    fabrics: [],
    colours: [],
    designs: [],
  },
  /** fabric codes, newest first. Hydrated on the client by plugins/shortlist. */
  saved: [],
})

export function resetFilters() {
  store.filters.fabrics = []
  store.filters.colours = []
  store.filters.designs = []
}

export const filterCount = computed(() =>
  store.filters.fabrics.length + store.filters.colours.length + store.filters.designs.length)

/** Route names the old SPA used → the paths this app serves. */
const PATHS = {
  home: () => '/',
  catalog: () => '/catalog',
  designs: () => '/designs',
  design: id => `/designs/${id}`,
  fabric: code => `/fabrics/${code}`,
  cutlist: () => '/cut-list',
  saved: () => '/shortlist',
  about: () => '/about',
}

/** Path for a route name, so links can be real hrefs, not click handlers. */
export function path(name, arg) {
  const build = PATHS[name]
  if (!build) throw new Error(`Unknown route: ${name}`)
  return build(arg)
}

export const go = (name, arg) => navigateTo(path(name, arg))

// --- shortlist ------------------------------------------------------------

export const isSaved = code => store.saved.includes(code)

export function toggleSave(code) {
  const i = store.saved.indexOf(code)
  if (i === -1) store.saved.unshift(code)
  else store.saved.splice(i, 1)
  persistShortlist()
}

function persistShortlist() {
  if (import.meta.server) return
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(store.saved))
  }
  catch {
    /* private mode or a full quota — the shortlist just won't outlive the tab */
  }
}

export function restoreShortlist() {
  if (import.meta.server) return
  try {
    const raw = localStorage.getItem(SAVED_KEY)
    if (raw) store.saved = JSON.parse(raw).filter(c => typeof c === 'string')
  }
  catch {
    store.saved = []
  }
}

// --- cut list -------------------------------------------------------------

/** Number of distinct cuts on the list — what the header pip shows. */
export const cutListCount = computed(() => useCartStore().lines.length)

/**
 * Adds a cut. `stockUnitId` is the Shopify variant for this design+shade;
 * when the caller doesn't have it (an older card, a stale group) it is looked
 * up again rather than guessed, because adding the wrong variant means
 * cutting the wrong colour.
 */
export function addToCutList(code, shadeId, metres, designSlug, stockUnitId) {
  const variantId = stockUnitId || resolveVariant(code, designSlug, shadeId)
  if (!variantId) {
    console.error('[cut list] no stock unit for', { code, designSlug, shadeId })
    return Promise.resolve(false)
  }
  /* metres → cut units, since a Shopify line quantity must be a whole number */
  const units = Math.max(1, Math.round(metres / UNIT_METRES))
  return useCartStore().addLine(variantId, units)
}

function resolveVariant(code, designSlug, shadeId) {
  const group = designGroupFor(fabricById(code), designSlug)
  return group?.shadeStock?.[shadeId]?.stockUnitId ?? null
}

const SHADE_AXIS = ['shade', 'shades', 'colour', 'colours', 'color', 'colors']
const DESIGN_AXIS = ['design', 'designs', 'pattern', 'patterns']

/*
 * The cut list, read back out of the Shopify cart.
 *
 * A cart line holds a variant and a whole-number quantity; the metres, the
 * shade and the design are recovered from the variant's own options, so the
 * list survives a page reload with nothing kept on this side.
 */
export const cutList = computed(() => {
  const cart = useCartStore()
  return cart.lines.map((line) => {
    const m = line.merchandise
    const code = m.product.handle
    const fabric = fabricById(code)
    const axis = names => m.selectedOptions
      ?.find(o => names.includes(o.name.trim().toLowerCase()))?.value ?? null

    const shadeValue = axis(SHADE_AXIS)
    const designValue = axis(DESIGN_AXIS)
    const shadeId = shadeValue ? slugifyValue(shadeValue) : 'plain'
    const designSlug = designValue
      ? slugifyValue(designValue)
      : fabric?.designGroups?.[0]?.slug

    return {
      key: line.id,
      lineId: line.id,
      fabricId: code,
      fabric,
      shadeId,
      shade: shadeById[shadeId] ?? { name: m.title, hex: null },
      designSlug,
      designName: fabric && fabric.designGroups.length > 1
        ? designGroupFor(fabric, designSlug)?.name
        : null,
      units: line.quantity,
      metres: line.quantity * UNIT_METRES,
      total: Number(line.cost.totalAmount.amount),
      currency: line.cost.totalAmount.currencyCode,
      unitPrice: Number(m.price.amount) / UNIT_METRES,
    }
  })
})

export const cutListMetres = computed(() =>
  cutList.value.reduce((t, l) => t + l.metres, 0))

export const cutListTotal = computed(() =>
  cutList.value.reduce((t, l) => t + l.total, 0))

/** Moves a line to a new length, in metres. Rounds to the half metre. */
export function setMetres(lineId, metres) {
  const units = Math.max(1, Math.round(metres / UNIT_METRES))
  return useCartStore().updateLine(lineId, units)
}

export const removeLine = lineId => useCartStore().removeLine(lineId)

export function clearCutList() {
  const cart = useCartStore()
  return Promise.all(cart.lines.map(l => cart.removeLine(l.id)))
}

/**
 * The ₹20 shade card. It is an ordinary Shopify product (handle `swatch-card`)
 * so it can be priced, taxed and shipped like anything else; when it has not
 * been created yet the button says so instead of failing silently.
 */
export async function addSwatch() {
  const swatch = fabricById('swatch-card')
  const variantId = swatch?.variants?.[0]?.id
  if (!variantId) {
    flash('Shade cards aren’t set up yet — message us on WhatsApp and we’ll post one.')
    return false
  }
  await useCartStore().addLine(variantId, 1)
  flash('Shade card added to your cut list')
  return true
}

// --- transient messages ---------------------------------------------------

export const toast = reactive({ message: '', at: 0 })

export function flash(message) {
  toast.message = message
  toast.at = Date.now()
  if (import.meta.client) {
    const at = toast.at
    setTimeout(() => { if (toast.at === at) toast.message = '' }, 4000)
  }
}
