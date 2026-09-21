<script setup>
import { cutListCount, path, store } from '~/composables/store'

const nav = [
  { name: 'home', label: 'Home' },
  { name: 'catalog', label: 'Catalog' },
  { name: 'designs', label: 'Designs' },
  { name: 'about', label: 'The shop' },
]

const route = useRoute()

/* A fabric page still lights "Catalog", a design page still lights "Designs" —
   the old route-name check did the same thing before URLs existed. */
const active = (name) => {
  if (name === 'home') return route.path === '/'
  return route.path.startsWith(path(name)) || (name === 'catalog' && route.path.startsWith('/fabrics'))
}

/* Typing in the box only makes sense on the grid it filters. */
const router = useRouter()
function focusSearch() {
  if (!route.path.startsWith('/catalog')) router.push('/catalog')
}
</script>

<template>
  <header class="bar">
    <div class="shell inner">
      <NuxtLink class="brand" to="/">
        <span class="mark">SF</span>
        <span class="word">Singhania Fabrics</span>
      </NuxtLink>

      <nav class="nav">
        <NuxtLink
          v-for="n in nav"
          :key="n.name"
          :to="path(n.name)"
          :class="{ on: active(n.name) }"
        >{{ n.label }}</NuxtLink>
      </nav>

      <div class="tools">
        <label class="search">
          <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M13 13.5 17 17.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <input
            v-model="store.search"
            type="search"
            placeholder="Cambric, hakoba, 44&quot;…"
            @focus="focusSearch"
          >
        </label>
        <NuxtLink class="icon" title="Shortlist" :to="path('saved')" aria-label="Shortlist">
          <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
            <path d="M10 16.2 4.6 11a3.4 3.4 0 1 1 5.4-4 3.4 3.4 0 1 1 5.4 4Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
          </svg>
          <ClientOnly>
            <span v-if="store.saved.length" class="pip">{{ store.saved.length }}</span>
          </ClientOnly>
        </NuxtLink>
        <NuxtLink class="icon cut" title="Cut list" :to="path('cutlist')" aria-label="Cut list">
          <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
            <path d="M3.5 4.5h13M3.5 10h13M3.5 15.5h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
          </svg>
          <ClientOnly>
            <span v-if="cutListCount" class="pip">{{ cutListCount }}</span>
          </ClientOnly>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.bar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(248, 245, 239, 0.9);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--line-soft);
}
.inner {
  display: flex;
  align-items: center;
  gap: 26px;
  height: 66px;
}
.brand { display: flex; align-items: baseline; gap: 10px; flex-shrink: 0; }
.mark {
  font-family: var(--serif);
  font-size: 23px;
  letter-spacing: 0.5px;
}
.word {
  font-size: 11px;
  letter-spacing: 2.1px;
  text-transform: uppercase;
  color: var(--ink-70);
}
.nav { display: flex; gap: 4px; margin-right: auto; }
.nav a {
  padding: 8px 13px;
  border-radius: var(--r-pill);
  font-size: 13.5px;
  color: var(--ink-70);
  transition: background 0.14s, color 0.14s;
}
.nav a:hover { background: var(--sand); color: var(--ink); }
.nav a.on { color: var(--ink); font-weight: 500; background: var(--sand); }

.tools { display: flex; align-items: center; gap: 8px; }
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  height: 38px;
  width: 230px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--paper);
  color: var(--ink-45);
}
.search:focus-within { border-color: var(--line-strong); }
.search input {
  border: none;
  background: none;
  outline: none;
  width: 100%;
  font-size: 13px;
  color: var(--ink);
}
.search input::placeholder { color: var(--ink-45); }
.search input::-webkit-search-cancel-button { -webkit-appearance: none; }

.icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid transparent;
  color: var(--ink-70);
}
.icon:hover { background: var(--sand); color: var(--ink); }
.pip {
  position: absolute;
  top: 1px;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 9px;
  background: var(--ink);
  color: var(--paper);
  font-size: 10px;
  font-weight: 500;
  display: grid;
  place-items: center;
}

@media (max-width: 900px) {
  .nav, .search { display: none; }
  .inner { height: 58px; gap: 12px; }
  .tools { margin-left: auto; }
  .word { display: none; }
  .mark { font-size: 21px; }
  .brand::after {
    content: 'Singhania Fabrics';
    font-family: var(--serif);
    font-size: 16px;
  }
}
</style>
