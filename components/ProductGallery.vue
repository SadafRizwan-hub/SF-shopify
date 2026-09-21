<script setup>
const props = defineProps({
  images: { type: Array, default: () => [] },
  title: { type: String, default: '' },
})

const activeIndex = ref(0)
const active = computed(() => props.images[activeIndex.value] ?? null)
</script>

<template>
  <div class="gallery">
    <img
      v-if="active"
      :src="active.url"
      :alt="active.altText || title"
      :width="active.width"
      :height="active.height"
      class="gallery__main"
    >

    <ul v-if="images.length > 1" class="gallery__thumbs">
      <li v-for="(image, index) in images" :key="image.url">
        <button
          type="button"
          :aria-current="index === activeIndex"
          :aria-label="`View image ${index + 1}`"
          @click="activeIndex = index"
        >
          <img :src="image.url" :alt="image.altText || ''" width="64" height="64" loading="lazy">
        </button>
      </li>
    </ul>
  </div>
</template>
