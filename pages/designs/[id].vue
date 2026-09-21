<script setup>
import { computed, ref, watch } from 'vue'
import FabricSurface from '~/components/FabricSurface.vue'
import ShadePicker from '~/components/ShadePicker.vue'
import {
  designById,
  designGroupFor,
  fabricsForDesign,
  loadCatalog,
  rupee,
  shadeById,
} from '~/composables/catalogStore'
import { addSwatch, go } from '~/composables/store'

/* A design page is only a page if there is cloth under it. An unknown id, or
   a design the dashboard has posted no fabric on, renders the empty state
   rather than an ordering panel with no ground to order. */
const route = useRoute()
const id = computed(() => String(route.params.id))

await useAsyncData('catalog', loadCatalog)

const design = computed(() => designById[id.value] || null)
const grounds = computed(() => (design.value ? fabricsForDesign(design.value.id) : []))

useHead(() => ({ title: design.value ? `${design.value.name} · Design book` : 'Design book' }))
const sellable = computed(() => !!design.value && grounds.value.length > 0)

/* union of shades this design is dyed in across every ground it sits on --
   read from *this* design's group on each fabric, not whichever group
   happens to be that fabric's primary one */
const shades = computed(() => {
  const seen = []
  grounds.value.forEach((f) =>
    designGroupFor(f, design.value?.id)?.shades.forEach((s) => !seen.includes(s) && seen.push(s)),
  )
  return seen
})
const chosen = ref(null)
const pick = computed(() => chosen.value || grounds.value[0])
const pickGroup = computed(() => designGroupFor(pick.value, design.value?.id))

const shade = ref(shades.value[0])
watch(design, () => {
  chosen.value = null
  shade.value = shades.value[0]
})

/* a shade only counts as available if the chosen ground is dyed in it, under this design */
const outOnPick = computed(() => shades.value.filter((s) => !pickGroup.value?.shades.includes(s)))
</script>

<template>
  <div class="shell page">
    <button class="back" @click="go('designs')">
      <svg viewBox="0 0 16 16" width="13" height="13"><path d="M9.5 3 5 8l4.5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      All designs
    </button>

    <div v-if="!sellable" class="gone">
      <h1>{{ design ? design.name : 'That design' }}</h1>
      <p class="meta">
        There's no cloth listed under this design at the moment. The rest of
        the book is still open.
      </p>
      <button class="btn btn-primary" @click="go('designs')">Back to the design book</button>
    </div>

    <template v-else>
    <header class="head">
      <h1>{{ design.name }}</h1>
      <p class="meta">Design · available on {{ grounds.length }} {{ grounds.length === 1 ? 'fabric' : 'fabrics' }}</p>
    </header>

    <div class="split">
      <div class="visual">
        <FabricSurface :item="design" ratio="4 / 3" :caption="false">
          <span class="shown">Shown in {{ shadeById[shade]?.name }} on {{ pick?.type }}</span>
        </FabricSurface>
        <p class="tagline">{{ design.tag }}</p>
      </div>

      <div class="detail">
        <section class="block">
          <header>
            <span class="label">This design comes in</span>
            <span class="chosen">{{ shadeById[shade]?.name }}</span>
          </header>
          <ShadePicker v-model="shade" :shades="shades" :out="outOnPick" :columns="6" />
        </section>

        <section class="block">
          <header><span class="label">On which fabric</span></header>
          <div class="grounds">
            <button
              v-for="f in grounds"
              :key="f.id"
              class="ground"
              :class="{ on: pick?.id === f.id }"
              @click="chosen = f"
            >
              <span class="gthumb"><FabricSurface :item="f" ratio="1 / 1" :caption="false" /></span>
              <span class="gtext">
                <b>{{ f.name }}</b>
                <i class="meta">{{ f.width }} · {{ f.stock }}</i>
              </span>
              <span class="rate">{{ rupee(f.price) }}<span class="per">/m</span></span>
            </button>
          </div>
        </section>

        <div class="actions">
          <button
            class="btn btn-ghost"
            @click="addSwatch(pick.code, shade, design.id, pickGroup?.shadeStock?.[shade]?.stockUnitId)"
          >
            Swatch {{ rupee(20) }}
          </button>
          <button class="btn btn-primary" @click="go('fabric', pick.code)">
            {{ shadeById[shade]?.name }} on {{ pick?.type }} · pick metres
          </button>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<style scoped>
.page { padding: 22px 20px 80px; }
.back { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: var(--ink-70); margin-bottom: 18px; }
.back:hover { color: var(--ink); }
.head { margin-bottom: 26px; }
.head h1 { font-size: clamp(28px, 3.6vw, 40px); }
.head .meta { margin: 7px 0 0; }

.split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 52px; align-items: start; }
.visual { position: sticky; top: 90px; }
.shown {
  position: absolute;
  left: 14px; bottom: 14px;
  padding: 7px 13px;
  border-radius: var(--r-pill);
  background: rgba(20, 17, 15, 0.62);
  color: #fffdf8;
  font-size: 11.5px;
}
.tagline { margin: 14px 2px 0; font-size: 13.5px; color: var(--ink-70); }

.block { padding: 0 0 26px; margin-bottom: 26px; border-bottom: 1px solid var(--line-soft); }
.block header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
.chosen { font-size: 12.5px; }

.grounds { display: flex; flex-direction: column; gap: 9px; }
.ground {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px 10px 10px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--paper);
  text-align: left;
  transition: border-color 0.14s, box-shadow 0.14s;
}
.ground:hover { border-color: var(--line-strong); }
.ground.on { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }
.gthumb { width: 46px; flex-shrink: 0; }
.gtext { min-width: 0; }
.gtext b { display: block; font-weight: 400; font-size: 13.5px; }
.gtext i { display: block; font-style: normal; margin-top: 2px; text-transform: capitalize; }
.ground .rate { margin-left: auto; font-size: 14px; white-space: nowrap; }

.actions { display: flex; gap: 10px; }
.actions .btn-primary { flex: 1; }

.gone { padding: 60px 0 90px; text-align: center; }
.gone h1 { font-size: clamp(24px, 3.4vw, 34px); margin-bottom: 10px; }
.gone .meta { max-width: 44ch; margin: 0 auto; line-height: 1.6; }
.gone .btn { margin-top: 22px; }

@media (max-width: 900px) {
  .page { padding-bottom: 100px; }
  .split { grid-template-columns: 1fr; gap: 30px; }
  .visual { position: static; }
  .actions {
    position: sticky;
    bottom: 62px;
    margin: 0 -20px;
    padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
    background: rgba(248, 245, 239, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--line-soft);
  }
}
</style>
