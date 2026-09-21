<script setup>
import { PHOTO } from '~/data/photos'
import { go } from '~/composables/store'
</script>

<template>
  <div class="page">
    <div class="shell">
      <header class="top">
        <span class="label">Kalbadevi, Mumbai · since 1974</span>
        <h1>Three generations behind one counter</h1>
        <p class="lede">
          Singhania Fabrics sells cloth the way the market has always sold it — off the
          than, cut to your metre, at the rate the trade pays. The app is only the counter,
          moved somewhere you can reach it at eleven at night.
        </p>
      </header>

      <div class="strip">
        <img v-if="PHOTO.stack" :src="PHOTO.stack" alt="Dyed stock stacked by shade">
        <img v-if="PHOTO.position" :src="PHOTO.position" alt="Position print with sequin work">
        <img v-if="PHOTO.kalamkari" :src="PHOTO.kalamkari" alt="Pen kalamkari on silk">
      </div>

      <div class="cols">
        <section>
          <h2>How the rate works</h2>
          <p>
            One rate, printed. Cross the slab — usually ten or eleven metres — and the
            lower rate applies to the whole cut, not just the metres past it. Nothing is
            marked up to be discounted back down.
          </p>
        </section>
        <section>
          <h2>Why every shade has a name</h2>
          <p>
            Screen colour cannot be trusted, and the dye lot moves. Each shade in the app
            carries the name the godown uses, so a phone call about "Indigo on 60*60"
            reaches the same bolt every time. Order the ₹20 swatch card before a large cut.
          </p>
        </section>
        <section>
          <h2>Cutting and dispatch</h2>
          <p>
            Cut in half-metre steps, folded, and dispatched the same evening for orders
            placed before 5 pm. Cut cloth cannot be taken back, which is the one rule the
            counter has never bent.
          </p>
        </section>
        <section>
          <h2>Visit the shop</h2>
          <p>
            2nd floor, Mangaldas Market, Kalbadevi Road. Monday to Saturday, 10.30 am to
            7.30 pm. Ask for the design book at the counter — it holds more than the app.
          </p>
        </section>
      </div>

      <div class="cta">
        <button class="btn btn-primary" @click="go('catalog')">Browse the catalog</button>
        <button class="btn btn-ghost" @click="go('designs')">See the design book</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 40px 20px 100px; }
.top { max-width: 640px; margin-bottom: 40px; }
.top h1 { font-size: clamp(30px, 4.6vw, 46px); margin: 14px 0 18px; }
.lede { font-size: 15px; line-height: 1.65; color: var(--ink-70); margin: 0; }
.strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 48px; }
.strip img { aspect-ratio: 1; object-fit: cover; border-radius: var(--r-md); width: 100%; }
.cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 34px 48px; }
.cols h2 { font-size: 21px; margin-bottom: 10px; }
.cols p { margin: 0; font-size: 14px; line-height: 1.65; color: var(--ink-70); max-width: 52ch; }
.cta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 46px; }
@media (max-width: 700px) {
  .cols { grid-template-columns: 1fr; gap: 28px; }
  .strip { gap: 8px; }
  .cta .btn { flex: 1; }
}
</style>
