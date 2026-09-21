<script setup>
import { toast } from '~/composables/store'
</script>

<template>
  <div class="layout">
    <SiteHeader />

    <main>
      <slot />
    </main>

    <SiteFooter />
    <MobileTabs />
    <WhatsAppButton />

    <!-- dev only: names the missing credential when the catalog won't load -->
    <SetupNotice />

    <!-- counter messages: a cancelled checkout, a swatch added -->
    <ClientOnly>
      <Transition name="toast">
        <p v-if="toast.message" class="toast" role="status">{{ toast.message }}</p>
      </Transition>
    </ClientOnly>
  </div>
</template>

<style scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; }
main { flex: 1; }

.toast {
  position: fixed;
  left: 50%;
  bottom: 30px;
  z-index: 80;
  transform: translateX(-50%);
  max-width: min(420px, calc(100vw - 32px));
  padding: 12px 18px;
  border-radius: var(--r-pill);
  background: var(--ink);
  color: var(--paper);
  font-size: 13px;
  box-shadow: var(--shadow-card);
}
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 8px); }
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }

@media (max-width: 900px) { .toast { bottom: 96px; } }
</style>
