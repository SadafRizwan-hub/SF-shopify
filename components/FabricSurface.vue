<script setup>
/* Renders the photograph of a real product.

   There is deliberately no woven-texture stand-in any more: a CSS weave
   drawn from a `weave` field is a picture of cloth nobody photographed,
   and it read as stock we hold. What a product looks like now comes only
   from the photo the admin uploaded with it. Until that photo is there
   (or if it 404s), the surface stays an empty ground with the fabric's
   own description on it — plainly nothing, rather than a fake pattern. */
import { computed, ref, watch } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
  ratio: { type: String, default: '1 / 1' },
  caption: { type: Boolean, default: true },
})

/* the image is only trusted once it actually loads, so a set-but-broken
   photo falls back to the empty ground instead of a broken-image icon;
   a photo added later in the dashboard just starts working */
const failed = ref(false)
watch(() => props.item.photo, () => { failed.value = false })

const showsImage = computed(() => !!props.item.photo && !failed.value)
</script>

<template>
  <div class="surface" :style="{ aspectRatio: ratio }">
    <img v-if="showsImage" :src="item.photo" :alt="item.name" loading="lazy" @error="failed = true" />
    <div v-else class="blank">
      <span v-if="caption" class="hand">{{ item.sub || item.name }}</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.surface {
  position: relative;
  overflow: hidden;
  border-radius: var(--r-md);
  background: #efe8dc;
}
.surface img,
.surface > .blank {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* flat ground — no pattern, no texture: this is "no photo yet", not cloth */
.blank { background: var(--sand, #efe8dc); }
.hand {
  position: absolute;
  left: 10px;
  bottom: 9px;
  font-size: 10.5px;
  color: var(--ink-45);
  letter-spacing: 0.2px;
}
</style>
