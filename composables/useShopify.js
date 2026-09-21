import { createStorefrontApiClient } from '@shopify/storefront-api-client'

let client = null

/**
 * Storefront API client. Memoised per JS context so we are not rebuilding it
 * on every component that asks for it.
 */
export function useShopify() {
  if (client) return client

  const { shopifyDomain, shopifyToken, shopifyApiVersion } = useRuntimeConfig().public

  if (!shopifyDomain || !shopifyToken) {
    throw new Error(
      'Missing Shopify credentials. Copy .env.example to .env and set ' +
      'NUXT_PUBLIC_SHOPIFY_DOMAIN and NUXT_PUBLIC_SHOPIFY_TOKEN.',
    )
  }

  client = createStorefrontApiClient({
    storeDomain: shopifyDomain,
    apiVersion: shopifyApiVersion,
    publicAccessToken: shopifyToken,
  })

  return client
}

/**
 * Runs a Storefront query and throws on GraphQL/userErrors instead of letting
 * a half-empty response flow into the UI.
 */
export async function shopifyRequest(query, variables = {}) {
  const shopify = useShopify()
  const { data, errors } = await shopify.request(query, { variables })

  if (errors) {
    const message = errors.graphQLErrors?.map(e => e.message).join('; ')
      || errors.message
      || 'Storefront API request failed'
    throw createError({ statusCode: errors.networkStatusCode || 502, statusMessage: message })
  }

  return data
}
