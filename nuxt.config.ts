// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  modules: ['@pinia/nuxt'],

  // Keep SSR on: `nuxt generate` uses it at build time to prerender HTML,
  // and `nuxt dev` gives you server-rendered pages while developing.
  ssr: true,

  css: ['~/assets/css/base.css'],

  runtimeConfig: {
    public: {
      shopifyDomain: process.env.NUXT_PUBLIC_SHOPIFY_DOMAIN || '',
      shopifyToken: process.env.NUXT_PUBLIC_SHOPIFY_TOKEN || '',
      // Storefront API version. Bump this to the current stable quarterly
      // release when you upgrade; see README for where to check it.
      shopifyApiVersion: process.env.NUXT_PUBLIC_SHOPIFY_API_VERSION || '2025-10',
      /* the counter's WhatsApp Business number, digits only, with country code */
      whatsapp: process.env.NUXT_PUBLIC_WHATSAPP || '',
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
      title: 'Singhania Fabrics · Wholesale cloth, cut to your metre',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#f8f5ef' },
      ],
      link: [
        /* the serif wordmark and the sans body; both degrade to local stacks */
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@400;500&display=swap',
        },
      ],
    },
  },
})
