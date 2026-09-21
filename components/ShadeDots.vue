<script setup>
import { computed } from 'vue'
import { shadeById } from '~/composables/catalogStore'

const props = defineProps({ shades: { type: Array, default: () => [] }, max: { type: Number, default: 4 } })
const shown = computed(() => props.shades.slice(0, props.max).map((id) => shadeById[id]).filter(Boolean))
const rest = computed(() => Math.max(0, props.shades.length - props.max))
</script>

<template>
  <div class="dots">
    <span v-for="s in shown" :key="s.id" class="dot" :style="{ background: s.hex }" :title="s.name" />
    <span v-if="rest" class="more">+{{ rest }} shades</span>
  </div>
</template>

<style scoped>
.dots { display: flex; align-items: center; gap: 5px; }
.dot {
  width: 11px; height: 11px; border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(20, 17, 15, 0.14);
}
.more { font-size: 11px; color: var(--ink-45); margin-left: 3px; }
</style>
