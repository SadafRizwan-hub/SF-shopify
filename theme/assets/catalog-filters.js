/*
 * Colour / design / fabric filtering for the catalog, for the facets the
 * store has no Search & Discovery filter for.
 *
 * Where a native filter exists the rail renders links and Shopify does the
 * work server-side across the whole collection — this file never touches
 * those. It only drives the buttons the rail falls back to, and it filters
 * the cards already on the page, which is the honest limit of doing this in
 * the browser. The rail says so when the collection runs to more than a page.
 *
 * The rail is rendered twice (the desktop column and the phone sheet), so
 * every toggle is applied to both copies by value rather than by element.
 */
(function () {
  'use strict';

  var grid = document.querySelector('.results .grid') || document.querySelector('.grid');
  var buttons = document.querySelectorAll('[data-facet][data-value]');
  if (!grid || !buttons.length) return;

  /* group -> Set of selected handles */
  var chosen = { type: [], shades: [], designs: [] };

  var EMPTY_LABEL = {
    type: 'none',
    shades: 'tap to add',
    designs: 'none selected'
  };

  function tokensOf(card, group) {
    var raw = card.getAttribute(group === 'type' ? 'data-type' : 'data-' + group) || '';
    return raw.split(/\s+/).filter(Boolean);
  }

  /* A card survives a group when it carries ANY of that group's selections,
     and it must survive every group that has a selection — the same "and
     across facets, or within a facet" rule the native filters use. */
  function matches(card) {
    for (var group in chosen) {
      var picked = chosen[group];
      if (!picked.length) continue;
      var has = tokensOf(card, group);
      var hit = picked.some(function (value) { return has.indexOf(value) !== -1; });
      if (!hit) return false;
    }
    return true;
  }

  function apply() {
    var cards = grid.querySelectorAll('.card');
    var shown = 0;

    cards.forEach(function (card) {
      var ok = matches(card);
      /* the card's own wrapper when there is one, else the card */
      var host = card.parentElement && card.parentElement.hasAttribute('data-shortlist-item')
        ? card.parentElement
        : card;
      host.hidden = !ok;
      if (ok) shown += 1;
    });

    var count = document.querySelector('[data-shown]');
    if (count) count.textContent = shown;

    Object.keys(chosen).forEach(function (group) {
      document.querySelectorAll('[data-facet-count="' + group + '"]').forEach(function (el) {
        el.textContent = chosen[group].length
          ? chosen[group].length + ' selected'
          : EMPTY_LABEL[group];
      });
    });

    var empty = document.querySelector('[data-facet-empty]');
    if (empty) empty.hidden = shown !== 0 || cards.length === 0;
  }

  function paint() {
    document.querySelectorAll('[data-facet][data-value]').forEach(function (btn) {
      var group = btn.getAttribute('data-facet');
      var on = chosen[group] && chosen[group].indexOf(btn.getAttribute('data-value')) !== -1;
      btn.classList.toggle('on', !!on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  document.addEventListener('click', function (event) {
    var reset = event.target.closest('[data-facet-reset]');
    if (reset) {
      var any = chosen.type.length || chosen.shades.length || chosen.designs.length;
      if (any) {
        /* a native filter is in the URL too, so only swallow the click when
           this page's selection is the only thing that needs clearing */
        if (window.location.search.indexOf('filter.') === -1) event.preventDefault();
        chosen = { type: [], shades: [], designs: [] };
        paint();
        apply();
      }
      return;
    }

    var btn = event.target.closest('[data-facet][data-value]');
    if (!btn) return;

    event.preventDefault();
    var group = btn.getAttribute('data-facet');
    var value = btn.getAttribute('data-value');
    if (!chosen[group]) return;

    var i = chosen[group].indexOf(value);
    if (i === -1) chosen[group].push(value);
    else chosen[group].splice(i, 1);

    paint();
    apply();
  });

  paint();
  apply();
})();
