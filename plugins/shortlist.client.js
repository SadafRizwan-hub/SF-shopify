/*
 * The shortlist and the cut list live in the browser, so they are restored
 * after hydration — never during SSR, where there is no localStorage and no
 * single visitor to have a list.
 */
import { restoreShortlist } from '~/composables/store'
import { useCartStore } from '~/stores/cart'

export default defineNuxtPlugin(() => {
  restoreShortlist()
  useCartStore().restore()
})
