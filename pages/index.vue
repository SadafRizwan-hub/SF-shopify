<script setup>
import { COLLECTIONS_QUERY, PRODUCTS_QUERY, SHOP_QUERY } from '~/composables/queries'

const { data, error } = await useAsyncData('home', async () => {
  const [shop, collections, products] = await Promise.all([
    shopifyRequest(SHOP_QUERY),
    shopifyRequest(COLLECTIONS_QUERY, { first: 12 }),
    shopifyRequest(PRODUCTS_QUERY, { first: 12 }),
  ])
  return {
    shop: shop.shop,
    collections: collections.collections.nodes,
    products: products.products.nodes,
  }
})

useHead(() => ({
  title: data.value?.shop?.name ?? 'Storefront',
  meta: [{ name: 'description', content: data.value?.shop?.description ?? '' }],
}))
</script>

<template>
  <div class="stack">
    <StorefrontError v-if="error" :error="error" />

    <section>
      <h1>{{ data?.shop?.name }}</h1>
      <p v-if="data?.shop?.description">{{ data.shop.description }}</p>
    </section>

    <section v-if="data?.collections?.length">
      <h2>Collections</h2>
      <ul class="grid grid--collections">
        <li v-for="collection in data.collections" :key="collection.id">
          <NuxtLink :to="`/collections/${collection.handle}`" class="card">
            <img
              v-if="collection.image"
              :src="collection.image.url"
              :alt="collection.image.altText || collection.title"
              loading="lazy"
            >
            <span>{{ collection.title }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section v-if="data?.products?.length">
      <h2>Featured products</h2>
      <ProductGrid :products="data.products" />
    </section>
  </div>
</template>
