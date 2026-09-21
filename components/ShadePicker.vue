<script setup>
import { computed } from 'vue'
import { shadeById } from '~/composables/catalogStore'

const props = defineProps({
  shades: { type: Array, required: true },
  out: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
  columns: { type: Number, default: 6 },
})
const emit = defineEmits(['update:modelValue'])

const list = computed(() => props.shades.map((id) => shadeById[id]).filter(Boolean))
const isOut = (id) => props.out.includes(id)
</script>

<template>
  <div>
    <div class="grid" :style="{ '--cols': columns }">
      <button
        v-for="s in list"
        :key="s.id"
        class="cell"
        :class="{ on: modelValue === s.id, out: isOut(s.id) }"
        :disabled="isOut(s.id)"
        :aria-pressed="modelValue === s.id"
        @click="emit('update:modelValue', s.id)"
      >
        <span class="swatch" :style="{ background: s.hex }">
          <span v-if="isOut(s.id)" class="slash" />
        </span>
        <span class="name">{{ s.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 14px 8px;
}
.cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 0;
}
.swatch {
  position: relative;
  width: 100%;
  max-width: 54px;
  aspect-ratio: 1;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(20, 17, 15, 0.14);
  transition: box-shadow 0.14s, transform 0.14s;
}
.cell:hover:not(.out) .swatch { transform: scale(1.05); }
.cell.on .swatch { box-shadow: inset 0 0 0 1px rgba(20,17,15,.14), 0 0 0 2px var(--ivory), 0 0 0 4px var(--ink); }
.name { font-size: 10.5px; color: var(--ink-70); }
.cell.on .name { color: var(--ink); font-weight: 500; }
.cell.out { cursor: not-allowed; }
.cell.out .swatch { opacity: 0.45; }
.cell.out .name { color: var(--ink-45); }
.slash {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, transparent 46%, rgba(255,253,248,.95) 46% 54%, transparent 54%);
}
</style>
