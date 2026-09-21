<script setup>
import FabricSurface from './FabricSurface.vue'
import ShadeDots from './ShadeDots.vue'
import { rupee } from '~/composables/catalogStore'
import { isSaved, path, toggleSave } from '~/composables/store'

/* The card links rather than dispatching a click: a fabric has a real URL
   now, so it can be opened in a new tab, shared on WhatsApp and prerendered. */
defineProps({ fabric: { type: Object, required: true } })
</script>

<template>
  <article class="card">
    <NuxtLink class="press" :to="path('fabric', fabric.code)" :aria-label="fabric.name">
      <FabricSurface :item="fabric" ratio="3 / 4">
        <span class="tag">{{ fabric.typeName || fabric.type }}</span>
        <span v-if="fabric.stock === 'low stock'" class="low">Low stock</span>
        <span v-else-if="fabric.stock === 'out of stock'" class="low out">Out of stock</span>
      </FabricSurface>
    </NuxtLink>
    <button class="heart" :class="{ on: isSaved(fabric.code) }" @click.stop="toggleSave(fabric.code)" :aria-label="'Save ' + fabric.name">
      <svg viewBox="0 0 20 20" width="15" height="15"><path d="M10 16.2 4.6 11a3.4 3.4 0 1 1 5.4-4 3.4 3.4 0 1 1 5.4 4Z" :fill="isSaved(fabric.code) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
    </button>

    <NuxtLink class="body" :to="path('fabric', fabric.code)">
      <h3>{{ fabric.name }}</h3>
      <p class="meta">{{ fabric.sub }}</p>
      <p class="rate">
        {{ rupee(fabric.price) }}<span class="per">/m</span>
        <span v-if="fabric.mrp" class="was">{{ rupee(fabric.mrp) }}</span>
      </p>
      <ShadeDots :shades="fabric.shades" :max="4" />
    </NuxtLink>
  </article>
</template>

<style scoped>
.card { position: relative; }
.press { display: block; width: 100%; padding: 0; }
.press :deep(.surface) { transition: transform 0.3s ease; }
.card:hover .press :deep(img) { transform: scale(1.03); }
.press :deep(img) { transition: transform 0.5s ease; }

.tag {
  position: absolute;
  top: 10px; left: 10px;
  padding: 4px 11px;
  border-radius: var(--r-pill);
  background: rgba(255, 253, 248, 0.92);
  font-size: 10.5px;
  text-transform: capitalize;
  letter-spacing: 0.3px;
  color: var(--ink);
}
.low.out { background: var(--ink); }
.low {
  position: absolute;
  bottom: 10px; left: 10px;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  background: var(--terracotta);
  color: #fff;
  font-size: 10px;
  letter-spacing: 0.4px;
}
.heart {
  position: absolute;
  top: 8px; right: 8px;
  width: 30px; height: 30px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: rgba(255, 253, 248, 0.9);
  color: var(--ink-70);
  opacity: 0;
  transition: opacity 0.15s;
}
.card:hover .heart, .heart.on { opacity: 1; }
.heart.on { color: var(--terracotta); }

.body { padding: 12px 2px 0; cursor: pointer; }
.body h3 { font-family: var(--sans); font-size: 14px; font-weight: 400; }
.body .meta { margin: 3px 0 7px; }
.body .rate { font-size: 14.5px; margin: 0 0 10px; }

@media (max-width: 900px) { .heart { opacity: 1; } }
</style>
