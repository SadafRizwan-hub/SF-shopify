// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  modules: ['@pinia/nuxt'],

  // Keep SSR on: `nuxt generate` uses it at build time to prerender HTML,
  // and `nuxt dev` gives you server-rendered pages while developing.
  ssr: true,

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      shopifyDomain: process.env.NUXT_PUBLIC_SHOPIFY_DOMAIN || '',
      shopifyToken: process.env.NUXT_PUBLIC_SHOPIFY_TOKEN || '',
      // Storefront API version. Bump this to the current stable quarterly
      // release when you upgrade; see README for where to check it.
      shopifyApiVersion: process.env.NUXT_PUBLIC_SHOPIFY_API_VERSION || '2025-10',
    },
  },

  // On `nuxt generate` the crawler starts at / and follows the product and
  // collection links rendered from Shopify, so every listed product gets a
  // static page without maintaining a route list by hand.
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
