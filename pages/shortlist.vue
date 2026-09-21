<script setup>
import { computed } from 'vue'
import ProductGrid from '~/components/ProductGrid.vue'
import { fabricById, loadCatalog } from '~/composables/catalogStore'

await useAsyncData('catalog', loadCatalog)
import { store, go } from '~/composables/store'

/* .filter(Boolean) is what makes a shortlist survive the dashboard: a code
   whose product has since been deactivated or deleted resolves to nothing
   and simply drops out, rather than rendering a card for a dead product. */
const list = computed(() => store.saved.map(fabricById).filter(Boolean))
</script>

<template>
  <div class="shell page">
    <header class="top">
      <h1>Shortlist</h1>
      <p class="meta">
        <ClientOnly fallback="Reading your shortlist…">{{ list.length }} kept for later</ClientOnly>
      </p>
    </header>

    <ClientOnly>
    <ProductGrid :items="list" :columns="4">
      <template #empty>
        <div class="empty">
          <h3>Nothing shortlisted yet</h3>
          <p class="meta">Tap the heart on any quality and it waits for you here.</p>
          <button class="btn btn-primary" @click="go('catalog')">Open the catalog</button>
        </div>
      </template>
    </ProductGrid>
    </ClientOnly>
  </div>
</template>

<style scoped>
.page { padding: 30px 20px 100px; }
.top { margin-bottom: 26px; }
.top h1 { font-size: clamp(28px, 4vw, 38px); }
.top .meta { margin: 7px 0 0; }
.empty { padding: 70px 0; text-align: center; }
.empty h3 { font-size: 23px; margin-bottom: 8px; }
.empty .btn { margin-top: 20px; }
</style>
