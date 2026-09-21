/**
 * Formats a Shopify MoneyV2 ({ amount, currencyCode }) for display.
 */
export function formatMoney(money, locale = 'en-US') {
  if (!money) return ''
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currencyCode,
  }).format(Number(money.amount))
}

/**
 * "From $20.00" style label for a product with a variant price range.
 */
export function formatPriceRange(priceRange, locale = 'en-US') {
  if (!priceRange) return ''
  const { minVariantPrice, maxVariantPrice } = priceRange
  const min = formatMoney(minVariantPrice, locale)
  if (!maxVariantPrice || minVariantPrice.amount === maxVariantPrice.amount) return min
  return `From ${min}`
}
