// Credit cards: lazy YouTube embed and thumbnail upgrade. Vanilla, no dependencies.
// Nothing from youtube.com is requested until a visitor presses a play control.
(function () {
  'use strict';

  // The server-rendered poster is hqdefault, which exists for every video.
  // Once it has loaded, try the sharper maxresdefault, which some videos lack.
  // It is fetched and decoded off-screen first and only swapped in when ready,
  // so the card never flashes empty. A missing one answers 404 (decode()
  // rejects) or a 120px placeholder: keep hqdefault then, so there is never a
  // broken image.
  function upgrade(img) {
    var hires = img.getAttribute('data-hires');
    if (!hires) return;
    img.removeAttribute('data-hires');
    var probe = new Image();
    probe.src = hires;
    probe.decode().then(function () {
      if (probe.naturalWidth > 320) img.src = hires;
    }).catch(function () { /* no hi-res variant: keep hqdefault */ });
  }

  document.querySelectorAll('img[data-hires]').forEach(function (img) {
    if (img.complete && img.naturalWidth) upgrade(img);
    else img.addEventListener('load', function () { upgrade(img); }, { once: true });
  });

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
