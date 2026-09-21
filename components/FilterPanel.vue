<script setup>
import { computed } from 'vue'
import { catalog, designsInStock } from '~/composables/catalogStore'

const props = defineProps({
  filters: { type: Object, required: true },
})

const countFor = (typeId) => catalog.fabrics.filter((f) => f.type === typeId).length

/* Only offer a filter that can return something. A fabric type or design
   with no posted product behind it is a dead chip — it reads as stock we
   carry and lands the shopper on an empty grid. */
const types = computed(() => catalog.fabricTypes.filter((t) => countFor(t.id)))
const designs = computed(() => designsInStock())
const shades = computed(() => {
  const worn = new Set(catalog.fabrics.flatMap((f) => f.shades))
  return catalog.shades.filter((s) => worn.has(s.id))
})

function toggle(list, id) {
  const i = props.filters[list].indexOf(id)
  if (i === -1) props.filters[list].push(id)
  else props.filters[list].splice(i, 1)
}
const has = (list, id) => props.filters[list].includes(id)
</script>

<template>
  <div class="panel">
    <section v-if="types.length">
      <header>
        <span class="label">Fabric</span>
        <span class="meta">{{ filters.fabrics.length || 'none' }} selected</span>
      </header>
      <div class="chips">
        <button
          v-for="t in types"
          :key="t.id"
          class="chip"
          :class="{ on: has('fabrics', t.id) }"
          @click="toggle('fabrics', t.id)"
        >
          {{ t.name }} <span class="n">{{ countFor(t.id) }}</span>
        </button>
      </div>
    </section>

    <section v-if="shades.length">
      <header>
        <span class="label">Colour</span>
        <span class="meta">{{ filters.colours.length ? filters.colours.length + ' selected' : 'tap to add' }}</span>
      </header>
      <div class="shades">
        <button
          v-for="s in shades"
          :key="s.id"
          class="shade"
          :class="{ on: has('colours', s.id) }"
          @click="toggle('colours', s.id)"
        >
          <span class="ring" :style="{ background: s.hex }" />
          <span class="nm">{{ s.name }}</span>
        </button>
      </div>
    </section>

    <section v-if="designs.length">
      <header>
        <span class="label">Design / Pattern</span>
        <span class="meta">{{ filters.designs.length ? filters.designs.length + ' selected' : 'none selected' }}</span>
      </header>
      <div class="designs">
        <button
          v-for="d in designs"
          :key="d.id"
          class="design"
          :class="{ on: has('designs', d.id) }"
          @click="toggle('designs', d.id)"
        >
          <span class="thumb">
            <img v-if="d.photo" :src="d.photo" :alt="d.name" loading="lazy" />
          </span>
          <span class="nm">{{ d.name }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; gap: 30px; }
section header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 11px;
  margin-bottom: 15px;
  border-bottom: 1px solid var(--line-soft);
}
.chips { display: flex; flex-wrap: wrap; gap: 8px; }

.shades {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px 6px;
}
.shade { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ring {
  width: 100%;
  max-width: 46px;
  aspect-ratio: 1;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(20, 17, 15, 0.14);
  transition: transform 0.14s, box-shadow 0.14s;
}
.shade:hover .ring { transform: scale(1.06); }
.shade.on .ring { box-shadow: inset 0 0 0 1px rgba(20,17,15,.14), 0 0 0 2px var(--ivory), 0 0 0 4px var(--ink); }
.nm { font-size: 10.5px; color: var(--ink-70); text-align: center; }
.shade.on .nm, .design.on .nm { color: var(--ink); font-weight: 500; }

.designs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 10px;
}
.design { display: flex; flex-direction: column; gap: 7px; }
.thumb {
  display: block;
  aspect-ratio: 1;
  border-radius: var(--r-sm);
  overflow: hidden;
  background: #efe8dc;
  box-shadow: inset 0 0 0 1px var(--line-soft);
  transition: box-shadow 0.14s;
}
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.design.on .thumb { box-shadow: 0 0 0 2px var(--ink); }
.design .nm { text-align: left; }

@media (max-width: 560px) {
  .shades { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px 4px; }
  .designs { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
