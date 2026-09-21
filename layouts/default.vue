<template>
  <div class="layout">
    <header class="layout__header">
      <NuxtLink to="/" class="layout__brand">Home</NuxtLink>
      <nav>
        <CartLink />
      </nav>
    </header>

    <main class="layout__main">
      <slot />
    </main>

    <footer class="layout__footer">
      <small>Powered by Shopify</small>
    </footer>
  </div>
</template>
