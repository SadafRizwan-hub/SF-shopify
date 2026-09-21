<script setup>
/* The counter's WhatsApp Business number comes from config so it can be
   changed without touching code: NUXT_PUBLIC_WHATSAPP in .env. */
const { whatsapp } = useRuntimeConfig().public
const MESSAGE = "Hi, I'm enquiring about your fabrics on the website."
const href = computed(() => `https://wa.me/${whatsapp}?text=${encodeURIComponent(MESSAGE)}`)
</script>

<template>
  <a v-if="whatsapp" class="wa" :href="href" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.08-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.51-1.79-1.69-2.09-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.24-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.02-1.05 2.5 0 1.47 1.08 2.9 1.23 3.1.15.2 2.12 3.23 5.13 4.53.72.31 1.28.5 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z"/>
      <path d="M12.02 2C6.5 2 2.02 6.48 2.02 12c0 1.82.48 3.55 1.4 5.08L2 22l5.06-1.38A9.94 9.94 0 0 0 12.02 22C17.55 22 22 17.52 22 12S17.55 2 12.02 2Zm0 18.06c-1.65 0-3.2-.46-4.53-1.27l-.32-.19-3 .82.8-2.93-.21-.31A8.04 8.04 0 0 1 3.98 12c0-4.43 3.6-8.04 8.04-8.04 4.43 0 8.02 3.6 8.02 8.04 0 4.43-3.59 8.06-8.02 8.06Z"/>
    </svg>
  </a>
</template>

<style scoped>
.wa {
  position: fixed;
  right: 24px;
  bottom: 30px;
  z-index: 70;
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--ink);
  color: var(--paper);
  box-shadow: 0 8px 24px rgba(20, 17, 15, 0.28);
  transition: transform 0.16s, opacity 0.16s;
}
.wa:hover { opacity: 0.86; transform: translateY(-1px); }
.wa:active { transform: translateY(0); }

@media (max-width: 900px) {
  .wa { right: 16px; bottom: 96px; width: 48px; height: 48px; }
}
</style>

