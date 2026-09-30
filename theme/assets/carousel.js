/*
 * The homepage carousels.
 *
 * The rail is a real horizontal scroller: it swipes on a phone and scrolls
 * with a trackpad whether or not this file loads. All this adds is the pair
 * of arrows — and it only shows them once it has measured that there is
 * something off-screen to scroll to.
 */
(function () {
  'use strict';

  function wire(root) {
    var rail = root.querySelector('[data-carousel-rail]');
    if (!rail) return;

    var buttons = [].slice.call(root.querySelectorAll('[data-car]'));
    if (!buttons.length) return;

    /* one press moves one screenful, less a card's worth of overlap so the
       shopper keeps something they have already seen as an anchor */
    function page() {
      var cell = rail.querySelector('.carcell');
      var step = cell ? cell.getBoundingClientRect().width : rail.clientWidth / 2;
      return Math.max(step, rail.clientWidth - step * 0.35);
    }

    function overflowing() {
      return rail.scrollWidth - rail.clientWidth > 2;
    }

    function paint() {
      var over = overflowing();
      var x = rail.scrollLeft;
      var max = rail.scrollWidth - rail.clientWidth;
      buttons.forEach(function (btn) {
        btn.hidden = !over;
        var back = Number(btn.getAttribute('data-car')) < 0;
        /* 2px of slack: sub-pixel layout means scrollLeft rarely lands on
           exactly 0 or exactly max */
        btn.disabled = back ? x <= 2 : x >= max - 2;
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        rail.scrollBy({ left: Number(btn.getAttribute('data-car')) * page(), behavior: 'smooth' });
      });
    });

    var ticking = false;
    rail.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        paint();
      });
    });

    if (window.ResizeObserver) {
      new ResizeObserver(paint).observe(rail);
    } else {
      window.addEventListener('resize', paint);
    }

    /* images arriving can change the rail's width, and with it whether there
       is anything to scroll to at all */
    rail.querySelectorAll('img').forEach(function (img) {
      if (img.complete) return;
      img.addEventListener('load', paint, { once: true });
      img.addEventListener('error', paint, { once: true });
    });

    paint();
  }

  function start() {
    document.querySelectorAll('[data-carousel]').forEach(wire);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  /* the theme editor rebuilds a section's markup in place */
  document.addEventListener('shopify:section:load', function (event) {
    var root = event.target.querySelector('[data-carousel]');
    if (root) wire(root);
  });
})();
