/*
 * The design page's shade filter.
 *
 * A design is one drawing printed on several grounds and dyed in several
 * colours. Picking a shade here answers the question the page is actually
 * asked at the counter — "show me this design in black" — by moving the
 * drawing to that colourway and narrowing the grounds to the ones that come
 * in it.
 *
 * Liquid has already rendered the whole page against every shade. Nothing
 * below fetches; it only hides, swaps and relabels what is there, so the
 * page is complete and readable before this file runs at all.
 */
(function () {
  'use strict';

  var root = document.querySelector('.book.design');
  if (!root) return;

  var payload = root.querySelector('[data-design-json]');
  if (!payload) return;

  var data;
  try {
    data = JSON.parse(payload.textContent);
  } catch (e) {
    /* a malformed payload leaves Liquid's first paint on screen, which is
       the unfiltered page — worse than the filter, but never a broken one */
    return;
  }

  var grid = root.querySelector('[data-shade-grid]');
  var main = root.querySelector('[data-design-main]');
  var badge = root.querySelector('[data-design-shown]');
  var reset = root.querySelector('[data-shade-reset]');
  var countLine = root.querySelector('[data-design-count]');
  var emptyNote = root.querySelector('[data-grounds-empty]');
  var rows = [].slice.call(root.querySelectorAll('[data-ground]'));
  if (!grid) return;

  var heroShown = main ? main.getAttribute('data-image-id') : null;
  var countTemplate = countLine ? countLine.textContent.replace(/\s+/g, ' ').trim() : '';
  var active = null;

  function groundOf(id) {
    for (var i = 0; i < data.grounds.length; i++) {
      if (String(data.grounds[i].id) === String(id)) return data.grounds[i];
    }
    return null;
  }

  /* the first variant of this ground dyed in this shade, preferring one that
     can actually be sold — a sold-out colourway is still worth showing, but
     it should not be the one whose photograph and link the row carries */
  function shadeOf(ground, name) {
    var fallback = null;
    for (var i = 0; i < ground.shades.length; i++) {
      var row = ground.shades[i];
      if (row.name !== name) continue;
      if (row.available) return row;
      if (!fallback) fallback = row;
    }
    return fallback;
  }

  function swap(el, url, id) {
    if (!el || !url) return;
    var img = el.querySelector('img');
    if (!img) return;
    if (id != null && el.getAttribute('data-image-id') === String(id)) return;
    /* the surface serves a srcset, so the browser picks from that and
       ignores a changed src — clearing it is what swaps the photograph */
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = url;
    el.setAttribute('data-image-id', id == null ? '' : String(id));
  }

  function paint() {
    var visible = 0;
    var lead = null;

    rows.forEach(function (row) {
      var ground = groundOf(row.getAttribute('data-ground'));
      var base = row.getAttribute('data-url');
      var thumb = row.querySelector('[data-ground-thumb]');

      if (!active) {
        row.hidden = false;
        visible += 1;
        row.href = base;
        if (ground) swap(thumb, ground.thumb, ground.imageId);
        return;
      }

      var match = ground ? shadeOf(ground, active) : null;
      row.hidden = !match;
      if (!match) return;

      visible += 1;
      if (!lead) lead = match;
      /* land on the shade that was picked, not on the fabric's first one */
      row.href = base + (base.indexOf('?') === -1 ? '?' : '&') + 'variant=' + match.variant;
      swap(thumb, match.thumb || ground.thumb, match.thumb ? match.imageId : ground.imageId);
    });

    /* no shade picked, or one no ground on this page is dyed in: the
       design's own drawing is the honest thing to show */
    if (active && lead && lead.image) swap(main, lead.image, lead.imageId);
    else if (data.hero) swap(main, data.hero, data.heroId != null ? data.heroId : heroShown);

    if (badge) {
      badge.hidden = !active;
      badge.textContent = active || '';
    }
    if (reset) reset.hidden = !active;
    if (emptyNote) emptyNote.hidden = !(active && visible === 0);

    if (countLine) {
      if (!active) countLine.textContent = countTemplate;
      else if (visible === 0) countLine.textContent = 'Design · not dyed in ' + active + ' on this page';
      else countLine.textContent = 'Design · in ' + active + ' on ' + visible + ' ' + (visible === 1 ? 'fabric' : 'fabrics');
    }

    grid.querySelectorAll('[data-shade]').forEach(function (cell) {
      var on = cell.getAttribute('data-shade') === active;
      cell.classList.toggle('on', on);
      cell.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    /* so a shade can be sent on WhatsApp the way the design itself can */
    if (window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      if (active) url.searchParams.set('shade', active);
      else url.searchParams.delete('shade');
      window.history.replaceState({}, '', url.toString());
    }
  }

  root.addEventListener('click', function (event) {
    if (event.target.closest('[data-shade-reset]')) {
      active = null;
      paint();
      return;
    }
    var cell = event.target.closest('[data-shade]');
    if (!cell) return;
    var name = cell.getAttribute('data-shade');
    /* clicking the shade already on clears it, so the filter has a way out
       even when the reset button has scrolled off */
    active = active === name ? null : name;
    paint();
  });

  /* ?shade=Black opens on that colourway, matched loosely so a link typed by
     hand — or lower-cased by a chat app — still lands */
  var asked = new URL(window.location.href).searchParams.get('shade');
  if (asked) {
    grid.querySelectorAll('[data-shade]').forEach(function (cell) {
      var name = cell.getAttribute('data-shade');
      if (!active && name.toLowerCase() === asked.toLowerCase()) active = name;
    });
  }
  if (active) paint();
})();
