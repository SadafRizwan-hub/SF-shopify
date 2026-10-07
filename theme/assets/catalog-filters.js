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
  var chosen = { type: [], shades: [], designs: [], families: [] };

  var EMPTY_LABEL = {
    type: 'none',
    shades: 'tap to add',
    designs: 'none selected',
    families: 'none'
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

  /*
   * A card filtered to Black shows the black cloth. The photographs come from
   * the image attached to each shade's variant in the admin; a shade with none
   * keeps the product's default rather than showing the wrong colour.
   *
   * The surface serves a srcset, so the browser picks from that and ignores a
   * changed src — clearing it is what actually swaps the photograph.
   */
  function shadePhoto(card) {
    var img = card.querySelector('img');
    if (!img) return;

    if (!img.hasAttribute('data-original-src')) {
      img.setAttribute('data-original-src', img.currentSrc || img.src);
      img.setAttribute('data-original-srcset', img.getAttribute('srcset') || '');
    }

    var map;
    try {
      map = JSON.parse(card.getAttribute('data-shade-images') || '{}');
    } catch (e) {
      map = {};
    }

    var wanted = null;
    if (chosen.shades.length) {
      for (var i = 0; i < chosen.shades.length; i++) {
        if (map[chosen.shades[i]]) { wanted = map[chosen.shades[i]]; break; }
      }
    }

    /* a shade the shopper pressed on the card itself outlives a filter that
       says nothing about colour — repainting over their choice would undo a
       thing they did on purpose */
    if (!wanted) {
      var picked = card.getAttribute('data-picked-shade');
      if (picked && map[picked]) wanted = map[picked];
    }

    if (wanted) {
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.src = wanted;
    } else {
      var back = img.getAttribute('data-original-srcset');
      if (back) img.setAttribute('srcset', back);
      img.src = img.getAttribute('data-original-src');
    }
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
      if (ok) { shown += 1; shadePhoto(card); }
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
      var any = chosen.type.length || chosen.shades.length || chosen.designs.length || chosen.families.length;
      if (any) {
        /* a native filter is in the URL too, so only swallow the click when
           this page's selection is the only thing that needs clearing */
        if (window.location.search.indexOf('filter.') === -1) event.preventDefault();
        chosen = { type: [], shades: [], designs: [], families: [] };
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

  /*
   * #design=ekdali (also #shade=, #type=, #family=) opens the catalog already
   * narrowed. It is how a design with no page of its own — one that exists only
   * as a Design option value — hands a shopper on to its cloth. Only values the
   * rail actually offers are taken, so a stale or hand-typed link narrows
   * nothing rather than emptying the page.
   */
  function fromHash() {
    var groups = { design: 'designs', shade: 'shades', type: 'type', family: 'families' };
    window.location.hash.replace(/^#/, '').split('&').forEach(function (part) {
      var kv = part.split('=');
      var group = groups[kv[0]];
      if (!group || !kv[1]) return;
      var wanted;
      try { wanted = decodeURIComponent(kv[1]).split(','); } catch (e) { return; }
      var offered = [];
      buttons.forEach(function (btn) {
        if (btn.getAttribute('data-facet') === group) offered.push(btn.getAttribute('data-value'));
      });
      wanted.forEach(function (value) {
        if (offered.indexOf(value) !== -1 && chosen[group].indexOf(value) === -1) chosen[group].push(value);
      });
    });
  }

  fromHash();
  paint();
  apply();
})();
