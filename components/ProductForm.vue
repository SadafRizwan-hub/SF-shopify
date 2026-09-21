<script setup>
/**
 * Variant selection + add to cart. Option buttons are driven by the product's
 * own options, so it works for single-variant and multi-option products alike.
 */
const props = defineProps({
  product: { type: Object, required: true },
})

const cart = useCartStore()
const variants = computed(() => props.product.variants.nodes)

// Start on the first sellable variant so the page never opens on a sold-out one.
const selected = reactive({})
const initial = variants.value.find(v => v.availableForSale) ?? variants.value[0]
for (const option of initial?.selectedOptions ?? []) {
  selected[option.name] = option.value
}

const selectedVariant = computed(() =>
  variants.value.find(variant =>
    variant.selectedOptions.every(option => selected[option.name] === option.value),
  ) ?? null,
)

/** Variant that a given option value would resolve to, for availability hints. */
function variantFor(optionName, value) {
  return variants.value.find(variant =>
    variant.selectedOptions.every(option =>
      option.name === optionName ? option.value === value : selected[option.name] === option.value,
    ),
  )
}

const canAdd = computed(() =>
  Boolean(selectedVariant.value?.availableForSale) && !cart.loading,
)

const added = ref(false)

async function addToCart() {
  if (!selectedVariant.value) return
  await cart.addLine(selectedVariant.value.id, 1)
  if (!cart.error) {
    added.value = true
    setTimeout(() => (added.value = false), 2500)
  }
}
</script>

<template>
  <form class="product-form stack" @submit.prevent="addToCart">
    <p class="price">
      <span>{{ formatMoney(selectedVariant?.price ?? product.priceRange.minVariantPrice) }}</span>
      <s v-if="selectedVariant?.compareAtPrice">
        {{ formatMoney(selectedVariant.compareAtPrice) }}
      </s>
    </p>

    <fieldset v-for="option in product.options" :key="option.name" class="option">
      <legend>{{ option.name }}</legend>
      <div class="option__values">
        <label
          v-for="value in option.optionValues"
          :key="value.name"
          class="option__value"
          :data-unavailable="!variantFor(option.name, value.name)?.availableForSale || null"
        >
          <input
            v-model="selected[option.name]"
            type="radio"
            :name="option.name"
            :value="value.name"
          >
          <span>{{ value.name }}</span>
        </label>
      </div>
    </fieldset>

    <button type="submit" class="button" :disabled="!canAdd">
      <template v-if="cart.loading">Adding…</template>
      <template v-else-if="!selectedVariant">Unavailable</template>
      <template v-else-if="!selectedVariant.availableForSale">Sold out</template>
      <template v-else>Add to cart</template>
    </button>

    <p v-if="added" role="status">Added to cart — <NuxtLink to="/cart">view cart</NuxtLink></p>
    <p v-if="cart.error" role="alert" class="error">{{ cart.error }}</p>
  </form>
</template>
