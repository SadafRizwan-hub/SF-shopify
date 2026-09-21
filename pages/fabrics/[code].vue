<script setup>
import { computed, ref, watch } from 'vue'
import ShadePicker from '~/components/ShadePicker.vue'
import FabricSurface from '~/components/FabricSurface.vue'
import ProductGrid from '~/components/ProductGrid.vue'
import {
  catalog,
  designById,
  designGroupFor,
  fabricById,
  loadCatalog,
  loadFabric,
  rupee,
  shadeById,
} from '~/composables/catalogStore'
import { addToCutList, go, isSaved, toggleSave } from '~/composables/store'

/* No fallback to some other product: a code that resolves to nothing — a
   fabric the dashboard deactivated or deleted, or a stale link — is null,
   and the page says so. Quietly showing a different fabric under the old
   link is how someone orders the wrong cloth. */
const route = useRoute()
const code = computed(() => String(route.params.code))

/* The catalogue gives the grid and the "goes with this" row; the fabric's own
   record is fetched alongside it so the slabs and the per-shade MOQ are there
   on first paint rather than appearing a moment later. */
await useAsyncData(() => `fabric:${code.value}`, async () => {
  await loadCatalog()
  await loadFabric(code.value)
  return true
}, { watch: [code] })

const fabric = computed(() => fabricById(code.value) || null)

/* A fabric can be sold under several designs, each with its own colour set
   (see designGroups in catalogStore.js). This page shows one design's
   shades at a time; the switcher below lets the shopper move between them. */
const activeDesignSlug = ref(fabric.value?.designGroups?.[0]?.slug || null)
const activeGroup = computed(() => designGroupFor(fabric.value, activeDesignSlug.value))

const firstAvailableShade = (group) => group?.shades.find((s) => !group.out.includes(s))
const shade = ref(firstAvailableShade(activeGroup.value))
const metres = ref(6)

/* Which pricing card is selected — null means retail, otherwise the chosen
   slab tier. This is its own piece of state, not derived from metres: the
   stepper only moves quantity, it never flips the selection, and clicking
   a card is what changes it. */
const tier = ref(null)

watch(fabric, (f) => {
  activeDesignSlug.value = f?.designGroups?.[0]?.slug || null
  metres.value = 6
  tier.value = null
})

watch(activeGroup, (g) => {
  shade.value = firstAvailableShade(g)
})

const selectDesign = (slug) => {
  activeDesignSlug.value = slug
}

const isRetail = computed(() => !tier.value)
const rate = computed(() => (tier.value ? tier.value.price : fabric.value?.price || 0))
const total = computed(() => rate.value * metres.value)
/* One card per design this fabric is sold under. The design record carries
   the thumbnail and the tag line; `g` only carries the slug/name the stock
   rows were tagged with, so it stands in when meta hasn't loaded. */
const multiDesign = computed(() => (fabric.value?.designGroups.length || 0) > 1)
const designCards = computed(() =>
  (fabric.value?.designGroups || []).map((g) => {
    const d = designById[g.slug]
    return {
      slug: g.slug,
      name: d?.name || g.name,
      tag: d?.tag || '',
      shades: g.shades.length,
      item: d || { name: g.name, photo: null },
    }
  }),
)

const selectRetail = () => { tier.value = null }
const selectTier = (t) => {
  tier.value = t
  if (metres.value < t.from) metres.value = t.from
}

/* Retail's MOQ (min_cut) is per shade, not one fixed number for the whole
   fabric -- e.g. one colour may cut from 0.5 m, another only from 1 m. Read
   from the same /api/fabrics/<code>/ response as everything else on this
   page (StockUnitSerializer's min_cut, surfaced as shadeStock[..].minCut in
   catalogStore.js), not hardcoded. */
const retailMoq = computed(() => activeGroup.value?.shadeStock?.[shade.value]?.minCut ?? 0.5)

