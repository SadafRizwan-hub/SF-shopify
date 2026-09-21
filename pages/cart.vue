<script setup>
const cart = useCartStore()

onMounted(() => cart.restore())

useHead({ title: 'Cart' })
</script>

<template>
  <div class="stack">
    <h1>Your cart</h1>

    <ClientOnly>
      <p v-if="cart.error" role="alert" class="error">{{ cart.error }}</p>

      <p v-if="cart.isEmpty && !cart.loading">
        Your cart is empty. <NuxtLink to="/">Browse products</NuxtLink>
      </p>

      <template v-else>
        <ul class="cart-lines">
          <li v-for="line in cart.lines" :key="line.id" class="cart-line">
            <img
              v-if="line.merchandise.image"
              :src="line.merchandise.image.url"
              :alt="line.merchandise.image.altText || line.merchandise.product.title"
              width="80"
              height="80"
              loading="lazy"
            >

            <div class="cart-line__info">
              <NuxtLink :to="`/products/${line.merchandise.product.handle}`">
                {{ line.merchandise.product.title }}
              </NuxtLink>
              <small v-if="line.merchandise.title !== 'Default Title'">
                {{ line.merchandise.title }}
              </small>
              <span>{{ formatMoney(line.cost.totalAmount) }}</span>
            </div>

            <div class="cart-line__actions">
              <label>
                <span class="visually-hidden">Quantity</span>
                <input
                  type="number"
                  min="1"
                  :value="line.quantity"
                  :disabled="cart.loading"
                  @change="cart.updateLine(line.id, Number($event.target.value))"
                >
              </label>
              <button type="button" :disabled="cart.loading" @click="cart.removeLine(line.id)">
                Remove
              </button>
            </div>
          </li>
        </ul>

        <footer class="cart-summary stack">
          <p v-if="cart.subtotal">
            <strong>Subtotal</strong> {{ formatMoney(cart.subtotal) }}
          </p>
          <small>Taxes and shipping are calculated at checkout.</small>
          <button
            type="button"
            class="button"
            :disabled="cart.loading || cart.isEmpty"
            @click="cart.goToCheckout()"
          >
            Checkout
          </button>
        </footer>
      </template>

      <template #fallback>
        <p>Loading cart…</p>
      </template>
    </ClientOnly>
  </div>
</template>
