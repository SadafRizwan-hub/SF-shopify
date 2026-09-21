<script setup>
import { computed, ref } from 'vue'
import ProductGrid from '~/components/ProductGrid.vue'
import FilterPanel from '~/components/FilterPanel.vue'
import { catalog, shadeById, designById, hasProducts, loadCatalog } from '~/composables/catalogStore'

await useAsyncData('catalog', loadCatalog)
import { store, resetFilters, filterCount } from '~/composables/store'

const sorts = [
  { id: 'featured', label: 'Featured' },
  { id: 'low', label: 'Rate · low to high' },
  { id: 'high', label: 'Rate · high to low' },
  { id: 'shades', label: 'Most shades' },
]

/* A fabric can carry several designs, each with its own colour set -- filters,
   search and the "most shades" sort all need to look across every design a
   fabric is sold under, not just its primary one. */
const allShades = (f) => [...new Set(f.designGroups.flatMap((g) => g.shades))]
const designSlugs = (f) => f.designGroups.map((g) => g.slug)

const matches = computed(() => {
  const q = store.search.trim().toLowerCase()
  let out = catalog.fabrics.filter((f) => {
    if (store.filters.fabrics.length && !store.filters.fabrics.includes(f.type)) return false
    if (store.filters.designs.length && !store.filters.designs.some((id) => designSlugs(f).includes(id))) return false
    if (store.filters.colours.length && !store.filters.colours.some((c) => allShades(f).includes(c))) return false
    if (q && !(`${f.name} ${f.sub} ${f.type} ${f.designGroups.map((g) => g.name).join(' ')}`.toLowerCase().includes(q))) return false
    return true
  })
  if (store.sort === 'low') out = [...out].sort((a, b) => a.price - b.price)
  if (store.sort === 'high') out = [...out].sort((a, b) => b.price - a.price)
  if (store.sort === 'shades') out = [...out].sort((a, b) => allShades(b).length - allShades(a).length)
  return out
})

/* active filter pills, so the applied state is legible above the grid */
const pills = computed(() => [
  ...store.filters.fabrics.map((id) => ({ list: 'fabrics', id, label: catalog.fabricTypes.find((t) => t.id === id)?.name })),
  ...store.filters.colours.map((id) => ({ list: 'colours', id, label: shadeById[id]?.name, hex: shadeById[id]?.hex })),
  ...store.filters.designs.map((id) => ({ list: 'designs', id, label: designById[id]?.name })),
])

function drop(p) {
  const arr = store.filters[p.list]
  arr.splice(arr.indexOf(p.id), 1)
}

const sortOpen = ref(false)
</script>

<template>
  <div class="shell page">
    <header class="top">
      <div>
        <h1>Catalog</h1>
        <p class="meta">
          <template v-if="hasProducts">
            {{ catalog.fabrics.length }} {{ catalog.fabrics.length === 1 ? 'quality' : 'qualities' }} ·
            wholesale rates on
          </template>
          <template v-else>Wholesale rates on</template>
        </p>
      </div>
      <div v-if="hasProducts" class="topright">
        <label class="msearch">
          <input v-model="store.search" type="search" placeholder="Cambric, hakoba, 44&quot;…" />
        </label>
        <div class="sortwrap">
          <button class="chip" @click="sortOpen = !sortOpen">
            {{ sorts.find((s) => s.id === store.sort).label }}
            <svg viewBox="0 0 12 12" width="10" height="10"><path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
          <ul v-if="sortOpen" class="menu" @click="sortOpen = false">
            <li v-for="s in sorts" :key="s.id">
              <button :class="{ on: store.sort === s.id }" @click="store.sort = s.id">{{ s.label }}</button>
            </li>
          </ul>
        </div>
        <button class="chip mfilter" :class="{ on: filterCount }" @click="store.sheetOpen = true">
          Filter <span v-if="filterCount" class="n">{{ filterCount }}</span>
        </button>
      </div>
    </header>

    <!-- Nothing has been posted from the dashboard yet: no grid, no filters,
         no sort — an empty shelf is stated once and the page ends. -->
    <div v-if="!hasProducts" class="empty">
      <template v-if="catalog.failed">
        <h3>We couldn't reach the counter</h3>
        <p class="meta">The catalog didn't load. Reload in a moment, or message us on WhatsApp and we'll read out the rates.</p>
      </template>
      <template v-else>
        <h3>The shelf is being stocked</h3>
        <p class="meta">Nothing is listed here yet. New qualities appear as soon as they're entered at the counter.</p>
      </template>
    </div>

    <div v-else class="split">
      <!-- desktop rail -->
      <aside class="rail">
        <div class="railhead">
          <span class="label">Filter</span>
          <button v-if="filterCount" class="linkish" @click="resetFilters">Reset all</button>
        </div>
        <FilterPanel :filters="store.filters" />
      </aside>

      <section class="results">
        <div v-if="pills.length" class="pills">
          <button v-for="p in pills" :key="p.list + p.id" class="chip pill" @click="drop(p)">
            <i v-if="p.hex" :style="{ background: p.hex }" />
            {{ p.label }}
            <svg viewBox="0 0 12 12" width="9" height="9"><path d="M3 3 9 9M9 3 3 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          </button>
          <button class="linkish clear" @click="resetFilters">Clear</button>
        </div>

        <p class="count meta">Showing {{ matches.length }} of {{ catalog.fabrics.length }}</p>

        <ProductGrid :items="matches" :columns="3">
          <template #empty>
            <div class="empty">
              <h3>Nothing on the shelf matches that</h3>
              <p class="meta">Drop a filter, or ask the counter — we hold more in the godown than in the app.</p>
              <button class="btn btn-ghost" @click="resetFilters(); store.search = ''">Reset everything</button>
            </div>
          </template>
        </ProductGrid>
      </section>
    </div>

    <!-- mobile filter sheet -->
    <div v-if="store.sheetOpen" class="scrim" @click="store.sheetOpen = false" />
    <div class="sheet" :class="{ open: store.sheetOpen }" role="dialog" aria-label="Filter">
      <div class="grab" />
      <header class="sheethead">
        <h2>Filter</h2>
        <button class="linkish" @click="resetFilters">Reset all</button>
      </header>
      <div class="sheetbody">
        <FilterPanel :filters="store.filters" />
      </div>
      <footer class="sheetfoot">
        <button class="btn btn-ghost" @click="store.sheetOpen = false">Cancel</button>
        <button class="btn btn-primary" @click="store.sheetOpen = false">Show {{ matches.length }} fabrics</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 30px 20px 60px; position: relative; }