/* The stepper respects whichever card is selected: under a wholesale tier
   it won't drop below that tier's MOQ (that would silently undercharge —
   the checkout total is what's shown here), retail won't drop below this
   shade's own MOQ. */
const minMetres = computed(() => (tier.value ? tier.value.from : retailMoq.value))
/* the stepper clamps at the floor, so the minus says so instead of going dead */
const atMin = computed(() => metres.value <= minMetres.value)

/* the API's type is a slug ('mercerized-cotton'); CSS capitalize leaves the
   hyphen sitting in the middle of the word, so the spec table gets real words */
const quality = computed(() => (fabric.value?.type || '').replace(/[-_]+/g, ' '))
const step = (d) => {
  metres.value = Math.max(minMetres.value, Math.round((metres.value + d) * 2) / 2)
}

/* Switching shade (or design) can raise the floor out from under the current
   quantity -- bump it up rather than silently leaving an order below MOQ. */
watch(retailMoq, (moq) => {
  if (isRetail.value && metres.value < moq) metres.value = moq
})
useHead(() => ({
  title: fabric.value ? `${fabric.value.name} · Singhania Fabrics` : 'Singhania Fabrics',
  meta: [{ name: 'description', content: fabric.value?.sub || '' }],
}))

const related = computed(() => {
  const f0 = fabric.value
  if (!f0) return []
  const slugs0 = f0.designGroups.map((g) => g.slug)
  return catalog.fabrics
    .filter(
      (f) =>
        f.code !== f0.code &&
        (f.type === f0.type || f.designGroups.some((g) => slugs0.includes(g.slug))),
    )
    .slice(0, 4)
})
</script>

