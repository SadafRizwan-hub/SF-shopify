<script setup>
import { path } from '~/composables/store'
</script>

<template>
  <footer class="foot">
    <div class="shell inner">
      <div class="brandcol">
        <span class="mark">SF</span>
        <p>Singhania Fabrics · Mangaldas Market, Kalbadevi, Mumbai 400002</p>
        <p class="fine">Sample site built to demonstrate the catalogue design. Rates and stock are illustrative.</p>
      </div>
      <nav>
        <span class="label">Shop</span>
        <NuxtLink :to="path('catalog')">Catalog</NuxtLink>
        <NuxtLink :to="path('designs')">Design book</NuxtLink>
        <NuxtLink :to="path('cutlist')">Cut list</NuxtLink>
        <NuxtLink :to="path('saved')">Shortlist</NuxtLink>
      </nav>
      <nav>
        <span class="label">The shop</span>
        <NuxtLink :to="path('about')">About the counter</NuxtLink>
        <NuxtLink :to="`${path('about')}#rates`">Rates &amp; slabs</NuxtLink>
        <NuxtLink :to="`${path('about')}#cutting`">Cutting &amp; dispatch</NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.foot {
  margin-top: 80px;
  padding: 44px 0 34px;
  border-top: 1px solid var(--line-soft);
  background: var(--paper);
}
.inner { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 34px; }
.mark { font-family: var(--serif); font-size: 24px; }
.brandcol p { margin: 12px 0 0; font-size: 13px; color: var(--ink-70); max-width: 42ch; }
.brandcol .fine { font-size: 11.5px; color: var(--ink-45); }
nav { display: flex; flex-direction: column; align-items: flex-start; gap: 9px; }
nav .label { margin-bottom: 4px; }
nav a { font-size: 13px; color: var(--ink-70); }
nav a:hover { color: var(--ink); }
@media (max-width: 900px) {
  .foot { margin-bottom: 62px; }
  .inner { grid-template-columns: 1fr 1fr; gap: 28px; }
  .brandcol { grid-column: 1 / -1; }
}
</style>
