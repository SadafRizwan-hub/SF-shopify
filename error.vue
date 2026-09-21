<script setup>
defineProps({
  error: { type: Object, required: true },
})
</script>

<template>
  <div class="layout__main stack">
    <h1>{{ error.statusCode }}</h1>
    <p>{{ error.statusMessage || 'Something went wrong.' }}</p>
    <button type="button" class="button" @click="clearError({ redirect: '/' })">
      Back to store
    </button>
  </div>
</template>
