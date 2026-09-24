# Singhania Fabrics — Shopify theme

The Singhania Fabrics counter as a Shopify Online Store 2.0 theme, in
`theme/`. This branch carries the theme and nothing else.

```bash
./scripts/package-theme.sh    # writes dist/sf-shopi-theme.zip
```

Then **Online Store → Themes → Add theme → Upload zip file**, and preview
before publishing. Full setup, the data model and the three limits to know
about are in **[theme/README.md](theme/README.md)**.

Working on it with the CLI instead:

```bash
cd theme
shopify theme dev --store your-store.myshopify.com
shopify theme check
```

## Where the headless storefront went

The Nuxt 3 storefront that used to sit beside this theme is not on this
branch — Shopify's Online Store cannot run it, so it is only noise here. It
is unchanged on **`sf-shopi`**, which carries both fronts, and on
`claude/dazzling-keller-e79a7d`.

Nothing was lost by splitting them: the theme never referenced a file outside
`theme/`. The two fronts are interchangeable because they share a data model,
not code — the same products, the same `design-*` collections and the same
`custom.*` metafields, described in `theme/README.md`.

Two constants are therefore duplicated on purpose, and must be kept in step if
you run both fronts over one store:

| The theme | The headless storefront |
|---|---|
| `cut_unit_metres` (Theme settings → The counter) | `UNIT_METRES` in `composables/catalogStore.js` |
| `theme/snippets/shade-table.liquid` | `data/shades.js` |

Get the first pair out of step and one front bills every cut at half price.
A shade missing from one only means a neutral swatch there, not a breakage.