<template>
  <div class="shell page">
    <button class="back" @click="go('catalog')">
      <svg viewBox="0 0 16 16" width="13" height="13"><path d="M9.5 3 5 8l4.5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Back to catalog
    </button>

    <!-- a product div only exists for a product that is actually listed -->
    <div v-if="fabric" class="split">
      <!-- cloth -->
      <div class="visual">
        <FabricSurface :item="fabric" ratio="4 / 5" :caption="false">
          <span class="scale">↘ True scale 1:1</span>
        </FabricSurface>
        <button class="heart" :class="{ on: isSaved(fabric.code) }" @click="toggleSave(fabric.code)">
          <svg viewBox="0 0 20 20" width="17" height="17"><path d="M10 16.2 4.6 11a3.4 3.4 0 1 1 5.4-4 3.4 3.4 0 1 1 5.4 4Z" :fill="isSaved(fabric.code) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <!-- counter -->
      <div class="detail">
        <div class="titlerow">
          <div>
            <h1>{{ fabric.name }}</h1>
            <p class="meta">{{ fabric.sub }}</p>
          </div>
          <p class="rate big">
            {{ rupee(fabric.price) }}<span class="per">/m</span>
            <span v-if="fabric.mrp" class="was">{{ rupee(fabric.mrp) }}/m</span>
          </p>
        </div>

        <p v-if="fabric.note" class="note">{{ fabric.note }}</p>

        <section class="block">
          <header>
            <span class="label">Available shades {{ activeGroup?.shades.length || 0 }}</span>
            <span class="chosen">{{ shadeById[shade]?.name }}</span>
          </header>
          <ShadePicker v-model="shade" :shades="activeGroup?.shades || []" :out="activeGroup?.out || []" :columns="6" />
        </section>

        <!-- Design. One card per design this fabric is sold under: with a
             single design the card is the way through to its book page; with
             several it is also the switcher — picking one re-draws the shade
             row above it and decides which stock the rest of the page reads.
             Same card either way, so both kinds of product page read alike. -->
        <section v-if="designCards.length" class="block">
          <header>
            <span class="label">Design</span>
            <span v-if="multiDesign" class="chosen">{{ activeGroup?.name }}</span>
          </header>
          <div class="designs" :class="{ multi: multiDesign }">
            <div
              v-for="d in designCards"
              :key="d.slug"
              class="designcard"
              :class="{ on: multiDesign && d.slug === activeDesignSlug }"
            >
              <button
                class="dpick"
                :aria-pressed="multiDesign ? d.slug === activeDesignSlug : undefined"
                @click="multiDesign ? selectDesign(d.slug) : go('design', d.slug)"
              >
                <span class="dthumb"><FabricSurface :item="d.item" ratio="1 / 1" :caption="false" /></span>
                <span class="dtext">
                  <b>{{ d.name }}</b>
                  <i class="meta">
                    <template v-if="d.tag">{{ d.tag }} · </template>
                    <template v-if="multiDesign">{{ d.shades }} shades</template>
                    <template v-else>see every ground</template>
                  </i>
                </span>
              </button>
              <button class="djump" :aria-label="`See every ground in ${d.name}`" @click="go('design', d.slug)">
                <svg viewBox="0 0 16 16" width="14" height="14"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
        </section>

        <section class="block">
          <header>
            <span class="label">Pricing</span>
            <span class="chosen">{{ isRetail ? 'Retail' : 'Wholesale' }}</span>
          </header>
          <!-- Every rate is a peer here: retail and each wholesale rung are
               the same row, so what is pickable (and what is picked) is not a
               guess. The old two-card split made wholesale look like a static
               twin of retail while its rungs were the real buttons. -->
          <div class="pricelist">
            <button type="button" class="prow" :class="{ on: isRetail }" @click="selectRetail">
              <span class="pmark" />
              <span class="pwhat">
                <b>Retail</b>
                <i>From {{ retailMoq }} m · cut to order</i>
              </span>
              <span class="pamt">{{ rupee(fabric.price) }}<i class="per">/m</i></span>
            </button>
            <button
              v-for="s in fabric.slabs"
              :key="s.from"
              type="button"
              class="prow"
              :class="{ on: tier === s }"
              @click="selectTier(s)"
            >
              <span class="pmark" />
              <span class="pwhat">
                <b>Wholesale</b>
                <i>{{ s.from }} m and above</i>
              </span>
              <span class="pamt">{{ rupee(s.price) }}<i class="per">/m</i></span>
            </button>
            <p v-if="!fabric.slabs.length" class="prow none">
              <span class="pwhat">
                <b>Wholesale</b>
                <i>Contact us for bulk pricing</i>
              </span>
            </p>
          </div>
        </section>

        <!-- Metres and what they come to. Both halves are labelled and the
             block is read left-to-right: what you are buying, then the money. -->
        <div class="tray">
          <div class="qcol">
            <span class="tlabel">Quantity</span>
            <div class="stepper">
              <button :disabled="atMin" aria-label="Less" @click="step(-0.5)">−</button>
              <span class="qty">{{ metres }}<i>m</i></span>
              <button aria-label="More" @click="step(0.5)">+</button>
            </div>
            <p class="tfine">{{ rupee(rate) }}/m · 0.5 m steps</p>
          </div>
          <div class="sum">
            <span class="tlabel">Total</span>
            <p class="rate big">{{ rupee(total) }}</p>
            <p v-if="tier" class="slabline hit">Wholesale rate applied</p>
            <p v-else-if="fabric.slab" class="slabline">{{ fabric.slab.from }} m+ at {{ rupee(fabric.slab.price) }}/m</p>
          </div>
        </div>

        <div class="actions">
          <button
            class="btn btn-primary"
            @click="addToCutList(fabric.code, shade, metres, activeDesignSlug, activeGroup?.shadeStock?.[shade]?.stockUnitId)"
          >
            Add {{ metres }} m · {{ shadeById[shade]?.name }}
          </button>
        </div>

        <!-- no Cut cell: the half-metre step is stated on the stepper itself,
             where it is about to be used -->
        <dl class="specs">
          <div><dt>Width</dt><dd>{{ fabric.width }}</dd></div>
          <div><dt>Quality</dt><dd class="cap">{{ quality }}</dd></div>
          <div><dt>Stock</dt><dd :class="{ low: fabric.stock === 'low stock' }">{{ fabric.stock }}</dd></div>
        </dl>
      </div>
    </div>

    <section v-if="fabric && related.length" class="related">
      <h2>Goes with this</h2>
      <ProductGrid :items="related" :columns="4" />
    </section>

    <div v-if="!fabric" class="gone">
      <h1>This one's off the shelf</h1>
      <p class="meta">
        It isn't listed any more — it may have sold out or been withdrawn.
        The rest of the catalog is still open.
      </p>
      <button class="btn btn-primary" @click="go('catalog')">Back to the catalog</button>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 22px 20px 70px; }
