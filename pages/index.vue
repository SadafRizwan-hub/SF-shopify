<script setup>
/* Everything product-shaped on this page comes from the API. No section
   renders its heading unless there is at least one posted product behind
   it, so a fresh install shows the shop's own copy and nothing else —
   never a grid of stand-in cards for stock that doesn't exist. */
import { computed } from 'vue'
import FabricSurface from '~/components/FabricSurface.vue'
import ProductGrid from '~/components/ProductGrid.vue'
import { rupee } from '~/composables/catalogStore'
import { PHOTO } from '~/data/photos'
import { catalog, designsInStock, featured, hasProducts, loadCatalog } from '~/composables/catalogStore'

/* Fetched on the server so the homepage arrives rendered — good for sharing
   a link and for `nuxi generate`. */
await useAsyncData('catalog', loadCatalog)
import { go, store, resetFilters } from '~/composables/store'

const lead = computed(() => featured(8))
const designs = computed(() => designsInStock().slice(0, 6))

/* the quality chips are a shortcut into the catalog — a type with nothing
   posted under it would open an empty grid, so it isn't offered */
const types = computed(() =>
  catalog.fabricTypes.filter((t) => catalog.fabrics.some((f) => f.type === t.id)),
)

/* The hero sells the first product the admin has arranged, using its own
   photo, name and rate. With an empty catalog it keeps the shop photograph
   and drops the product line and the shop-this button entirely. */
const hero = computed(() => lead.value[0] || null)
/* the shop photograph stands in only until a product is posted; with that
   file absent too, the hero is simply the dark ground */
const heroPhoto = computed(() => hero.value?.photo || PHOTO.kalamkari || null)
const qualities = computed(() => catalog.fabrics.length)

function browseType(id) {
  resetFilters()
  store.filters.fabrics.push(id)
  go('catalog')
}
</script>

<template>
  <div>
    <!-- hero -->
    <section class="hero">
      <img v-if="heroPhoto" :src="heroPhoto" :alt="hero ? hero.name : 'Singhania Fabrics, Kalbadevi'">
      <div class="veil" />
      <div class="shell copy">
        <span v-if="hero" class="eyebrow">New this week</span>
        <h1 v-if="hero">{{ hero.name }},<br />cut to your metre</h1>
        <h1 v-else>Wholesale cloth,<br />cut to your metre</h1>
        <p v-if="hero" class="lede">
          {{ hero.sub }}. {{ qualities }} {{ qualities === 1 ? 'quality' : 'qualities' }} on the
          floor, dyed shades on most of them, and every rate is the wholesale rate.
        </p>
        <p v-else class="lede">
          Cut fresh off the than at the wholesale rate, in half-metre steps.
          The counter is open — the catalog goes up here as stock lands.
        </p>
        <div v-if="hero" class="cta">
          <button class="btn btn-primary" @click="go('fabric', hero.code)">
            Shop {{ hero.name }} · {{ rupee(hero.price) }}/m
          </button>
          <button class="btn btn-ghost" @click="go('catalog')">
            Browse all {{ qualities }} {{ qualities === 1 ? 'quality' : 'qualities' }}
          </button>
        </div>
      </div>
    </section>

    <!-- fabric types -->
    <section v-if="types.length" class="shell band">
      <div class="head">
        <h2>Shop by quality</h2>
        <button class="linkish" @click="go('catalog')">See the full catalog</button>
      </div>
      <div class="types">
        <button v-for="t in types" :key="t.id" class="chip" @click="browseType(t.id)">
          {{ t.name }}
        </button>
      </div>
    </section>

    <!-- by the metre -->
    <section v-if="hasProducts" class="shell band">
      <div class="head">
        <h2>By the metre</h2>
        <button class="linkish" @click="go('catalog')">See all</button>
      </div>
      <ProductGrid :items="lead" :columns="4" />
    </section>

    <!-- designs -->
    <section v-if="designs.length" class="shell band">
      <div class="head">
        <h2>One design, many grounds</h2>
        <button class="linkish" @click="go('designs')">All designs</button>
      </div>
      <p class="sub">
        The design book sits across qualities — pick the drawing first, then choose
        which cloth it should be printed on.
      </p>
      <div class="designs">
        <button v-for="d in designs" :key="d.id" class="dcard" @click="go('design', d.id)">
          <FabricSurface :item="d" ratio="4 / 3" :caption="false" />
          <span class="dn">{{ d.name }}</span>
          <span class="meta">{{ d.tag }}</span>
        </button>
      </div>
    </section>

    <!-- counter promise -->
    <section class="shell band">
      <div class="promise">
        <div>
          <span class="label">Wholesale rates on</span>
          <h3>Slab pricing past 10 metres</h3>
          <p>Cross the slab and the rate drops on the whole cut — no negotiation, the app shows it before you order.</p>
        </div>
        <div>
          <span class="label">₹20 a card</span>
          <h3>Swatch before you commit</h3>
          <p>Screen colour cannot be trusted. Order the shade card, hold it to your light, then order the than.</p>
        </div>
        <div>
          <span class="label">Cut to order</span>
          <h3>Half-metre increments</h3>
          <p>Cut fresh off the than, folded and dispatched the same evening from Kalbadevi.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 560px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(20,17,15,.18) 0%, rgba(20,17,15,.05) 35%, rgba(20,17,15,.72) 100%);
}
.copy { position: relative; padding-top: 90px; padding-bottom: 56px; color: #fffdf8; }
.eyebrow {
  font-size: 10.5px;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: rgba(255, 253, 248, 0.82);
}
.hero h1 {
  font-size: clamp(34px, 6vw, 62px);
  margin: 14px 0 16px;
  color: #fffdf8;
  text-shadow: 0 2px 24px rgba(20, 17, 15, 0.35);
}
.lede {
  max-width: 470px;
  margin: 0 0 26px;
  font-size: 14.5px;
  line-height: 1.6;
  color: rgba(255, 253, 248, 0.88);
}
.cta { display: flex; flex-wrap: wrap; gap: 10px; }
.cta .btn-primary { background: var(--paper); color: var(--ink); }
.cta .btn-ghost { background: rgba(255,253,248,.12); border-color: rgba(255,253,248,.5); color: #fffdf8; }
.cta .btn-ghost:hover { background: rgba(255,253,248,.22); }

.band { padding: 54px 20px 0; }
.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.head h2 { font-size: clamp(23px, 3vw, 30px); }
.sub { margin: -10px 0 22px; color: var(--ink-70); font-size: 14px; max-width: 560px; }

.types { display: flex; flex-wrap: wrap; gap: 9px; }

.designs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 26px 22px;
}
.dcard { text-align: left; display: block; }
.dn { display: block; margin: 11px 0 3px; font-size: 14px; }
.dcard .meta { display: block; }
.dcard:hover .dn { color: var(--brass); }

.promise {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--line-soft);
  border: 1px solid var(--line-soft);
  border-radius: var(--r-lg);
  overflow: hidden;
}
.promise > div { background: var(--paper); padding: 28px 26px; }
.promise h3 { font-size: 19px; margin: 10px 0 8px; }
.promise p { margin: 0; font-size: 13.5px; color: var(--ink-70); line-height: 1.55; }

@media (max-width: 1000px) {
  .promise { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .hero { min-height: 460px; }
  .copy { padding-top: 60px; padding-bottom: 34px; }
  .cta .btn { flex: 1; min-width: 0; }
  .band { padding-top: 40px; }
  .designs { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 14px; }
}
</style>
