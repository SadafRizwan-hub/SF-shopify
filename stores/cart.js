import { defineStore } from 'pinia'
import { shopifyRequest } from '~/composables/useShopify'
import {
  CART_CREATE,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
  CART_QUERY,
} from '~/composables/queries'

const STORAGE_KEY = 'shopify:cartId'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartId: null,
    lines: [],
    totalQuantity: 0,
    cost: null,
    checkoutUrl: null,
    loading: false,
    error: null,
    /** Cart is browser-only state, so nothing touches it until hydration. */
    ready: false,
  }),

  getters: {
    isEmpty: state => state.lines.length === 0,
    subtotal: state => state.cost?.subtotalAmount ?? null,
    /** Quantity already in the cart for a given variant id. */
    quantityOf: state => variantId =>
      state.lines
        .filter(line => line.merchandise?.id === variantId)
        .reduce((total, line) => total + line.quantity, 0),
  },

  actions: {
    /**
     * Restores the cart from localStorage, or leaves us cartless until the
     * first add (no point creating empty carts on every visit).
     * Safe to call repeatedly; only the first call does work.
     */
    async restore() {
      if (this.ready || import.meta.server) return
      this.ready = true

      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return

      this.cartId = saved
      await this.refresh()
    },

    /** Re-reads the cart from Shopify. Clears it if Shopify no longer has it. */
    async refresh() {
      if (!this.cartId) return
      await this.run(async () => {
        const data = await shopifyRequest(CART_QUERY, { cartId: this.cartId })
        if (!data.cart) {
          // Cart expired or was completed at checkout — start clean.
          this.reset()
          return
        }
        this.apply(data.cart)
      })
    },

    async addLine(variantId, quantity = 1) {
      await this.restore()

      if (!this.cartId) {
        await this.run(async () => {
          const data = await shopifyRequest(CART_CREATE, {
            lines: [{ merchandiseId: variantId, quantity }],
          })
          this.assertNoUserErrors(data.cartCreate)
          this.apply(data.cartCreate.cart)
          localStorage.setItem(STORAGE_KEY, this.cartId)
        })
        return
      }

      await this.run(async () => {
        const data = await shopifyRequest(CART_LINES_ADD, {
          cartId: this.cartId,
          lines: [{ merchandiseId: variantId, quantity }],
        })
        this.assertNoUserErrors(data.cartLinesAdd)
        this.apply(data.cartLinesAdd.cart)
      })
    },

    async updateLine(lineId, quantity) {
      if (quantity < 1) return this.removeLine(lineId)
      await this.run(async () => {
        const data = await shopifyRequest(CART_LINES_UPDATE, {
          cartId: this.cartId,
          lines: [{ id: lineId, quantity }],
        })
        this.assertNoUserErrors(data.cartLinesUpdate)
        this.apply(data.cartLinesUpdate.cart)
      })
    },

    async removeLine(lineId) {
      await this.run(async () => {
        const data = await shopifyRequest(CART_LINES_REMOVE, {
          cartId: this.cartId,
          lineIds: [lineId],
        })
        this.assertNoUserErrors(data.cartLinesRemove)
        this.apply(data.cartLinesRemove.cart)
      })
    },

    /** Hands off to Shopify's hosted checkout. */
    goToCheckout() {
      if (!this.checkoutUrl) return
      window.location.href = this.checkoutUrl
    },

    // --- internals -------------------------------------------------------

    apply(cart) {
      this.cartId = cart.id
      this.checkoutUrl = cart.checkoutUrl
      this.totalQuantity = cart.totalQuantity
      this.cost = cart.cost
      this.lines = cart.lines.nodes
    },

    reset() {
      this.cartId = null
      this.lines = []
      this.totalQuantity = 0
      this.cost = null
      this.checkoutUrl = null
      if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
    },

    assertNoUserErrors(payload) {
      const userErrors = payload?.userErrors ?? []
      if (userErrors.length) throw new Error(userErrors.map(e => e.message).join('; '))
    },

    /** Shared loading/error wrapper so every action reports state the same way. */
    async run(fn) {
      this.loading = true
      this.error = null
      try {
        await fn()
      }
      catch (err) {
        this.error = err.message || 'Something went wrong with the cart.'
        console.error('[cart]', err)
      }
      finally {
        this.loading = false
      }
    },
  },
})