.back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--ink-70);
  margin-bottom: 22px;
}
.back:hover { color: var(--ink); }

.split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 52px; align-items: start; }
.visual { position: relative; position: sticky; top: 90px; }
.scale {
  position: absolute;
  left: 14px; bottom: 14px;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  background: rgba(20, 17, 15, 0.62);
  color: #fffdf8;
  font-size: 11px;
  letter-spacing: 0.2px;
}
.heart {
  position: absolute;
  top: 14px; right: 14px;
  width: 38px; height: 38px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: rgba(255, 253, 248, 0.92);
  color: var(--ink-70);
}
.heart.on { color: var(--terracotta); }

.titlerow { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.titlerow h1 { font-size: clamp(28px, 3.6vw, 40px); }
.titlerow .meta { margin: 7px 0 0; }
.rate.big { font-size: 22px; margin: 0; white-space: nowrap; }
.rate.big .was { display: block; text-align: right; font-size: 12.5px; margin: 3px 0 0; }

.note {
  margin: 20px 0 0;
  padding-bottom: 26px;
  border-bottom: 1px solid var(--line-soft);
  font-size: 14px;
  line-height: 1.6;
  color: var(--ink-70);
  max-width: 52ch;
}

.block { padding: 26px 0; border-bottom: 1px solid var(--line-soft); }
/* a fabric with no note has nothing between the title and the first block --
   this puts the same rule there that the note's own bottom border gives */
.titlerow + .block { margin-top: 26px; border-top: 1px solid var(--line-soft); }
.block header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}
.chosen { font-size: 12.5px; color: var(--ink); }

/* One design card, used for both the single-design link and the
   multi-design switcher — the only difference is whether `.on` can be set. */
.designs { display: grid; gap: 8px; }
.designs.multi { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
.designcard {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--paper);
  box-shadow: inset 0 0 0 1.5px transparent;
  transition: border-color 0.14s, box-shadow 0.14s;
}
.designcard:hover { border-color: var(--line-strong); }
.designcard.on { border-color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--ink); }
.dpick {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
  padding: 10px;
  text-align: left;
  color: var(--ink-70);
}
.dthumb { width: 52px; flex-shrink: 0; }
.dtext { min-width: 0; }
.dpick b { display: block; font-weight: 500; font-size: 13.5px; color: var(--ink); }
.dpick i {
  display: block;
  font-style: normal;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.designcard.on .dpick { color: var(--ink); }
.djump {
  align-self: stretch;
  padding: 0 12px;
  color: var(--ink-45);
  transition: color 0.14s;
}
.djump:hover { color: var(--ink); }

/* the rate options — one row each, radio-marked, any number of rungs */
.pricelist {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--paper);
  overflow: hidden;
}
.prow {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  padding: 13px 16px;
  text-align: left;
  transition: background 0.14s;
}
.prow + .prow { border-top: 1px solid var(--line-soft); }
button.prow:hover { background: var(--sand); }
.prow.on { background: var(--sand); }
.pmark {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--line-strong);
  transition: box-shadow 0.14s;
}
.prow.on .pmark { box-shadow: inset 0 0 0 4.5px var(--ink); }
.pwhat { min-width: 0; }
.pwhat b { display: block; font-weight: 400; font-size: 13.5px; color: var(--ink); }
.prow.on .pwhat b { font-weight: 500; }
.pwhat i {
  display: block;
  font-style: normal;
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--ink-45);
}
.prow .pamt {
  margin: 0 0 0 auto;
  font-size: 17px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.prow .pamt .per { font-style: normal; font-size: 12px; color: var(--ink-45); }
/* no rungs to pick — keep the text on the same rail as the rows above it */
.prow.none { margin: 0; padding-left: 44px; }

.tray {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin: 26px 0 14px;
  padding: 15px 18px 14px;
  background: var(--sand);
  border-radius: var(--r-lg);
}
.tlabel {
  display: block;
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--ink-45);
}
/* one control, not two loose buttons — and the plus no longer outweighs the
   minus, which put a second solid-ink button right above the real one */
