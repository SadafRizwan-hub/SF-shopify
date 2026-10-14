/*
 * The homepage banner's slideshow.
 *
 * The track is a native horizontal scroller with snap points, so it swipes
 * and scrolls before this file runs; this only drives it — arrows, dots and
 * autoplay — and keeps the dots in step with wherever the track came to rest.
 *
 * Autoplay pauses while the pointer or keyboard focus is on the banner and
 * while the tab is hidden, stops for good once the shopper uses a control or
 * swipes (they have taken over), and never starts for someone whose system
 * asks for reduced motion.
 *
 * Guarded twice: the file against running more than once on a page, and each
 * banner against being wired more than once — an earlier carousel shipped
 * with every arrow firing three times for want of exactly this.
 */
(function () {
  'use strict';
  if (window.__heroSlides) return;
  window.__heroSlides = true;

  function wire(hero) {
    if (hero.hasAttribute('data-hero-wired')) return;
    hero.setAttribute('data-hero-wired', '');

    var track = hero.querySelector('[data-hero-track]');
    if (!track) return;
    var slides = [].slice.call(track.children);
    if (slides.length < 2) return;
    var dots = [].slice.call(hero.querySelectorAll('[data-hero-dot]'));

    var current = 0;
    var timer = null;
    var stopped = false;
    var paused = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var delay = parseInt(hero.getAttribute('data-autoplay'), 10) || 0;

    function go(index, smooth) {
      current = (index + slides.length) % slides.length;
      track.scrollTo({
        left: slides[current].offsetLeft,
        behavior: smooth === false || reduce ? 'auto' : 'smooth'
      });
      mark();
    }

    function mark() {
      dots.forEach(function (dot, i) {
        var on = i === current;
        dot.classList.toggle('on', on);
        dot.setAttribute('aria-current', on ? 'true' : 'false');
      });
      slides.forEach(function (slide, i) {
        if (i === current) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');
        /* links in slides off screen leave the tab order */
        slide.querySelectorAll('a, button').forEach(function (el) {
          if (i === current) el.removeAttribute('tabindex');
          else el.setAttribute('tabindex', '-1');
        });
      });
    }

    function tick() {
      clearTimeout(timer);
      if (!delay || stopped || paused || reduce || document.hidden) return;
      timer = setTimeout(function () {
        go(current + 1);
        tick();
      }, delay);
    }

    function takeOver() {
      stopped = true;
      clearTimeout(timer);
    }

    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    if (prev) prev.addEventListener('click', function () { takeOver(); go(current - 1); });
    if (next) next.addEventListener('click', function () { takeOver(); go(current + 1); });
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        takeOver();
        go(parseInt(dot.getAttribute('data-hero-dot'), 10));
      });
    });

    /* a swipe or trackpad scroll: follow the track to where it settled */
    var settle = null;
    track.addEventListener('scroll', function () {
      clearTimeout(settle);
      settle = setTimeout(function () {
        var nearest = 0;
        var best = Infinity;
        slides.forEach(function (slide, i) {
          var d = Math.abs(slide.offsetLeft - track.scrollLeft);
          if (d < best) { best = d; nearest = i; }
        });
        if (nearest !== current) {
          current = nearest;
          mark();
        }
      }, 120);
    }, { passive: true });
    track.addEventListener('pointerdown', takeOver, { passive: true });
    track.addEventListener('touchstart', takeOver, { passive: true });

    hero.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { takeOver(); go(current - 1); }
      if (event.key === 'ArrowRight') { takeOver(); go(current + 1); }
    });

    hero.addEventListener('mouseenter', function () { paused = true; clearTimeout(timer); });
    hero.addEventListener('mouseleave', function () { paused = false; tick(); });
    hero.addEventListener('focusin', function () { paused = true; clearTimeout(timer); });
    hero.addEventListener('focusout', function () { paused = false; tick(); });
    document.addEventListener('visibilitychange', tick);

    /* the theme editor re-renders the section; keep its selected slide in view */
    hero.addEventListener('shopify:block:select', function (event) {
      var i = slides.indexOf(event.target);
      if (i !== -1) { takeOver(); go(i, false); }
    });

    mark();
    tick();
  }

  function init() {
    document.querySelectorAll('[data-hero]').forEach(wire);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* a section re-rendered in the theme editor arrives as a new element */
  document.addEventListener('shopify:section:load', init);
})();
