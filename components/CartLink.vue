<script setup>
const cart = useCartStore()

onMounted(() => cart.restore())
</script>

<template>
  <NuxtLink to="/cart">
    Cart
    <ClientOnly>
      <span v-if="cart.totalQuantity">({{ cart.totalQuantity }})</span>
    </ClientOnly>
  </NuxtLink>
</template>
