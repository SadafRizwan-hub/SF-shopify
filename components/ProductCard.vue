<script setup>
const props = defineProps({
  product: { type: Object, required: true },
})

const price = computed(() => formatPriceRange(props.product.priceRange))
</script>

<template>
  <NuxtLink :to="`/products/${product.handle}`" class="card">
    <img
      v-if="product.featuredImage"
      :src="product.featuredImage.url"
      :alt="product.featuredImage.altText || product.title"
      :width="product.featuredImage.width"
      :height="product.featuredImage.height"
      loading="lazy"
    >
    <h3>{{ product.title }}</h3>
    <p>{{ price }}</p>
    <p v-if="!product.availableForSale"><small>Sold out</small></p>
  </NuxtLink>
</template>
