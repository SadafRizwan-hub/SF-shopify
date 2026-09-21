/*
 * The shade dictionary.
 *
 * Shopify stores an option value as a NAME ("Indigo"), never a colour — there
 * is no hex on a variant option. So the swatches in ShadeDots / ShadePicker /
 * FilterPanel are coloured from this table, matched on the slug of the option
 * value the admin typed.
 *
 * To add a shade: add a row here. An option value with no row still works —
 * the adapter registers it with a neutral grey so the shopper sees the name
 * and nothing crashes — it just won't carry its real colour until it is listed.
 */

export const SHADES = [
  { id: 'white', name: 'White', hex: '#f7f4ee' },
  { id: 'off-white', name: 'Off white', hex: '#ece5d8' },
  { id: 'ecru', name: 'Ecru', hex: '#ded3bd' },
  { id: 'beige', name: 'Beige', hex: '#cdbb9d' },
  { id: 'sand', name: 'Sand', hex: '#c2a883' },
  { id: 'camel', name: 'Camel', hex: '#ab8256' },
  { id: 'mustard', name: 'Mustard', hex: '#c8952b' },
  { id: 'haldi', name: 'Haldi', hex: '#e0a92b' },
  { id: 'gold', name: 'Gold', hex: '#bb9540' },
  { id: 'peach', name: 'Peach', hex: '#e8b49a' },
  { id: 'coral', name: 'Coral', hex: '#d97757' },
  { id: 'rust', name: 'Rust', hex: '#a9512a' },
  { id: 'terracotta', name: 'Terracotta', hex: '#b5542e' },
  { id: 'maroon', name: 'Maroon', hex: '#6d2230' },
  { id: 'rani-pink', name: 'Rani pink', hex: '#c2185b' },
  { id: 'rose', name: 'Rose', hex: '#d38a9a' },
  { id: 'lilac', name: 'Lilac', hex: '#b7a3c6' },
  { id: 'purple', name: 'Purple', hex: '#6b3f8f' },
  { id: 'navy', name: 'Navy', hex: '#26344f' },
  { id: 'indigo', name: 'Indigo', hex: '#33477a' },
  { id: 'sky', name: 'Sky', hex: '#a8c4dc' },
  { id: 'teal', name: 'Teal', hex: '#1f6f6b' },
  { id: 'firozi', name: 'Firozi', hex: '#3fa9a3' },
  { id: 'mint', name: 'Mint', hex: '#bcd6c0' },
  { id: 'pista', name: 'Pista', hex: '#c3cf9a' },
  { id: 'olive', name: 'Olive', hex: '#6f7442' },
  { id: 'bottle-green', name: 'Bottle green', hex: '#1f4d35' },
  { id: 'grey', name: 'Grey', hex: '#9a9791' },
  { id: 'charcoal', name: 'Charcoal', hex: '#44423f' },
  { id: 'black', name: 'Black', hex: '#1c1a18' },
]

/** Option values arrive as typed text; the slug is the join key. */
export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Shown for a shade nobody has given a colour to yet. */
export const UNKNOWN_SHADE_HEX = '#b9b3a8'
