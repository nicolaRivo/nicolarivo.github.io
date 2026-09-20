// Before/after A/B player. Vanilla, no dependencies.
//
// Both <audio> elements play in lockstep and the inactive one is muted, so
// switching sides only flips which one is audible: no seek, no restart, no gap.
// The muted element is kept aligned with the audible one (closed loop, see `bias`);
// when paused, the two are aligned exactly at the moment of switching.
(function () {
  'use strict';

  var TOLERANCE = 0.02; // seconds the muted track may differ before it is nudged
  var SYNC_EVERY = 250; // ms; at most one nudge per interval, so a source that cannot seek never causes a storm
  var NAME = { before: 'Before', after: 'After' };
  var OTHER = { before: 'after', after: 'before' };
  var players = [];

  function fmt(t) {
    if (!isFinite(t)) t = 0;
    var s = Math.floor(t % 60);
    return Math.floor(t / 60) + ':' + (s < 10 ? '0' : '') + s;
  }

  function init(root) {
    var audio = {
      before: root.querySelector('audio[data-side="before"]'),
      after: root.querySelector('audio[data-side="after"]')
    };
    var ui = root.querySelector('.ab-ui');
    var playBtn = root.querySelector('.ab-play');
    var toggleBtn = root.querySelector('.ab-toggle');
    var timeEl = root.querySelector('.ab-time');
    var fill = root.querySelector('.ab-bar-fill');
    var status = root.querySelector('.ab-status');
    var label = root.getAttribute('data-label');
    var side = 'before';
    var playing = false;
    var raf = 0;
    var shownTime = '';
    var lastSync = 0;
    // Learned per element: the two <audio> elements start a few tens of ms apart and a
    // seek lands late. Each nudge adds the error it left behind, so both cancel out.
    var bias = { before: 0, after: 0 };

    function audible() { return audio[side]; }
    function silent() { return audio[OTHER[side]]; }
    function announce(msg) { status.textContent = msg; }

    function render() {
      root.setAttribute('data-side', side);
      playBtn.setAttribute('data-state', playing ? 'playing' : 'paused');
      playBtn.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + label + ', ' + NAME[side] + ' version');
      toggleBtn.setAttribute('aria-label', label + ': ' + NAME[side] + ' selected. Switch to ' + NAME[OTHER[side]]);
    }

    function paint() {
      var a = audible();
      var text = fmt(a.currentTime) + ' / ' + fmt(a.duration);
      if (text !== shownTime) { timeEl.textContent = text; shownTime = text; }
      fill.style.width = (a.duration ? Math.min(100, (a.currentTime / a.duration) * 100) : 0) + '%';
    }

    function tick(now) {
      var a = audible();
      var b = silent();
      var error = a.currentTime - b.currentTime; // > 0: the muted track lags
      if (Math.abs(error) > TOLERANCE && now - lastSync > SYNC_EVERY) {
        lastSync = now;
        bias[OTHER[side]] += error;
        b.currentTime = a.currentTime + bias[OTHER[side]];
      }
      if (b.paused && !b.ended && !a.paused) b.play().catch(function () {});
      paint();
      raf = playing ? requestAnimationFrame(tick) : 0;
    }

    function stop(userInitiated) {
      playing = false;
      audio.before.pause();
      audio.after.pause();
      silent().currentTime = audible().currentTime;
      render();
      paint();
      if (userInitiated) announce('Paused');
    }

    function play() {
      players.forEach(function (p) { if (p !== self) p.pause(); });
      var a = audible();
      var b = silent();
      b.currentTime = a.currentTime;
      playing = true;
      render();
      Promise.all([a.play(), b.play()]).catch(function () {
        stop(false);
        announce('Playback could not start');
      });
      announce('Playing, ' + NAME[side]);
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function toggle() {
      var from = audible();
      var to = silent();
      if (!playing) to.currentTime = from.currentTime; // paused: align exactly
      side = OTHER[side];
      to.muted = false;
      from.muted = true;
      // Some platforms pause a muted element; if so, resume it in place.
      if (playing && to.paused && !to.ended) {
        to.currentTime = from.currentTime;
        to.play().catch(function () {});
      }
      render();
      paint();
      announce(NAME[side] + ' selected');
    }

    function finished(event) {
      if (event.target !== audible()) return;
      stop(false);
      audio.before.currentTime = 0;
      audio.after.currentTime = 0;
      paint();
      announce('Finished');
    }

    // Take over from the native controls.
    audio.before.removeAttribute('controls');
    audio.after.removeAttribute('controls');
    audio.after.muted = true;
    root.classList.add('is-enhanced');
    ui.hidden = false;

    playBtn.addEventListener('click', function () { if (playing) stop(true); else play(); });
    toggleBtn.addEventListener('click', toggle);
    ['before', 'after'].forEach(function (name) {
      audio[name].addEventListener('ended', finished);
      audio[name].addEventListener('loadedmetadata', paint);
      audio[name].addEventListener('error', function () { announce('Audio could not be loaded'); });
    });

    var self = { pause: function () { if (playing) stop(false); } };
    players.push(self);
    render();
    paint();
  }

  document.querySelectorAll('[data-ab]').forEach(init);
})();
