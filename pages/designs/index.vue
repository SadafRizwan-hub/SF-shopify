<script setup>
import { computed } from 'vue'
import FabricSurface from '~/components/FabricSurface.vue'
import { designsInStock, fabricsForDesign, loadCatalog } from '~/composables/catalogStore'

await useAsyncData('catalog', loadCatalog)
import { go } from '~/composables/store'

/* A design card is a door into the fabrics it's printed on. A design with
   no product posted on it opens onto nothing, so it isn't shown at all —
   the book lists what can actually be ordered. */
const designs = computed(() => designsInStock())
const groundCount = (id) => fabricsForDesign(id).length
</script>

<template>
  <div class="shell page">
    <header class="top">
      <h1>The design book</h1>
      <p class="sub">
        Every drawing in the book can be printed or woven on more than one ground.
        Pick the design, then choose the cloth underneath it.
      </p>
    </header>

    <div v-if="designs.length" class="grid">
      <button v-for="d in designs" :key="d.id" class="card" @click="go('design', d.id)">
        <FabricSurface :item="d" ratio="4 / 3" :caption="false" />
        <h3>{{ d.name }}</h3>
        <p class="meta">{{ d.tag }}</p>
        <p class="on">On {{ groundCount(d.id) }} {{ groundCount(d.id) === 1 ? 'quality' : 'qualities' }}</p>
      </button>
    </div>
    <div v-else class="empty">
      <h3>The book is still being drawn up</h3>
      <p class="meta">Designs show up here once there's cloth listed under them.</p>
      <button class="btn btn-primary" @click="go('catalog')">Open the catalog</button>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 30px 20px 80px; }
.top { margin-bottom: 30px; }
.top h1 { font-size: clamp(28px, 4vw, 38px); }
.sub { margin: 10px 0 0; max-width: 560px; font-size: 14px; color: var(--ink-70); line-height: 1.6; }
.grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px 22px; }
.card { text-align: left; }
.card h3 { font-family: var(--sans); font-size: 14.5px; font-weight: 400; margin: 12px 0 3px; }
.card:hover h3 { color: var(--brass); }
.on { margin: 8px 0 0; font-size: 11.5px; color: var(--brass); }
.empty { padding: 70px 0; text-align: center; }
.empty h3 { font-size: 23px; margin-bottom: 8px; }
.empty .btn { margin-top: 20px; }
@media (max-width: 1000px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 700px) {
  .page { padding-bottom: 100px; }
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 14px; }
}
</style>
