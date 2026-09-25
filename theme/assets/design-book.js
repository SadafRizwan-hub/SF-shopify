/*
 * Family chips for the design book.
 *
 * Every design collection is already on the page, so filtering by family is a
 * matter of hiding cards rather than a round trip. ?family=<slug> applies one
 * on load and each chip writes it back, so a family is a link that can be sent
 * to someone — which a purely in-page filter would not be.
 */
(function () {
  'use strict';

  var grid = document.querySelector('[data-design-grid]');
  if (!grid) return;

  var chips = document.querySelectorAll('[data-family]');
  var empty = document.querySelector('[data-design-empty]');
  var current = '';

  function familiesOf(card) {
    return (card.getAttribute('data-families') || '').split(/\s+/).filter(Boolean);
  }

  function apply(family, push) {
    current = family || '';
    var shown = 0;

    grid.querySelectorAll('[data-design-card]').forEach(function (card) {
      var ok = !current || familiesOf(card).indexOf(current) !== -1;
      card.hidden = !ok;
      if (ok) shown += 1;
    });

    chips.forEach(function (chip) {
      var on = (chip.getAttribute('data-family') || '') === current;
      chip.classList.toggle('on', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    grid.hidden = shown === 0;
    if (empty) empty.hidden = shown !== 0;

    if (push && window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      if (current) url.searchParams.set('family', current);
      else url.searchParams.delete('family');
      window.history.replaceState({}, '', url.toString());
    }
  }

  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-family-reset]')) {
      event.preventDefault();
      apply('', true);
      return;
    }
    var chip = event.target.closest('[data-family]');
    if (!chip) return;
    event.preventDefault();
    apply(chip.getAttribute('data-family') || '', true);
  });

  /* A family in the url that nothing is filed under would show an empty book
     with no way back, so it is ignored rather than honoured. */
  var wanted = new URL(window.location.href).searchParams.get('family') || '';
  if (wanted) {
    var known = false;
    chips.forEach(function (chip) {
      if ((chip.getAttribute('data-family') || '') === wanted) known = true;
    });
    if (!known) wanted = '';
  }
  apply(wanted, false);
})();
