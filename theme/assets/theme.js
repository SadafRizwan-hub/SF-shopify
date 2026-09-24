/*
 * Counter-side behaviour that every page shares: the shortlist, the toast,
 * the mobile filter sheet, and the one money formatter the fabric page also
 * borrows.
 *
 * Nothing here fetches the catalogue — Liquid has already rendered it. This
 * file only does what a server render cannot: remember what this browser
 * shortlisted, and move a sheet.
 */
(function () {
  'use strict';

  var SF = (window.SF = window.SF || {});
  var SAVED_KEY = 'sf:shortlist';

  /* ---- money ---------------------------------------------------------- */

  function withCommas(n) {
    return n.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  }

  /* The store's own money_format, so a theme in ₹ prints ₹ and one in £
     prints £ without a second setting to keep in step. */
  SF.formatMoney = function (cents, format) {
    var fmt = format || SF.moneyFormat || '${{amount}}';
    var value = Number(cents) || 0;

    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/g, function (_, name) {
      var major = (value / 100).toFixed(2);
      var whole = Math.round(value / 100).toString();

      switch (name) {
        case 'amount':
          return withCommas(major);
        case 'amount_no_decimals':
          return withCommas(whole);
        case 'amount_with_comma_separator':
          return withCommas(major).replace(/,/g, '\u0000').replace(/\./g, ',').replace(/\u0000/g, '.');
        case 'amount_no_decimals_with_comma_separator':
          return withCommas(whole).replace(/,/g, '.');
        case 'amount_with_space_separator':
          return withCommas(major).replace(/,/g, ' ').replace(/\./g, ',');
        case 'amount_no_decimals_with_space_separator':
          return withCommas(whole).replace(/,/g, ' ');
        case 'amount_with_period_and_space_separator':
          return withCommas(major).replace(/,/g, ' ');
        default:
          return withCommas(major);
      }
    });
  };

  /* Metres are always a multiple of the cut unit — 6.5, never 6.4999. */
  SF.roundMetres = function (metres) {
    var unit = SF.cutUnitMetres || 0.5;
    return Math.round(metres / unit) * unit;
  };

  SF.formatMetres = function (metres) {
    return parseFloat(metres.toFixed(2)).toString();
  };

  /* ---- toast ----------------------------------------------------------- */

  var toastEl = null;
  var toastAt = 0;

  SF.flash = function (message) {
    toastEl = toastEl || document.querySelector('[data-toast]');
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('on');
    var at = (toastAt = Date.now());
    setTimeout(function () {
      if (toastAt === at) toastEl.classList.remove('on');
    }, 4000);
  };

  /* ---- shortlist ------------------------------------------------------- */

  function readSaved() {
    try {
      var raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return [];
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list.filter(function (c) { return typeof c === 'string'; }) : [];
    } catch (e) {
      /* private mode or a full quota — the shortlist just won't outlive the tab */
      return [];
    }
  }

  function writeSaved(list) {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(list));
    } catch (e) {
      /* nothing to do: the page still works, it just won't be remembered */
    }
  }

  SF.shortlist = {
    all: readSaved,
    has: function (handle) { return readSaved().indexOf(handle) !== -1; },
    toggle: function (handle) {
      var list = readSaved();
      var i = list.indexOf(handle);
      if (i === -1) list.unshift(handle);
      else list.splice(i, 1);
      writeSaved(list);
      paintShortlist();
      return i === -1;
    }
  };

  function paintShortlist() {
    var list = readSaved();
    document.querySelectorAll('[data-save]').forEach(function (btn) {
      var on = list.indexOf(btn.getAttribute('data-save')) !== -1;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-shortlist-count]').forEach(function (pip) {
      pip.textContent = list.length;
      pip.hidden = list.length === 0;
    });
  }

  /* ---- wiring ---------------------------------------------------------- */

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    paintShortlist();

    document.addEventListener('click', function (event) {
      var save = event.target.closest('[data-save]');
      if (save) {
        event.preventDefault();
        var added = SF.shortlist.toggle(save.getAttribute('data-save'));
        SF.flash(added ? 'Added to your shortlist' : 'Removed from your shortlist');
        return;
      }

      var open = event.target.closest('[data-sheet-open]');
      if (open) {
        event.preventDefault();
        document.querySelector('[data-sheet]').classList.add('open');
        document.querySelector('[data-scrim]').classList.add('on');
        return;
      }

      if (event.target.closest('[data-sheet-close]') || event.target.closest('[data-scrim]')) {
        document.querySelector('[data-sheet]').classList.remove('open');
        document.querySelector('[data-scrim]').classList.remove('on');
      }
    });

    /* the sort control is a plain select so it works without JS too; this
       only saves the shopper a trip to a submit button */
    var sort = document.querySelector('[data-sort]');
    if (sort) {
      sort.addEventListener('change', function () {
        var url = new URL(window.location.href);
        url.searchParams.set('sort_by', sort.value);
        url.searchParams.delete('page');
        window.location.href = url.toString();
      });
    }
  });
})();
