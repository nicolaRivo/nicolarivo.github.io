/* nicolarivo.co.uk/sound - prova genjutsu. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var body = doc.body;
  var MODE = body.getAttribute('data-open') || 'inline'; // inline | dialog

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function cssVar(n) { return getComputedStyle(root).getPropertyValue(n).trim() || '#888'; }

  var restPause = function () {};

  /* ---------- Audio engine: synthetic placeholder audio, created only after a click ---------- */
  var engine = null;
  function getEngine() {
    if (engine) return engine;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    var ctx = new AC();
    var master = ctx.createGain(); master.gain.value = 0;
    var analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
    master.connect(analyser); analyser.connect(ctx.destination);
    // brown-ish noise buffer, 4 s, loops
    var len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    function noise() { var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }
    var stems = {};
    function stem(name, node) { var g = ctx.createGain(); g.gain.value = 0; node.connect(g); g.connect(master); stems[name] = { gain: g, level: 0.9, on: false }; return g; }
    // room: low rumble
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; noise().connect(lp); stem('room', lp);
    // air: moving band of noise
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.7;
    var lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.11; lfoG.gain.value = 700; lfo.connect(lfoG); lfoG.connect(bp.frequency); lfo.start();
    var airPre = ctx.createGain(); airPre.gain.value = 0.7; noise().connect(bp); bp.connect(airPre); stem('air', airPre);
    // music: slow pad
    var padLp = ctx.createBiquadFilter(); padLp.type = 'lowpass'; padLp.frequency.value = 900;
    [110, 164.81, 277.18].forEach(function (f, k) {
      var o = ctx.createOscillator(); o.type = k === 2 ? 'sine' : 'triangle'; o.frequency.value = f;
      var l2 = ctx.createOscillator(), l2g = ctx.createGain(); l2.frequency.value = 0.07 + k * 0.05; l2g.gain.value = 3 + k; l2.connect(l2g); l2g.connect(o.detune); l2.start();
      var og = ctx.createGain(); og.gain.value = 0.16; o.connect(og); og.connect(padLp); o.start();
    });
    stem('music', padLp);
    // foley: scheduled soft clicks
    var foleyBus = ctx.createGain(); stem('foley', foleyBus);
    var next = 0;
    var timer = setInterval(function () {
      if (ctx.state !== 'running') return;
      if (next < ctx.currentTime) next = ctx.currentTime + 0.1;
      while (next < ctx.currentTime + 0.4) {
        var s = ctx.createBufferSource(); s.buffer = buf; var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 1800; f.Q.value = 3;
        var e = ctx.createGain(); e.gain.setValueAtTime(0, next); e.gain.linearRampToValueAtTime(1.6, next + 0.004); e.gain.exponentialRampToValueAtTime(0.001, next + 0.09);
        s.connect(f); f.connect(e); e.connect(foleyBus); s.start(next, Math.random() * 3, 0.12);
        next += 0.55 + Math.random() * 0.9;
      }
    }, 120);
    engine = {
      ctx: ctx, master: master, analyser: analyser, stems: stems, timer: timer, playing: false,
      setStem: function (n, on) {
        var s = stems[n]; if (!s) return; s.on = on;
        s.gain.gain.cancelScheduledValues(ctx.currentTime);
        s.gain.gain.setTargetAtTime(on ? s.level : 0, ctx.currentTime, 0.06);
      },
      play: function () {
        var self = this; restPause();
        return ctx.resume().then(function () { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.7, ctx.currentTime, 0.08); self.playing = true; });
      },
      stop: function () {
        var self = this; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
        self.playing = false; setTimeout(function () { if (!self.playing && ctx.state === 'running') ctx.suspend(); }, 400);
      }
    };
    return engine;
  }

  /* ---------- Scope: draws the real signal of the analyser ---------- */
  var scopes = [];
  var raf = 0, lastDraw = 0;
  function sizeCanvas(c) {
    var r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(1, Math.round(r.width * dpr)); c.height = Math.max(1, Math.round(r.height * dpr));
  }
  function drawScope(c, live) {
    var g = c.getContext('2d'), w = c.width, h = c.height;
    g.clearRect(0, 0, w, h);
    g.lineWidth = Math.max(1, w / 700); g.strokeStyle = cssVar('--scope'); g.globalAlpha = 0.25;
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); g.globalAlpha = 1;
    if (!live || !engine) return;
    var a = engine.analyser, n = a.fftSize, data = new Uint8Array(n); a.getByteTimeDomainData(data);
    g.lineWidth = Math.max(1.5, w / 500); g.strokeStyle = cssVar('--scope'); g.beginPath();
    var step = Math.floor(n / Math.min(n, 900));
    for (var i = 0, x = 0; i < n; i += step, x++) {
      var y = (data[i] / 255) * h; var px = (i / n) * w; if (i === 0) g.moveTo(px, y); else g.lineTo(px, y);
    }
    g.stroke();
  }
  function loop(t) {
    raf = requestAnimationFrame(loop);
    if (reduce.matches && t - lastDraw < 120) return; // reduced motion: ~8 updates a second
    lastDraw = t;
    var live = engine && engine.playing;
    scopes = scopes.filter(function (c) { return doc.body.contains(c); });
    scopes.forEach(function (c) { if (c.getBoundingClientRect().width) { if (c._w !== c.clientWidth) { sizeCanvas(c); c._w = c.clientWidth; } drawScope(c, live); } });
    if (!live && !scopes.length) { cancelAnimationFrame(raf); raf = 0; }
  }
  function registerScope(c) { if (scopes.indexOf(c) < 0) { scopes.push(c); sizeCanvas(c); c._w = c.clientWidth; drawScope(c, false); } if (!raf) raf = requestAnimationFrame(loop); }
  function stopAudioUI() {
    if (engine) engine.stop();
    $$('[data-play]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); setLabel(b, false); });
  }
  function setLabel(b, on) { var l = $('.lbl', b) || b; l.textContent = on ? (b.getAttribute('data-label-on') || 'Pause') : (b.getAttribute('data-label-off') || 'Play'); }

  /* ---------- Demo component (A/B + stems) ---------- */
  var PRESETS = { a: [], b: ['room', 'air', 'foley'], c: ['room', 'air', 'foley', 'music'] };
  function initDemo(rootEl) {
    var demo = $('[data-demo]', rootEl); if (!demo || demo._init) return; demo._init = true;
    var cv = $('canvas', demo); if (cv) registerScope(cv);
    var status = $('[data-status]', demo), play = $('[data-play]', demo);
    var tabs = $$('[data-ab]', demo), stemBtns = $$('[data-stem]', demo);
    function sync() {
      var e = engine; stemBtns.forEach(function (b) { var on = e && e.stems[b.getAttribute('data-stem')] ? e.stems[b.getAttribute('data-stem')].on : b._on; b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    }
    function apply(list) {
      var e = getEngine(); if (!e) { if (status) status.textContent = 'Web Audio is not available in this browser.'; return; }
      Object.keys(e.stems).forEach(function (n) { e.setStem(n, list.indexOf(n) > -1); }); sync();
    }
    function setTab(k) {
      tabs.forEach(function (t) { var on = t.getAttribute('data-ab') === k; t.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      apply(PRESETS[k]);
      if (status) status.textContent = { a: 'A: picture only, silent.', b: 'B: production sound (room, air, foley).', c: 'C: with sound design and music.' }[k];
    }
    play.addEventListener('click', function () {
      var e = getEngine(); if (!e) { if (status) status.textContent = 'Web Audio is not available in this browser.'; return; }
      if (e.playing) { stopAudioUI(); if (status) status.textContent = 'Paused.'; return; }
      var active = tabs.filter(function (t) { return t.getAttribute('aria-pressed') === 'true'; })[0];
      setTab(active ? active.getAttribute('data-ab') : 'c');
      e.play().then(function () { $$('[data-play]').forEach(function (b) { b.setAttribute('aria-pressed', 'true'); setLabel(b, true); }); });
    });
    tabs.forEach(function (t) { t.addEventListener('click', function () { setTab(t.getAttribute('data-ab')); }); });
    stemBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var e = getEngine(); if (!e) return; var n = b.getAttribute('data-stem');
        e.setStem(n, !e.stems[n].on); tabs.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); }); sync();
        if (status) status.textContent = 'Custom mix: ' + Object.keys(e.stems).filter(function (k) { return e.stems[k].on; }).join(', ') + '.';
      });
    });
  }

  /* ---------- Hero scope (option-specific, optional) ---------- */
  $$('[data-hero-scope]').forEach(function (wrap) {
    var cv = $('canvas', wrap), btn = $('[data-play]', wrap); if (cv) registerScope(cv);
    btn.addEventListener('click', function () {
      var e = getEngine(); if (!e) return;
      if (e.playing) { stopAudioUI(); return; }
      ['room', 'air'].forEach(function (n) { e.setStem(n, true); }); ['foley', 'music'].forEach(function (n) { e.setStem(n, false); });
      e.play().then(function () { $$('[data-play]').forEach(function (b) { b.setAttribute('aria-pressed', 'true'); setLabel(b, true); }); });
    });
  });

  /* ---------- YouTube facade: nothing is requested before the click ---------- */
  function mountVideo(btn) {
    var id = btn.getAttribute('data-yt'); if (!/^[\w-]{6,20}$/.test(id)) return;
    var f = doc.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
    f.title = btn.getAttribute('data-title') || 'Video'; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin';
    btn.parentNode.replaceChild(f, btn); f.focus();
  }
  doc.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('[data-yt]'); if (b) mountVideo(b); });

  /* ---------- Open a work ---------- */
  var dlg = $('#work-dialog'), dlgBody = dlg && $('.dlg-body', dlg), lastTrigger = null;
  function closeDialog() {
    if (!dlg || !dlg.open) return;
    if (reduce.matches) { dlg.close(); return; }
    dlg.classList.add('is-closing'); setTimeout(function () { dlg.classList.remove('is-closing'); dlg.close(); }, 180);
  }
  if (dlg) {
    dlg.addEventListener('close', function () { stopAudioUI(); dlgBody.innerHTML = ''; if (lastTrigger) lastTrigger.focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(); });
    $('[data-close]', dlg).addEventListener('click', closeDialog);
  }
  function openWork(btn) {
    var ref = btn.getAttribute('data-ref'); // card in an aspect section that points to a "Selected" work
    var work = ref ? $('#' + ref) : btn.closest('[data-work]'), panel = $('.panel', work);
    if (MODE === 'dialog' && dlg) {
      lastTrigger = btn; dlgBody.innerHTML = '';
      var h = doc.createElement('h2'); h.className = 'dlg-ti'; h.textContent = $('.w-title', work).textContent; dlgBody.appendChild(h);
      var m = doc.createElement('p'); m.className = 'dlg-meta'; m.textContent = $('.w-meta', work).textContent; dlgBody.appendChild(m);
      var tmp = doc.createElement('div'); tmp.innerHTML = panel.innerHTML; while (tmp.firstChild) dlgBody.appendChild(tmp.firstChild);
      dlg.setAttribute('aria-label', h.textContent); initDemo(dlgBody);
      dlg.showModal(); history.replaceState(null, '', '#' + work.id);
      return;
    }
    var open = btn.getAttribute('aria-expanded') === 'true';
    if (!open) {
      $$('[data-work] .work-toggle[aria-expanded="true"]').forEach(function (o) { if (o !== btn) collapse(o); });
      btn.setAttribute('aria-expanded', 'true'); panel.hidden = false; work.classList.add('is-open'); initDemo(panel);
    } else collapse(btn);
  }
  function collapse(btn) {
    var work = btn.closest('[data-work]'), panel = $('.panel', work);
    btn.setAttribute('aria-expanded', 'false'); work.classList.remove('is-open');
    if ($('[data-demo] [data-play][aria-pressed="true"]', panel)) stopAudioUI();
    panel.hidden = true;
    $$('iframe', panel).forEach(function (fr) { var id = (fr.src.match(/embed\/([\w-]+)/) || [])[1]; var nb = doc.createElement('button'); nb.className = 'yt'; nb.type = 'button'; nb.setAttribute('data-yt', id); nb.setAttribute('data-title', fr.title); nb.innerHTML = panel.getAttribute('data-facade') || ''; fr.parentNode.replaceChild(nb, fr); });
  }
  $$('.work-toggle').forEach(function (b) { b.addEventListener('click', function () { openWork(b); }); });
  $$('[data-work] .panel').forEach(function (p) { var y = $('[data-yt]', p); if (y) p.setAttribute('data-facade', y.innerHTML); });
  if (location.hash && $(location.hash) && $(location.hash).hasAttribute('data-work')) { var t = $('.work-toggle', $(location.hash)); if (t) setTimeout(function () { openWork(t); }, 50); }

  /* ---------- Service links prefill the contact form ---------- */
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () { var s = $('#f-topic'); if (s) s.value = a.getAttribute('data-service'); });
  });

  /* ---------- Contact form: Web3Forms, honeypot, email fallback ---------- */
  var form = $('#contact-form');
  if (form) {
    var out = $('#form-status', form), btn = $('button[type=submit]', form);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form.botcheck && form.botcheck.checked) return; // honeypot
      if (!form.checkValidity()) { form.reportValidity(); return; }
      btn.disabled = true; out.className = 'status'; out.textContent = 'Sending...';
      var fd = new FormData(form);
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.success) throw new Error(j.message || 'fail'); }); })
        .then(function () { out.className = 'status ok'; out.textContent = 'Thank you. I will reply as soon as I can.'; form.reset(); })
        .catch(function () {
          out.className = 'status err'; out.textContent = '';
          out.appendChild(doc.createTextNode('That did not go through. Please write to me directly at '));
          var a = doc.createElement('a'); a.href = 'mailto:info@nicolarivo.co.uk'; a.textContent = 'info@nicolarivo.co.uk'; out.appendChild(a); out.appendChild(doc.createTextNode('.'));
        })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- Reveal on scroll (skipped with reduced motion) ---------- */
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else { $$('[data-reveal]').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- Option 2: threshold gate (skippable) ---------- */
  var gate = $('#gate');
  if (gate) {
    var seen = false; try { seen = sessionStorage.getItem('gate') === '1'; } catch (e) {}
    function leave(withSound) {
      try { sessionStorage.setItem('gate', '1'); } catch (e) {}
      gate.classList.add('is-leaving'); body.classList.remove('gated');
      setTimeout(function () { gate.hidden = true; }, reduce.matches ? 0 : 500);
      var hb = $('[data-hero-scope] [data-play]'); if (withSound) { var e = getEngine(); if (e) { e.setStem('room', true); e.setStem('air', true); e.play().then(function () { $$('[data-play]').forEach(function (b) { b.setAttribute('aria-pressed', 'true'); setLabel(b, true); }); }); } }
      var h = $('#top h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    if (seen) { gate.hidden = true; } else { gate.hidden = false; body.classList.add('gated'); var first = $('[data-enter]', gate); if (first) first.focus(); }
    $$('[data-enter]', gate).forEach(function (b) { b.addEventListener('click', function () { leave(b.getAttribute('data-enter') === 'sound'); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !gate.hidden) leave(false); });
  }
  $$('canvas[data-static-scope]').forEach(registerScope);

  /* ---------- Restoration: before / after on a generated voice, with spectrograms ----------
     The audio is synthetic and built in the browser (no files): a voice-like signal, and the same
     signal with hiss, mains hum and clicks added. Both versions run in sync; the switch only
     changes which one is audible, so the position never jumps. Nothing sounds before a click. */
  var pausers = [];
  $$('[data-restore]').forEach(function (rest) {
    var vid = $('[data-r-video]', rest);
    var SR = 22050, DUR = 6, N = 512, HOP = 256;
    var playBtn = $('[data-r-play]', rest), sideBtns = $$('[data-r-side]', rest), status = $('[data-r-status]', rest);
    var figs = { before: $('[data-r-fig=before]', rest), after: $('[data-r-fig=after]', rest) };
    var side = 'before', data = null, pending = null, ctx = null, master = null, gains = null, t0 = 0, playing = false, busy = false, raf2 = 0, lastTick = 0;
    var MSG = { before: 'Before: the excerpt as received.', after: 'After: the same excerpt after editing.' };
    var MSG_SYN = { before: 'Before: the voice sits under hiss, 50 Hz hum and clicks.', after: 'After: the same voice with the noise taken out.' };

    /* real files: decoded offline (no user gesture needed), folded to mono, trimmed to the shorter one */
    function decode(url) {
      return fetch(url).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.arrayBuffer(); }).then(function (ab) {
        var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, oc = new OAC(1, 1, 44100);
        return new Promise(function (res, rej) { var p = oc.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
      });
    }
    function mono(buf) {
      var n = buf.length, out = new Float32Array(n), ch = buf.numberOfChannels, c, i;
      for (c = 0; c < ch; c++) { var d = buf.getChannelData(c); for (i = 0; i < n; i++) out[i] += d[i] / ch; }
      return out;
    }
    function loadFiles(ub, ua) {
      return Promise.all([decode(ub), decode(ua)]).then(function (r) {
        if (r[0].sampleRate !== r[1].sampleRate) throw new Error('rate');
        var x = mono(r[0]), y = mono(r[1]), n = Math.min(x.length, y.length);
        SR = r[0].sampleRate; DUR = n / SR; N = 1024; HOP = 512;
        return { before: x.subarray(0, n), after: y.subarray(0, n), real: true };
      });
    }

    function build() {
      var len = SR * DUR, voice = new Float32Array(len), before = new Float32Array(len), i, j, h;
      var syl = [[0.25, 0.75, 0], [0.95, 1.4, 1], [1.6, 1.95, 2], [2.3, 3.0, 3], [3.2, 3.6, 1], [3.9, 4.7, 0], [4.95, 5.55, 2]];
      var F = [[700, 1200, 2500], [320, 2200, 3000], [520, 1800, 2600], [800, 1100, 2400]], BW = [120, 160, 220], G = [1, 0.6, 0.35];
      var BLK = 128, nb = Math.ceil(len / BLK) + 2, H = 44;
      var amps = new Float32Array(nb * H), f0b = new Float32Array(nb);
      for (var b = 0; b < nb; b++) {
        var t = b * BLK / SR, e = 0, k = 0;
        for (var s = 0; s < syl.length; s++) if (t >= syl[s][0] && t <= syl[s][1]) { e = Math.pow(Math.sin(Math.PI * (t - syl[s][0]) / (syl[s][1] - syl[s][0])), 0.6); k = syl[s][2]; }
        var f0 = 118 + 22 * Math.sin(t * 2.1) - 6 * t; f0b[b] = f0;
        for (h = 1; h <= H; h++) {
          var fr = h * f0, v = 0;
          for (var q = 0; q < 3; q++) { var d = (fr - F[k][q]) / BW[q]; v += G[q] * Math.exp(-d * d); }
          amps[b * H + h - 1] = e * (v + 0.04) / Math.pow(h, 0.35);
        }
      }
      var ph = 0, peak = 0;
      for (i = 0; i < len; i++) {
        var bi = (i / BLK) | 0, fx = (i % BLK) / BLK, f = f0b[bi] + (f0b[bi + 1] - f0b[bi]) * fx, o0 = bi * H, o1 = o0 + H, sum = 0;
        ph += 6.283185307 * f / SR;
        for (h = 0; h < H; h++) { var a = amps[o0 + h] + (amps[o1 + h] - amps[o0 + h]) * fx; if (a > 0.0005) sum += a * Math.sin((h + 1) * ph); }
        voice[i] = sum; if (Math.abs(sum) > peak) peak = Math.abs(sum);
      }
      for (i = 0; i < len; i++) voice[i] = voice[i] / peak * 0.5;
      var seed = 1234567; function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; }
      var dmg = new Float32Array(len), tau = 6.283185307 / SR;
      for (i = 0; i < len; i++) dmg[i] = rnd() * 0.045 + 0.018 * Math.sin(tau * 50 * i) + 0.011 * Math.sin(tau * 100 * i) + 0.007 * Math.sin(tau * 150 * i) + 0.004 * Math.sin(tau * 250 * i);
      [0.62, 1.71, 2.93, 4.22, 5.13].forEach(function (ct) { var at = (ct * SR) | 0; for (j = 0; j < 70 && at + j < len; j++) dmg[at + j] += rnd() * 0.45 * Math.exp(-j / 18); });
      for (i = 0; i < len; i++) before[i] = Math.max(-1, Math.min(1, voice[i] + dmg[i]));
      return { before: before, after: voice };
    }

    function fft(re, im) {
      var n = re.length, i, j, bit, len, k, t;
      for (i = 1, j = 0; i < n; i++) { bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
      for (len = 2; len <= n; len <<= 1) {
        var ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
        for (i = 0; i < n; i += len) {
          var cr = 1, ci = 0;
          for (k = 0; k < half; k++) {
            var ur = re[i + k], ui = im[i + k], xr = re[i + k + half], xi = im[i + k + half], vr = xr * cr - xi * ci, vi = xr * ci + xi * cr;
            re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + half] = ur - vr; im[i + k + half] = ui - vi;
            var nc = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nc;
          }
        }
      }
    }
    var STOPS = [[8, 9, 11], [34, 52, 92], [110, 160, 225], [226, 242, 255]];
    function color(t) { // 0..1 -> rgb
      t = Math.max(0, Math.min(1, t)) * (STOPS.length - 1); var i = Math.min(STOPS.length - 2, t | 0), f = t - i, a = STOPS[i], c = STOPS[i + 1];
      return [a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f, a[2] + (c[2] - a[2]) * f];
    }
    function drawSpec(samples, cv) {
      var cols = Math.floor((samples.length - N) / HOP) + 1, H = 180; cv.width = cols; cv.height = H;
      var g = cv.getContext('2d'), img = g.createImageData(cols, H), re = new Float64Array(N), im = new Float64Array(N), win = new Float64Array(N), x, y, rows = new Int16Array(H);
      for (x = 0; x < N; x++) win[x] = 0.5 - 0.5 * Math.cos(2 * Math.PI * x / (N - 1));
      for (y = 0; y < H; y++) rows[y] = Math.min(N / 2 - 1, Math.round(60 * Math.pow(10000 / 60, 1 - y / (H - 1)) / (SR / 2) * (N / 2)));
      for (var c = 0; c < cols; c++) {
        for (x = 0; x < N; x++) { re[x] = samples[c * HOP + x] * win[x]; im[x] = 0; }
        fft(re, im);
        for (y = 0; y < H; y++) {
          var k = rows[y], mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / (N / 4), db = 20 * Math.log10(mag + 1e-9), rgb = color((db + 74) / 56), p = (y * cols + c) * 4;
          img.data[p] = rgb[0]; img.data[p + 1] = rgb[1]; img.data[p + 2] = rgb[2]; img.data[p + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    }
    function ensureData() {
      if (pending) return pending;
      var ub = rest.getAttribute('data-before'), ua = rest.getAttribute('data-after');
      var p = (ub && ua) ? loadFiles(ub, ua).catch(function () { return null; }) : Promise.resolve(null);
      pending = p.then(function (d) {
        if (!d) { // files missing or unreadable: fall back to the generated demonstration, and say so
          SR = 22050; DUR = 6; N = 512; HOP = 256; d = build(); MSG = MSG_SYN;
          $('.demo-tag', rest).innerHTML = '<strong>Demonstration.</strong> A generated voice with hiss, mains hum and clicks added. It shows how the comparison works.';
          $('figcaption span', figs.before).textContent = 'hiss · hum · clicks'; $('figcaption span', figs.after).textContent = 'voice only';
        }
        data = d; drawSpec(d.before, $('canvas', figs.before)); drawSpec(d.after, $('canvas', figs.after)); return d;
      });
      return pending;
    }
    if ('IntersectionObserver' in window) {
      var ioR = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { ioR.disconnect(); ensureData(); } }, { rootMargin: '300px 0px' });
      ioR.observe(rest);
    } else setTimeout(ensureData, 400);

    function paintSide() {
      sideBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-r-side') === side ? 'true' : 'false'); });
      figs.before.classList.toggle('is-active', side === 'before'); figs.after.classList.toggle('is-active', side === 'after');
    }
    function setSide(s) {
      side = s; paintSide();
      if (gains) ['before', 'after'].forEach(function (k) { gains[k].gain.setTargetAtTime(k === side ? 1 : 0, ctx.currentTime, 0.015); });
      status.textContent = MSG[side];
    }
    function ensureCtx() { // created inside the click, so the browser allows sound
      if (ctx) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { status.textContent = 'Web Audio is not available in this browser.'; return false; }
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
      return true;
    }
    function ensureSources() { // needs the data; both versions start together and stay in sync
      if (gains) return;
      gains = {};
      var srcs = ['before', 'after'].map(function (k) {
        var buf = ctx.createBuffer(1, data[k].length, SR); buf.getChannelData(0).set(data[k]);
        var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
        var g = ctx.createGain(); g.gain.value = k === side ? 1 : 0; s.connect(g); g.connect(master); gains[k] = g; return s;
      });
      t0 = ctx.currentTime + 0.05; srcs.forEach(function (s) { s.start(t0); });
    }
    function position() { var el = ctx.currentTime - t0; if (el < 0) el = 0; return (el % DUR) / DUR; }
    /* the picture is muted and follows the audio clock: it is re-aligned only if it drifts by more than 0.15 s */
    function vidStart() {
      if (!vid) return; try { vid.currentTime = position() * DUR; } catch (e) {}
      var p = vid.play(); if (p && p.catch) p.catch(function () {});
    }
    function vidSync(pos) {
      if (!vid || !vid.duration) return; var want = pos * DUR, d = Math.abs(vid.currentTime - want);
      if (d > 0.15 && d < vid.duration - 0.15) { try { vid.currentTime = want; } catch (e) {} }
    }
    function tick(t) {
      if (!playing) return;
      raf2 = requestAnimationFrame(tick);
      if (reduce.matches && t - lastTick < 120) return; lastTick = t;
      var pos = position();
      ['before', 'after'].forEach(function (k) { $('.ph', figs[k]).style.left = (pos * 100) + '%'; });
      vidSync(pos);
    }
    function paintPlay() { playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false'); $('.lbl', playBtn).textContent = playing ? 'Pause' : 'Play'; }
    function pause() {
      if (!playing) return; playing = false; if (ctx) ctx.suspend(); cancelAnimationFrame(raf2); if (vid) vid.pause(); paintPlay();
    }
    pausers.push(pause);
    playBtn.addEventListener('click', function () {
      if (busy) return;
      if (playing) { pause(); status.textContent = 'Paused.'; return; }
      if (!ensureCtx()) return;
      stopAudioUI(); restPause();
      var resumed = ctx.resume(); busy = true; if (!data) status.textContent = 'Loading the audio...';
      ensureData().then(function () { ensureSources(); return resumed; }).then(function () {
        busy = false; playing = true; paintPlay(); status.textContent = MSG[side]; vidStart(); raf2 = requestAnimationFrame(tick);
      }, function () { busy = false; status.textContent = 'The audio could not be started.'; });
    });
    sideBtns.forEach(function (b) { b.addEventListener('click', function () { setSide(b.getAttribute('data-r-side')); }); });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) pause(); });
    paintSide();
  });
  restPause = function () { pausers.forEach(function (p) { p(); }); };
})();
