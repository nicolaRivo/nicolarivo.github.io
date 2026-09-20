// Credit cards: lazy YouTube embed. Vanilla, no dependencies.
// Nothing from youtube.com is requested until a visitor presses a play control.
(function () {
  'use strict';

  // JS is available: reveal the real button (the no-JS fallback is a <noscript> link).
  document.querySelectorAll('.card-play[hidden]').forEach(function (btn) {
    btn.hidden = false;
  });

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('button.card-play');
    if (!btn) return;
    var card = btn.closest('.card');
    var media = card.querySelector('.card-media');
    var frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(card.getAttribute('data-youtube-id')) + '?autoplay=1&rel=0';
    frame.title = card.getAttribute('data-title') + ' — video';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.setAttribute('allowfullscreen', '');
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    media.replaceChildren(frame); // the button is removed, so focus must be moved explicitly
    frame.focus();
  });
})();
