import assert from 'node:assert/strict'
import { test } from 'node:test'
import { UNIT_METRES, toFabric } from '../composables/catalogStore.js'

/*
 * Guards the Shopify → fabric translation, which is where the money math
 * lives. A variant is half a metre of cloth, so every rate the shopper reads
 * is the variant price doubled — get that wrong and the counter undercharges
 * on every cut.
 */

/* A cambric at ₹240/m sold in half metres → the variant price is 120.
   Two designs, two shades each; one shade sold out; one with a 1 m MOQ. */
const v = (id, design, shade, { price = '120.00', avail = true, qty = 200, minCut = null } = {}) => ({
  id, title: `${design} / ${shade}`, availableForSale: avail, quantityAvailable: qty,
  image: null, price: { amount: price, currencyCode: 'INR' }, compareAtPrice: { amount: '150.00', currencyCode: 'INR' },
  selectedOptions: [{ name: 'Design', value: design }, { name: 'Shade', value: shade }],
  minCut: minCut ? { value: String(minCut) } : null,
})

const product = {
  id: 'gid://shopify/Product/1', handle: 'cambric-44', title: 'Mercerized Cambric 44"',
  description: 'Fine mercerized cotton, soft finish.\nSecond line ignored.',
  descriptionHtml: '<p>Fine mercerized cotton</p>', productType: 'Mercerized Cotton', tags: [],
  availableForSale: true,
  subtitle: { value: '44" · 100% cotton' },
  width: { value: '44"' }, note: { value: 'Dye lot moves; order a card first.' },
  priceSlabs: { value: '[{"from":10,"price":210},{"from":25,"price":195}]' },
  featuredImage: { url: 'https://cdn/x.jpg', altText: null, width: 800, height: 1000 },
  images: { nodes: [] },
  collections: { nodes: [{ handle: 'design-hakoba', title: 'Hakoba' }] },
  options: [
    { name: 'Design', optionValues: [{ name: 'Hakoba' }, { name: 'Plain' }] },
    { name: 'Shade', optionValues: [{ name: 'Indigo' }, { name: 'Rani Pink' }] },
  ],
  priceRange: { minVariantPrice: { amount: '120.00', currencyCode: 'INR' } },
  variants: { nodes: [
    v('gid://v/1', 'Hakoba', 'Indigo', { minCut: 1 }),
    v('gid://v/2', 'Hakoba', 'Rani Pink', { avail: false, qty: 0 }),
    v('gid://v/3', 'Plain', 'Indigo', { qty: 20 }),
    v('gid://v/4', 'Plain', 'Rani Pink'),
  ] },
  seo: { title: null, description: null },
}

test('a fabric translates out of a Shopify product', () => {
  const f = toFabric(product)

  assert.equal(UNIT_METRES, 0.5)
  // a variant priced 120 for half a metre is a ₹240/m cloth
  assert.equal(f.price, 240)
  assert.equal(f.mrp, 300)
  assert.equal(f.sub, '44" · 100% cotton')
  assert.equal(f.type, 'mercerized-cotton')
  assert.equal(f.width, '44"')
  assert.equal(f.metres, 210, '420 units of half a metre')
  assert.equal(f.stock, 'in stock')
  assert.deepEqual(f.shades, ['indigo', 'rani-pink'], 'de-duped across designs')
  assert.deepEqual(f.slabs, [{ from: 10, price: 210 }, { from: 25, price: 195 }])
})

test('each design carries its own shades, stock and MOQ', () => {
  const f = toFabric(product)
  assert.equal(f.designGroups.length, 2)

  const [hakoba, plain] = f.designGroups
  assert.deepEqual(hakoba.shades, ['indigo', 'rani-pink'])
  assert.deepEqual(hakoba.out, ['rani-pink'], 'sold out under this design only')
  assert.equal(hakoba.shadeStock.indigo.minCut, 1, 'per-shade MOQ from the metafield')
  assert.equal(plain.shadeStock.indigo.minCut, 0.5, 'falls back to one cut unit')
  assert.equal(plain.shadeStock['rani-pink'].stockUnitId, 'gid://v/4', 'the variant the cart line adds')
})

test('a malformed slab metafield does not take the page down', () => {
  assert.deepEqual(toFabric({ ...product, priceSlabs: { value: '{oops' } }).slabs, [])
})

test('low stock is measured in metres, not units', () => {
  const low = toFabric({ ...product, variants: { nodes: [v('gid://v/9', 'Plain', 'Indigo', { qty: 30 })] } })
  assert.equal(low.stock, 'low stock', '30 units is 15 m')
})

test('a fabric with no Design option still yields one group', () => {
  const plain = toFabric({
    ...product,
    options: [{ name: 'Shade', optionValues: [{ name: 'Indigo' }] }],
    variants: { nodes: [{ ...v('gid://v/7', 'x', 'Indigo'), selectedOptions: [{ name: 'Shade', value: 'Indigo' }] }] },
  })
  assert.deepEqual(plain.designGroups.map(g => g.slug), ['hakoba'], 'named by its design collection')
})

test('an unlisted shade name still resolves, with a neutral swatch', () => {
  const odd = toFabric({
    ...product,
    options: [{ name: 'Shade', optionValues: [{ name: 'Gandhi Ashram Grey' }] }],
    variants: { nodes: [{ ...v('gid://v/8', 'x', 'Gandhi Ashram Grey'), selectedOptions: [{ name: 'Shade', value: 'Gandhi Ashram Grey' }] }] },
  })
  assert.deepEqual(odd.shades, ['gandhi-ashram-grey'])
})
