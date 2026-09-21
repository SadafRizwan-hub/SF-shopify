<script setup>
defineProps({ error: { type: Object, required: true } })
</script>

<template>
  <NuxtLayout>
    <div class="shell gone">
      <h1>{{ error.statusCode === 404 ? "That page isn't on the shelf" : 'The counter is having trouble' }}</h1>
      <p class="meta">
        {{ error.statusCode === 404
          ? 'The link may be old, or the page may have been withdrawn. The rest of the catalog is still open.'
          : error.statusMessage || 'Something went wrong at our end. Try again in a moment.' }}
      </p>
      <button class="btn btn-primary" @click="clearError({ redirect: '/catalog' })">
        Open the catalog
      </button>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.gone { padding: 90px 0 120px; text-align: center; }
.gone h1 { font-size: clamp(26px, 4vw, 38px); margin-bottom: 12px; }
.gone .meta { max-width: 44ch; margin: 0 auto; }
.gone .btn { margin-top: 24px; }
</style>
