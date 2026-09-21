<script setup>
defineProps({
  products: { type: Array, default: () => [] },
})
</script>

<template>
  <ul v-if="products.length" class="grid grid--products">
    <li v-for="product in products" :key="product.id">
      <ProductCard :product="product" />
    </li>
  </ul>
  <p v-else>No products found.</p>
</template>
