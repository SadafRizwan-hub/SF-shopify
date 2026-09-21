<script setup>
/*
 * A developer's notice, rendered only under `nuxt dev`. Without it a missing
 * .env looks exactly like a shopper-facing outage — the catalog says "we
 * couldn't reach the counter" and nothing tells you which credential is
 * absent. `import.meta.dev` is compiled out of a build, so the shop copy is
 * never affected in production.
 */
import { catalog } from '~/composables/catalogStore'

const isDev = import.meta.dev

const config = useRuntimeConfig().public
const missing = computed(() => {
  const gaps = []
  if (!config.shopifyDomain) gaps.push('NUXT_PUBLIC_SHOPIFY_DOMAIN')
  if (!config.shopifyToken) gaps.push('NUXT_PUBLIC_SHOPIFY_TOKEN')
  return gaps
})
</script>

<template>
  <aside v-if="isDev && catalog.failed" class="setup">
    <template v-if="missing.length">
      <b>No Shopify credentials.</b>
      Copy <code>.env.example</code> to <code>.env</code>, set
      <code v-for="(m, i) in missing" :key="m">{{ m }}{{ i < missing.length - 1 ? ' ' : '' }}</code>
      and restart <code>npm run dev</code>.
    </template>
    <template v-else>
      <b>Shopify rejected the request:</b> {{ catalog.reason }}
      <span class="hint">
        Check the store domain, that the token is a Storefront token and not an
        Admin one, and that the app's Storefront API scopes are enabled.
      </span>
    </template>
  </aside>
</template>

<style scoped>
.setup {
  position: fixed;
  left: 16px; right: 16px; bottom: 16px;
  z-index: 90;
  max-width: 620px;
  margin-inline: auto;
  padding: 14px 18px;
  border-radius: var(--r-md);
  border: 1px solid var(--terracotta);
  background: var(--ivory);
  color: var(--ink);
  font-size: 13px;
  line-height: 1.6;
  box-shadow: var(--shadow-card);
}
.setup code {
  padding: 1px 5px;
  border-radius: var(--r-sm);
  background: var(--sand);
  font-size: 12px;
}
.hint { display: block; margin-top: 6px; color: var(--ink-70); font-size: 12px; }
@media (max-width: 900px) { .setup { bottom: 74px; } }
</style>