.top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 26px;
}
.top h1 { font-size: clamp(28px, 4vw, 38px); }
.top .meta { margin: 6px 0 0; }
.topright { display: flex; align-items: center; gap: 8px; }
.msearch { display: none; }

.sortwrap { position: relative; }
.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 20;
  margin: 0;
  padding: 6px;
  list-style: none;
  min-width: 190px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-card);
}
.menu button {
  width: 100%;
  text-align: left;
  padding: 9px 11px;
  border-radius: var(--r-sm);
  font-size: 13px;
  color: var(--ink-70);
}
.menu button:hover { background: var(--sand); }
.menu button.on { color: var(--ink); font-weight: 500; }

.split { display: grid; grid-template-columns: 268px minmax(0, 1fr); gap: 44px; align-items: start; }
.rail { position: sticky; top: 90px; }
.railhead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18px;
}

.pills { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }
.pill { background: var(--sand); border-color: transparent; color: var(--ink); }
.pill i { width: 10px; height: 10px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(20,17,15,.15); }
.pill svg { color: var(--ink-45); }
.clear { margin-left: 4px; }
.count { margin: 0 0 16px; }

.empty { padding: 60px 0; text-align: center; }
.empty h3 { font-size: 22px; margin-bottom: 8px; }
.empty .btn { margin-top: 18px; }

/* sheet */
.scrim { position: fixed; inset: 0; background: rgba(20, 17, 15, 0.4); z-index: 55; }
.sheet {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  background: var(--paper);
  border-radius: 22px 22px 0 0;
  box-shadow: var(--shadow-sheet);
  transform: translateY(102%);
  transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  visibility: hidden;
}
.sheet.open { transform: translateY(0); visibility: visible; }
.grab { width: 44px; height: 4px; border-radius: 3px; background: var(--line); margin: 10px auto 4px; }
.sheethead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 12px 22px 16px;
}
.sheethead h2 { font-size: 26px; }
.sheetbody { overflow-y: auto; padding: 0 22px 20px; -webkit-overflow-scrolling: touch; }
.sheetfoot {
  display: flex;
  gap: 10px;
  padding: 14px 22px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--line-soft);
  background: var(--paper);
}
.sheetfoot .btn-primary { flex: 1; }

@media (max-width: 900px) {
  .page { padding-bottom: 90px; }
  .split { grid-template-columns: 1fr; gap: 0; }
  .rail { display: none; }
  .topright { width: 100%; }
  .msearch { display: block; flex: 1; }
  .msearch input {
    width: 100%;
    height: 40px;
    padding: 0 15px;
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    background: var(--paper);
    font-size: 13.5px;
    outline: none;
  }
  .top { align-items: flex-start; }
}
@media (min-width: 901px) { .mfilter { display: none; } .scrim, .sheet { display: none; } }
</style>
