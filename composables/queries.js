/**
 * GraphQL documents for the Storefront API, kept in one place so fragments
 * stay consistent between listing and detail pages.
 */



export const FABRIC_FRAGMENT = `
  fragment Fabric on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    tags
    availableForSale
    subtitle: metafield(namespace: "custom", key: "subtitle") { value }
    width: metafield(namespace: "custom", key: "width") { value }
    note: metafield(namespace: "custom", key: "note") { value }
    priceSlabs: metafield(namespace: "custom", key: "price_slabs") { value }
    featuredImage { url altText width height }
    images(first: 10) { nodes { url altText width height } }
    collections(first: 20) { nodes { handle title } }
    options { name optionValues { name } }
    priceRange { minVariantPrice { amount currencyCode } }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        quantityAvailable
        image { url altText }
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        selectedOptions { name value }
        minCut: metafield(namespace: "custom", key: "min_cut") { value }
      }
    }
    seo { title description }
  }
`

/* One round trip for the whole counter: every fabric plus the design books.
   The catalogue is small enough (a few hundred bolts) that fetching it once
   and filtering in the browser is faster and calmer than re-querying Shopify
   on every chip tap. */
export const CATALOG_QUERY = `
  ${FABRIC_FRAGMENT}
  query catalog($first: Int!, $collections: Int!) {
    products(first: $first, sortKey: TITLE) {
      nodes { ...Fabric }
      pageInfo { hasNextPage }
    }
    collections(first: $collections) {
      nodes {
        handle
        title
        description
        image { url altText }
        products(first: 250) { nodes { handle } }
      }
    }
  }
`

export const FABRIC_QUERY = `
  ${FABRIC_FRAGMENT}
  query fabric($handle: String!) {
    product(handle: $handle) { ...Fabric }
  }
`

export const CART_FRAGMENT = `
  fragment CartDetail on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            image { url altText }
            price { amount currencyCode }
            selectedOptions { name value }
            product { handle title featuredImage { url altText } }
          }
        }
      }
    }
  }
`





export const CART_CREATE = `
  ${CART_FRAGMENT}
  mutation cartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ...CartDetail }
      userErrors { field message }
    }
  }
`

export const CART_QUERY = `
  ${CART_FRAGMENT}
  query cart($cartId: ID!) {
    cart(id: $cartId) { ...CartDetail }
  }
`

export const CART_LINES_ADD = `
  ${CART_FRAGMENT}
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartDetail }
      userErrors { field message }
    }
  }
`

export const CART_LINES_UPDATE = `
  ${CART_FRAGMENT}
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartDetail }
      userErrors { field message }
    }
  }
`

export const CART_LINES_REMOVE = `
  ${CART_FRAGMENT}
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartDetail }
      userErrors { field message }
    }
  }
`

export const SHOP_QUERY = `
  query shop {
    shop { name description primaryDomain { url } }
  }
`
