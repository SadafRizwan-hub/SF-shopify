/*
 * The fabric page's counter: design, shade, tier, metres.
 *
 * Liquid has already rendered a correct first paint against the first
 * sellable variant. This file only moves that state as the shopper picks:
 * it never invents a variant, and when a design + shade pair has no stock
 * unit behind it the button says so rather than adding the wrong colour.
 */
(function () {
  'use strict';

  var root = document.querySelector('[data-fabric-page]');
  if (!root) return;

  /*
   * The gallery is wired first and on its own, because everything below it
   * depends on a JSON payload Liquid writes — and a single Liquid error in
   * that payload used to take the thumbnails down with the rest of the page.
   * Switching photographs is not worth that coupling.
   */
  var galleryMain = root.querySelector('[data-gallery-main]');

  /* The surface serves a srcset, so the browser picks from that and ignores a
     changed src. Clearing it is what actually swaps the photograph. */
  function showPhoto(url) {
    if (!galleryMain || !url) return;
    var img = galleryMain.querySelector('img');
    if (!img) return;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = url;
  }

  root.addEventListener('click', function (event) {
    var thumb = event.target.closest('[data-src]');
    if (!thumb) return;
    showPhoto(thumb.getAttribute('data-src'));
    root.querySelectorAll('[data-src]').forEach(function (other) {
      other.setAttribute('aria-current', other === thumb ? 'true' : 'false');
    });
  });

  var payload = root.querySelector('[data-fabric-json]');
  if (!payload) return;

  var data;
  try {
    data = JSON.parse(payload.textContent);
  } catch (e) {
    /* a malformed payload must not take the page down — Liquid's first paint
       stays on screen and the form still posts the variant it rendered */
    return;
  }

  var SF = window.SF || {};
  var UNIT = data.unit || SF.cutUnitMetres || 0.5;
  var PER_METRE = 1 / UNIT;

  var shadeIndex = data.shadePosition - 1;
  var designIndex = data.designPosition - 1;

  var el = {
    variantId: root.querySelector('[data-variant-id]'),
    units: root.querySelector('[data-units]'),
    metres: root.querySelector('[data-metres]'),
    addMetres: root.querySelector('[data-add-metres]'),
    addShade: root.querySelector('[data-add-shade]'),
    add: root.querySelector('[data-add]'),
    total: root.querySelector('[data-total]'),
    unitRate: root.querySelector('[data-unit-rate]'),
    retailRate: root.querySelector('[data-retail-rate]'),
    stepRate: root.querySelector('[data-step-rate]'),
    moq: root.querySelector('[data-moq]'),
    shadeGrid: root.querySelector('[data-shade-grid]'),
    shadeChosen: root.querySelector('[data-shade-chosen]'),
    shadeCount: root.querySelector('[data-shade-count]'),
    designChosen: root.querySelector('[data-design-chosen]'),
    tierLabel: root.querySelector('[data-tier-label]'),
    slabline: root.querySelector('[data-slabline]'),
    minus: root.querySelector('[data-step="-1"]')
  };

  var state = {
    design: designIndex >= 0 ? optionOf(firstSelected(), designIndex) : null,
    shade: shadeIndex >= 0 ? optionOf(firstSelected(), shadeIndex) : null,
    tier: null,
    metres: 0
  };

  function firstSelected() {
    var id = el.variantId ? Number(el.variantId.value) : 0;
    return find(function (v) { return v.id === id; }) || data.variants[0];
  }

  function find(test) {
    for (var i = 0; i < data.variants.length; i++) {
      if (test(data.variants[i])) return data.variants[i];
    }
    return null;
  }

  function optionOf(variant, index) {
    return variant && variant.options ? variant.options[index] : null;
  }

  function matches(variant) {
    if (designIndex >= 0 && variant.options[designIndex] !== state.design) return false;
    if (shadeIndex >= 0 && variant.options[shadeIndex] !== state.shade) return false;
    return true;
  }

  function currentVariant() {
    return find(matches);
  }

  function money(cents) {
    return SF.formatMoney ? SF.formatMoney(cents) : (cents / 100).toFixed(2);
  }

  function showMetres(metres) {
    return SF.formatMetres ? SF.formatMetres(metres) : String(metres);
  }

  /* ---- shades ---------------------------------------------------------- */

  function paintShades() {
    if (!el.shadeGrid || shadeIndex < 0) return;

    var visible = 0;

    el.shadeGrid.querySelectorAll('[data-shade]').forEach(function (cell) {
      var value = cell.getAttribute('data-shade');

      var inGroup = false;
      var sellable = false;
      data.variants.forEach(function (variant) {
        if (variant.options[shadeIndex] !== value) return;
        if (designIndex >= 0 && variant.options[designIndex] !== state.design) return;
        inGroup = true;
        if (variant.available) sellable = true;
      });

      cell.hidden = !inGroup;
      if (inGroup) visible += 1;
      cell.disabled = !sellable;
      cell.classList.toggle('out', !sellable);
      cell.classList.toggle('on', value === state.shade);
      cell.setAttribute('aria-pressed', value === state.shade ? 'true' : 'false');

      var slash = cell.querySelector('.slash');
      if (!sellable && !slash) {
        var mark = document.createElement('span');
        mark.className = 'slash';
        cell.querySelector('.swatch').appendChild(mark);
      } else if (sellable && slash) {
        slash.remove();
      }
    });

    if (el.shadeCount) el.shadeCount.textContent = visible;
    if (el.shadeChosen) el.shadeChosen.textContent = state.shade || '';
    if (el.addShade) el.addShade.textContent = state.shade || '';
  }

  /* Switching design can leave the chosen shade outside the new design's
     colour set. Move to the first sellable shade under it rather than
     leaving a selection that resolves to no stock unit. */
  function reconcileShade() {
    if (shadeIndex < 0) return;

    var stillThere = find(function (v) {
      if (designIndex >= 0 && v.options[designIndex] !== state.design) return false;
      return v.options[shadeIndex] === state.shade && v.available;
    });
    if (stillThere) return;

    var fallback = find(function (v) {
      if (designIndex >= 0 && v.options[designIndex] !== state.design) return false;
      return v.available;
    });
    if (fallback) state.shade = fallback.options[shadeIndex];
  }

  /* ---- pricing --------------------------------------------------------- */

  function rateCents() {
    if (state.tier) return state.tier.rate;
    var variant = currentVariant();
    var price = variant ? variant.price : data.variants[0].price;
    return Math.round(price * PER_METRE);
  }

  /*
   * Retail's MOQ is per shade, not one number for the whole fabric — one
   * colour may cut from 0.5 m, another only from 1 m. Under a wholesale tier
   * the floor is that tier's own rung: dropping below it would silently
   * undercharge, because the checkout total is what is shown here.
   */
  function floorMetres() {
    if (state.tier) return state.tier.from;
    var variant = currentVariant();
    return variant && variant.minCut ? Number(variant.minCut) : UNIT;
  }

  function paintTiers() {
    root.querySelectorAll('[data-tier]').forEach(function (row) {
      var on = state.tier ? row === state.tier.el : row.getAttribute('data-tier') === 'retail';
      row.classList.toggle('on', on);
    });
    if (el.tierLabel) el.tierLabel.textContent = state.tier ? 'Wholesale' : 'Retail';
    if (el.slabline) {
      el.slabline.classList.toggle('hit', !!state.tier);
      if (state.tier) el.slabline.textContent = 'Wholesale rate applied';
      else if (el.slabline.dataset.retail) el.slabline.textContent = el.slabline.dataset.retail;
    }
  }

  /* ---- paint ----------------------------------------------------------- */

  function paint() {
    var variant = currentVariant();
    var floor = floorMetres();

    if (state.metres < floor) state.metres = floor;
    state.metres = Math.max(floor, Math.round(state.metres / UNIT) * UNIT);

    var rate = rateCents();
    var units = Math.max(1, Math.round(state.metres / UNIT));

    if (el.variantId && variant) el.variantId.value = variant.id;
    if (el.units) el.units.value = units;
    if (el.metres) el.metres.textContent = showMetres(state.metres);
    if (el.addMetres) el.addMetres.textContent = showMetres(state.metres);
    if (el.total) el.total.textContent = money(Math.round(rate * state.metres));
    if (el.stepRate) el.stepRate.textContent = money(rate);
    if (el.moq) el.moq.textContent = showMetres(floorMetres());
    if (el.minus) el.minus.disabled = state.metres <= floor;

    if (variant && !state.tier) {
      var retail = Math.round(variant.price * PER_METRE);
      if (el.unitRate) el.unitRate.textContent = money(retail);
      if (el.retailRate) el.retailRate.textContent = money(retail);
    }

    if (el.designChosen) el.designChosen.textContent = state.design || '';

    if (el.add) {
      var sellable = variant && variant.available;
      el.add.disabled = !sellable;
      if (!variant) el.add.textContent = 'Unavailable';
      else if (!variant.available) el.add.textContent = 'Out of stock';
      else if (el.addMetres) {
        /* rebuild the label without clobbering the spans the rest of this
           function writes into */
        el.addMetres.textContent = showMetres(state.metres);
      }
    }

    /* a shade with its own photograph moves the gallery to it */
    if (variant && variant.image) {
      var shown = galleryMain && galleryMain.querySelector('img');
      if (shown && shown.src !== variant.image) showPhoto(variant.image);
    }

    /* keep the address bar on the variant being read, so a shared link opens
       on the same shade the shopper was looking at */
    if (variant && window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }
  }

  /* ---- events ---------------------------------------------------------- */

  root.addEventListener('click', function (event) {
    var shade = event.target.closest('[data-shade]');
    if (shade && !shade.disabled) {
      state.shade = shade.getAttribute('data-shade');
      paintShades();
      paint();
      return;
    }

    var design = event.target.closest('[data-design]');
    if (design) {
      state.design = design.getAttribute('data-design');
      root.querySelectorAll('[data-design-card]').forEach(function (card) {
        card.classList.toggle('on', card.getAttribute('data-design-card') === state.design);
      });
      root.querySelectorAll('[data-design]').forEach(function (pick) {
        pick.setAttribute('aria-pressed', pick.getAttribute('data-design') === state.design ? 'true' : 'false');
      });
      reconcileShade();
      paintShades();
      paint();
      return;
    }

    var tier = event.target.closest('[data-tier]');
    if (tier) {
      if (tier.getAttribute('data-tier') === 'retail') {
        state.tier = null;
      } else {
        state.tier = {
          el: tier,
          rate: Number(tier.getAttribute('data-rate')),
          from: Number(tier.getAttribute('data-from'))
        };
        if (state.metres < state.tier.from) state.metres = state.tier.from;
      }
      paintTiers();
      paint();
      return;
    }

    var step = event.target.closest('[data-step]');
    if (step) {
      var delta = Number(step.getAttribute('data-step')) * UNIT;
      state.metres = Math.max(floorMetres(), state.metres + delta);
      paint();
      return;
    }

  });

  if (el.slabline) el.slabline.dataset.retail = el.slabline.textContent.trim();

  state.metres = floorMetres();
  paintShades();
  paintTiers();
  paint();
})();
