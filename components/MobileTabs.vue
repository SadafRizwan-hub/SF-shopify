<script setup>
import { cutListCount, path } from '~/composables/store'

const route = useRoute()
const at = prefixes => prefixes.some(p => p === '/' ? route.path === '/' : route.path.startsWith(p))
</script>

<template>
  <nav class="tabs">
    <NuxtLink :to="path('home')" :class="{ on: at(['/']) }">
      <svg viewBox="0 0 20 20" width="18" height="18"><path d="M3 9 10 3.5 17 9v7.5h-4.5V12h-5v4.5H3Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
      <span>Home</span>
    </NuxtLink>
    <NuxtLink :to="path('catalog')" :class="{ on: at(['/catalog', '/fabrics']) }">
      <svg viewBox="0 0 20 20" width="18" height="18"><rect x="3.2" y="3.2" width="13.6" height="13.6" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3.2 10h13.6M10 3.2v13.6" stroke="currentColor" stroke-width="1.3"/></svg>
      <span>Catalog</span>
    </NuxtLink>
    <NuxtLink :to="path('designs')" :class="{ on: at(['/designs']) }">
      <svg viewBox="0 0 20 20" width="18" height="18"><path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
      <span>Designs</span>
    </NuxtLink>
    <NuxtLink :to="path('cutlist')" :class="{ on: at(['/cut-list']) }">
      <svg viewBox="0 0 20 20" width="18" height="18"><path d="M6.5 3.5v9M13.5 3.5v9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="6.5" cy="15" r="2.1" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="13.5" cy="15" r="2.1" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>
      <span>Cut list</span>
      <ClientOnly>
        <i v-if="cutListCount" class="pip">{{ cutListCount }}</i>
      </ClientOnly>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.tabs {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 45;
  display: none;
  background: rgba(248, 245, 239, 0.94);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--line-soft);
  padding-bottom: env(safe-area-inset-bottom);
}
.tabs a {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 9px 0 8px;
  color: var(--ink-45);
}
.tabs a span {
  font-size: 9.5px;
  letter-spacing: 1.15px;
  text-transform: uppercase;
}
.tabs a.on { color: var(--ink); }
.tabs a.on span { font-weight: 500; }
.pip {
  position: absolute;
  top: 4px;
  left: 50%;
  margin-left: 6px;
  min-width: 15px; height: 15px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--ink);
  color: var(--paper);
  font-size: 9.5px;
  font-style: normal;
  display: grid; place-items: center;
}
@media (max-width: 900px) { .tabs { display: flex; } }
</style>
