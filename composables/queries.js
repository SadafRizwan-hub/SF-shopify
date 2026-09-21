/**
 * GraphQL documents for the Storefront API, kept in one place so fragments
 * stay consistent between listing and detail pages.
 */

export const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id
    handle
    title
    featuredImage { url altText width height }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    availableForSale
  }
`

export const PRODUCT_DETAIL_FRAGMENT = `
  fragment ProductDetail on Product {
    id
    handle
    title
    description
    descriptionHtml
    availableForSale
    options { name optionValues { name } }
    images(first: 10) { nodes { url altText width height } }
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
      }
    }
    seo { title description }
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
            product { handle title }
          }
        }
      }
    }
  }
`

export const PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query products($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: BEST_SELLING) {
      nodes { ...ProductCard }
      pageInfo { hasNextPage endCursor }
    }
  }
`

export const PRODUCT_QUERY = `
  ${PRODUCT_DETAIL_FRAGMENT}
  query product($handle: String!) {
    product(handle: $handle) { ...ProductDetail }
  }
`

export const COLLECTIONS_QUERY = `
  query collections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        handle
        title
        description
        image { url altText }
      }
    }
  }
`

export const COLLECTION_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query collection($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      descriptionHtml
      image { url altText }
      products(first: $first, after: $after) {
        nodes { ...ProductCard }
        pageInfo { hasNextPage endCursor }
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
