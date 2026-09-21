<script setup>
/*
 * The cut list, and the hand-off to checkout.
 *
 * The Razorpay flow this page used to run — collect name/email/phone, create
 * an order through the Django API, open the Razorpay modal, verify the
 * signature — is gone, because Shopify owns checkout now. It collects the
 * customer's details, applies shipping, takes the payment and sends the
 * confirmation itself. This page's job ends at the redirect.
 */
import { computed } from 'vue'
import FabricSurface from '~/components/FabricSurface.vue'
import { loadCatalog, rupee } from '~/composables/catalogStore'
import {
  cutList,
  cutListMetres,
  cutListTotal,
  go,
  removeLine,
  setMetres,
} from '~/composables/store'
import { useCartStore } from '~/stores/cart'

await useAsyncData('catalog', loadCatalog)

const cart = useCartStore()
const lines = cutList

/* Shipping is Shopify's to calculate against the delivery address, so the
   free-over-₹2,000 line states the threshold rather than pricing the
   delivery here and risking a different number at checkout. */
const FREE_OVER = 2000
const toFreeDelivery = computed(() => Math.max(0, FREE_OVER - cutListTotal.value))
</script>

<template>
  <div class="shell page">
    <header class="top">
      <h1>Cut list</h1>
      <p class="meta">
        {{ lines.length }} {{ lines.length === 1 ? 'line' : 'lines' }} ·
        {{ cutListMetres }} m to be cut
      </p>
    </header>

    <ClientOnly>
    <div v-if="cart.loading && !lines.length" class="empty">
      <p class="meta">Reading your cut list…</p>
    </div>

    <div v-else-if="!lines.length" class="empty">
      <h3>Nothing on the list yet</h3>
      <p class="meta">Pick a quality, choose a shade, set your metres — it collects here.</p>
      <button class="btn btn-primary" @click="go('catalog')">Open the catalog</button>
    </div>

    <div v-else class="split">
      <section class="lines">
        <article v-for="l in lines" :key="l.key" class="line">
          <button class="lthumb" @click="go('fabric', l.fabricId)">
            <FabricSurface :item="l.fabric" ratio="1 / 1" :caption="false" />
          </button>

          <div class="ltext">
            <h3 @click="go('fabric', l.fabricId)">{{ l.fabric?.name || l.fabricId }}</h3>
            <p class="meta">
              <span v-if="l.shade.hex" class="sw" :style="{ background: l.shade.hex }" />{{ l.shade.name }}
              <template v-if="l.designName">· {{ l.designName }}</template>
              <template v-if="l.fabric?.width"> · {{ l.fabric.width }}</template>
            </p>
            <p class="meta unit">
              {{ rupee(l.unitPrice) }}/m
              <span v-if="l.fabric?.slab && l.metres >= l.fabric.slab.from" class="slab">slab rate</span>
            </p>
          </div>

          <div class="lqty">
            <div class="stepper">
              <button :disabled="l.metres <= 0.5 || cart.loading" @click="setMetres(l.key, l.metres - 0.5)">−</button>
              <span>{{ l.metres }} m</span>
              <button :disabled="cart.loading" @click="setMetres(l.key, l.metres + 0.5)">+</button>
            </div>
            <p class="rate">{{ rupee(l.total) }}</p>
            <button class="remove" :disabled="cart.loading" @click="removeLine(l.key)">Remove</button>
          </div>
        </article>
      </section>

      <aside class="summary">
        <h2>Order summary</h2>
        <dl>
          <div><dt>Cloth ({{ cutListMetres }} m)</dt><dd>{{ rupee(cutListTotal) }}</dd></div>
          <div><dt>Delivery</dt><dd>At checkout</dd></div>
          <div v-if="toFreeDelivery" class="hint">
            <dt>Free over ₹2,000</dt><dd>{{ rupee(toFreeDelivery) }} to go</dd>
          </div>
          <div class="grand"><dt>Subtotal</dt><dd>{{ rupee(cutListTotal) }}</dd></div>
        </dl>

        <p v-if="cart.error" class="checkouterr">{{ cart.error }}</p>

        <button
          class="btn btn-primary wide"
          :disabled="cart.loading || !lines.length"
          @click="cart.goToCheckout()"
        >
          {{ cart.loading ? 'Updating…' : 'Place the cut order' }}
        </button>
        <p class="fine">
          Your name, address and payment are taken on the next screen. Cut fresh off the
          than in half-metre steps, dispatched the same evening from Kalbadevi; cut cloth
          is not returnable, so order the swatch card first.
        </p>
      </aside>
    </div>
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

.split { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 44px; align-items: start; }

.line {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) auto;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line-soft);
}
.line:first-child { border-top: 1px solid var(--line-soft); }
.lthumb { padding: 0; }
.ltext h3 { font-family: var(--sans); font-size: 15px; font-weight: 400; cursor: pointer; }
.ltext h3:hover { color: var(--brass); }
.ltext .meta { display: flex; align-items: center; gap: 6px; margin: 5px 0 0; }
.sw { width: 10px; height: 10px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(20,17,15,.15); }
.unit { margin-top: 8px; }
.slab { color: var(--terracotta); }
.swatchtag { margin: 8px 0 0; font-size: 11.5px; color: var(--brass); }

.lqty { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.stepper { display: flex; align-items: center; gap: 4px; }
.stepper button {
  width: 28px; height: 28px;
  display: grid; place-items: center;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--paper);
  font-size: 15px;
  line-height: 1;
}
.stepper button:hover { background: var(--sand); }
.stepper span { min-width: 52px; text-align: center; font-size: 13.5px; font-variant-numeric: tabular-nums; }
.lqty .rate { font-size: 15px; margin: 0; }
.remove { font-size: 11.5px; color: var(--ink-45); }
.remove:hover { color: var(--terracotta); }

.summary {
  position: sticky;
  top: 90px;
  padding: 24px;
  background: var(--paper);
  border: 1px solid var(--line-soft);
  border-radius: var(--r-lg);
}
.summary h2 { font-size: 21px; margin-bottom: 16px; }
.summary dl { margin: 0 0 20px; }
.summary dl > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  font-size: 13.5px;
  color: var(--ink-70);
}
.summary dt, .summary dd { margin: 0; }
.summary .hint { font-size: 11.5px; color: var(--brass); padding-top: 0; }
.summary .grand {
  margin-top: 6px;
  padding-top: 15px;
  border-top: 1px solid var(--line);
  font-size: 17px;
  color: var(--ink);
  font-weight: 500;
}
.wide { width: 100%; }
.fine { margin: 16px 0 0; font-size: 11.5px; line-height: 1.55; color: var(--ink-45); }

.customer { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.customer input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  background: var(--paper);
  font-size: 13.5px;
  outline: none;
}
.customer input:focus { border-color: var(--line-strong); }
.checkouterr { margin: 0 0 12px; font-size: 12px; color: var(--terracotta); }

@media (max-width: 900px) {
  .split { grid-template-columns: 1fr; gap: 30px; }
  .summary { position: static; }
  .line { grid-template-columns: 68px minmax(0, 1fr); }
  .lqty {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
}
</style>
