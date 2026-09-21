<script setup>
/* The one place a list of products becomes a grid of product divs.
   Every product grid on the site goes through here, so "what a product
   looks like" and "when a product is shown at all" are decided once.

   It renders nothing when the list is empty — no filler cards, no
   pattern stand-ins for stock that was never entered. A product div
   exists on this site only because the admin dashboard posted that
   product; an empty catalog shows an empty catalog. Callers that want
   words in the empty case pass an #empty slot. */
import FabricCard from './FabricCard.vue'

defineProps({
  items: { type: Array, default: () => [] },
  /* desktop column count — the grid steps down on its own below 1000px */
  columns: { type: Number, default: 4 },
})
</script>

<template>
  <div>
    <div v-if="items.length" class="grid" :style="{ '--cols': columns }">
      <FabricCard v-for="f in items" :key="f.code || f.id" :fabric="f" />
    </div>
    <slot v-else name="empty" />
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 32px 22px;
}
@media (max-width: 1050px) { .grid { grid-template-columns: repeat(min(var(--cols), 3), minmax(0, 1fr)); } }
@media (max-width: 700px) { .grid { grid-template-columns: repeat(min(var(--cols), 2), minmax(0, 1fr)); gap: 24px 14px; } }
</style>
