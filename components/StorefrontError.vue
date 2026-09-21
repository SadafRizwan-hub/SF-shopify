<script setup>
/**
 * Shown when a Storefront API call fails. Keeps the reason on screen during
 * local development instead of silently rendering an empty page — a wrong
 * token or store domain is by far the most common cause.
 */
defineProps({
  error: { type: Object, required: true },
})
</script>

<template>
  <div class="error stack" role="alert">
    <p><strong>Could not load data from Shopify.</strong></p>
    <p>{{ error.statusMessage || error.message }}</p>
    <small v-if="error.statusCode === 403 || error.statusCode === 401">
      Check NUXT_PUBLIC_SHOPIFY_DOMAIN and NUXT_PUBLIC_SHOPIFY_TOKEN in your .env,
      and that the Storefront API scopes are enabled on the custom app.
    </small>
  </div>
</template>