.stepper {
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
  padding: 4px;
  background: var(--paper);
  border-radius: var(--r-pill);
  box-shadow: inset 0 0 0 1px var(--line);
}
.stepper button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  color: var(--ink);
  transition: background 0.14s, color 0.14s;
}
.stepper button:hover:not(:disabled) { background: var(--sand); }
.stepper button:disabled { color: var(--ink-45); opacity: 0.5; cursor: not-allowed; }
.qty {
  min-width: 58px;
  text-align: center;
  font-size: 17px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.qty i { font-style: normal; font-size: 12px; color: var(--ink-45); margin-left: 3px; }
.tfine { margin: 8px 0 0; font-size: 11.5px; color: var(--ink-45); }
.sum { text-align: right; }
.sum .rate.big { font-size: 26px; margin: 6px 0 0; }
.slabline { margin: 4px 0 0; font-size: 11.5px; color: var(--ink-45); }
.slabline.hit { color: var(--terracotta); }

.actions { display: flex; gap: 10px; }
.actions .btn-primary { flex: 1; }

.specs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  margin: 30px 0 0;
  background: var(--line-soft);
  border: 1px solid var(--line-soft);
  border-radius: var(--r-md);
  overflow: hidden;
}
.specs > div { background: var(--paper); padding: 14px 15px; }
.specs dt { font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.2px; color: var(--ink-45); }
.specs dd { margin: 5px 0 0; font-size: 13.5px; }
.specs .cap { text-transform: capitalize; }
.specs .low { color: var(--terracotta); }

.related { margin-top: 70px; }
.related h2 { font-size: 26px; margin-bottom: 20px; }

.gone { padding: 80px 20px; text-align: center; }
.gone h1 { font-size: clamp(24px, 3.4vw, 34px); margin-bottom: 10px; }
.gone .meta { max-width: 42ch; margin: 0 auto; line-height: 1.6; }
.gone .btn { margin-top: 22px; }

@media (max-width: 900px) {
  .page { padding: 14px 0 100px; position: relative; }
  .split { grid-template-columns: 1fr; gap: 0; }
  .visual { position: static; }
  .visual :deep(.surface) { border-radius: 0; }
  .back {
    position: absolute;
    top: 14px; left: 14px;
    z-index: 5;
    width: 36px; height: 36px;
    justify-content: center;
    gap: 0;
    border-radius: 50%;
    background: rgba(255, 253, 248, 0.92);
    font-size: 0;
    margin: 0;
  }
  .heart { top: 12px; }
  .detail { padding: 22px 20px 0; }
  /* three cells on a phone rather than a 2+1 row with a gap in it */
  .specs > div { padding: 12px 11px; }
  .specs dd { font-size: 12.5px; }
  .tray { padding: 14px 15px 13px; }
  .related { padding: 0 20px; }
  .actions {
    position: sticky;
    bottom: 62px;
    margin: 24px -20px 0;
    padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
    background: rgba(248, 245, 239, 0.95);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--line-soft);
  }
}
</style>
