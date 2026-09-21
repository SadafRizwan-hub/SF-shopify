<script setup>
import { COLLECTION_QUERY } from '~/composables/queries'

const route = useRoute()
const handle = route.params.handle

const { data: collection, error } = await useAsyncData(
  () => `collection:${handle}`,
  async () => {
    const data = await shopifyRequest(COLLECTION_QUERY, { handle, first: 48 })
    return data.collection
  },
)

// A failed request is not a missing collection — keep the real reason.
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 502,
    statusMessage: error.value.statusMessage || error.value.message,
    fatal: true,
  })
}

if (!collection.value) {
  throw createError({ statusCode: 404, statusMessage: 'Collection not found', fatal: true })
}

useHead(() => ({ title: collection.value?.title }))
</script>

<template>
  <div v-if="collection" class="stack">
    <header class="stack">
      <h1>{{ collection.title }}</h1>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="collection.descriptionHtml" class="prose" v-html="collection.descriptionHtml" />
    </header>

    <ProductGrid :products="collection.products.nodes" />
  </div>
</template>
