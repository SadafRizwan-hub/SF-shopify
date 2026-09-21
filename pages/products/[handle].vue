<script setup>
import { PRODUCT_QUERY } from '~/composables/queries'

const route = useRoute()
const handle = route.params.handle

const { data: product, error } = await useAsyncData(
  () => `product:${handle}`,
  async () => {
    const data = await shopifyRequest(PRODUCT_QUERY, { handle })
    return data.product
  },
)

// A failed request is not a missing product — keep the real reason.
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 502,
    statusMessage: error.value.statusMessage || error.value.message,
    fatal: true,
  })
}

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}

useHead(() => ({
  title: product.value?.seo?.title || product.value?.title,
  meta: [
    {
      name: 'description',
      content: product.value?.seo?.description || product.value?.description?.slice(0, 160) || '',
    },
  ],
}))
</script>

<template>
  <article v-if="product" class="product">
    <ProductGallery :images="product.images.nodes" :title="product.title" />

    <div class="product__info stack">
      <h1>{{ product.title }}</h1>
      <ProductForm :product="product" />
      <!-- descriptionHtml comes from Shopify's own rich-text editor -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="product.descriptionHtml" class="prose" v-html="product.descriptionHtml" />
    </div>
  </article>
</template>
