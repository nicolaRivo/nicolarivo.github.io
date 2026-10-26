/* Tastiera dell'hero: campioni di pianoforte a coda (Salamander Grand Piano, CC BY 3.0),
   intonati cambiando la velocità di lettura dal campione più vicino.
   Audio solo dopo il primo tocco; se i campioni non si caricano, un sintetizzatore di riserva. */
(function () {
  // Tasti: [nome, numero MIDI, tasto del computer]
  var WHITE = [["C", 60, "A"], ["D", 62, "S"], ["E", 64, "D"], ["F", 65, "F"], ["G", 67, "G"], ["A", 69, "H"], ["B", 71, "J"], ["C", 72, "K"]];
  var BLACK = [[0, 61, "W", "C sharp"], [1, 63, "E", "D sharp"], [3, 66, "T", "F sharp"], [4, 68, "Y", "G sharp"], [5, 70, "U", "A sharp"]];
  // Campioni disponibili: [file, MIDI]
  var SAMPLES = [["A3", 57], ["C4", 60], ["Ds4", 63], ["Fs4", 66], ["A4", 69], ["C5", 72]];
  var BASE = "assets/piano/";
  var NOTE_LEN = 1.3; // durata fissa di ogni nota, in secondi: niente sustain, nemmeno tenendo premuto

  var host = document.getElementById("keys");
  if (!host) return;
  var words = [].slice.call(document.querySelectorAll("h1 .w"));
  var litIndex = -1, ctx = null, master = null, reverbIn = null;
  var raw = {}, buffers = {}, loadState = "idle", pending = [], voices = {};
  var byKey = {};

  function ensureContext() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = 0.003; comp.release.value = 0.25;
      master = ctx.createGain(); master.gain.value = 0.9;
      master.connect(comp); comp.connect(ctx.destination);
      // Stanza piccola: rumore con decadimento esponenziale, mescolato in poco.
      var len = Math.floor(ctx.sampleRate * 0.9), ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var ch = 0; ch < 2; ch++) {
        var d = ir.getChannelData(ch);
        for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      var conv = ctx.createConvolver(); conv.buffer = ir;
      var wet = ctx.createGain(); wet.gain.value = 0.12;
      reverbIn = ctx.createGain();
      reverbIn.connect(conv); conv.connect(wet); wet.connect(master);
      ctx.onstatechange = flushPending;
    }
    if (ctx.state === "suspended") { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); }
    return ctx;
  }

  // Scarica i file (byte grezzi) in anticipo, senza AudioContext; decodifica dopo il primo tocco.
  function prefetch(force) {
    if (loadState !== "idle") return;
    if (!force && navigator.connection && navigator.connection.saveData) return;
    loadState = "fetching";
    SAMPLES.forEach(function (s) {
      fetch(BASE + s[0] + ".mp3").then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (ab) { raw[s[0]] = ab; if (ctx) decodeAll(); })
        .catch(function () { loadState = "failed"; });
    });
  }

  function decodeAll() {
    SAMPLES.forEach(function (s) {
      var name = s[0];
      if (!raw[name] || buffers[name] || buffers[name] === false) return;
      buffers[name] = false; // in corso
      var ab = raw[name].slice(0);
      var ok = function (buf) { buffers[name] = buf; flushPending(); };
      var bad = function () { buffers[name] = null; };
      var p = ctx.decodeAudioData(ab, ok, bad);
      if (p && p.catch) p.catch(function () {});
    });
  }

  function nearest(midi) {
    var best = null, dist = 99;
    SAMPLES.forEach(function (s) {
      var d = Math.abs(s[1] - midi);
      if (d < dist && buffers[s[0]]) { dist = d; best = s; }
    });
    return best;
  }

  // Pronti quando ogni campione è decodificato (o ha fallito): così la nota usa sempre il più vicino.
  function haveSamples() { return SAMPLES.every(function (s) { return buffers[s[0]] !== undefined && buffers[s[0]] !== false; }) && SAMPLES.some(function (s) { return buffers[s[0]]; }); }

  function startNote(midi, id) {
    var c = ensureContext(); if (!c) return;
    if (c.state !== "running" || (!haveSamples() && loadState !== "failed")) {
      // Contesto non ancora sbloccato o campioni in decodifica: la nota parte appena possibile.
      pending.push({ midi: midi, id: id, t: Date.now() });
      decodeAll();
      return;
    }
    play(midi, id);
  }

  function flushPending() {
    if (!ctx || ctx.state !== "running") return;
    if (!haveSamples() && loadState !== "failed") return;
    var now = Date.now(), list = pending; pending = [];
    list.forEach(function (n) { if (now - n.t < 3000) play(n.midi, n.id); });
  }

  function play(midi, id) {
    var t = ctx.currentTime, s = nearest(midi);
    if (voices[id]) cut(id, 0.04); // ripremere lo stesso tasto riparte da capo
    var g = ctx.createGain();
    var vel = 0.82 + Math.random() * 0.16; // un po' di umanità
    // Attacco subito, poi spegnimento a durata fissa: il dito non conta.
    g.gain.setValueAtTime(vel, t);
    g.gain.setValueAtTime(vel, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0002, t + NOTE_LEN);
    g.connect(master);
    var send = ctx.createGain(); send.gain.value = 1; g.connect(send); send.connect(reverbIn);
    var stop;
    if (s) {
      var src = ctx.createBufferSource();
      src.buffer = buffers[s[0]];
      src.playbackRate.value = Math.pow(2, (midi - s[1]) / 12);
      src.connect(g); src.start(t); src.stop(t + NOTE_LEN + 0.05);
      stop = function () { try { src.stop(); } catch (e) {} };
    } else {
      stop = fallbackSynth(midi, t, g);
    }
    voices[id] = { gain: g, stop: stop };
    setTimeout(function () { if (voices[id] && voices[id].gain === g) delete voices[id]; }, (NOTE_LEN + 0.2) * 1000);
  }

  // Taglio rapido, solo quando lo stesso tasto viene ripremuto.
  function cut(id, fade) {
    var v = voices[id]; if (!v) return;
    delete voices[id];
    var t = ctx.currentTime;
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setValueAtTime(Math.max(v.gain.gain.value, 0.0002), t);
    v.gain.gain.exponentialRampToValueAtTime(0.0002, t + fade);
    setTimeout(v.stop, fade * 1000 + 40);
  }

  // Riserva se i campioni non si caricano: toni con decadimento da pianoforte.
  function fallbackSynth(midi, t, out) {
    var f = 440 * Math.pow(2, (midi - 69) / 12), oscs = [];
    [[1, 1], [2, 0.4], [3, 0.2], [4, 0.1]].forEach(function (p) {
      var o = ctx.createOscillator(), og = ctx.createGain();
      o.type = "sine"; o.frequency.value = f * p[0];
      og.gain.setValueAtTime(p[1] * 0.5, t); og.gain.exponentialRampToValueAtTime(0.0005, t + NOTE_LEN / p[0]);
      o.connect(og); og.connect(out); o.start(t); o.stop(t + NOTE_LEN + 0.05); oscs.push(o);
    });
    return function () { oscs.forEach(function (o) { try { o.stop(); } catch (e) {} }); };
  }

  function lightWord() {
    if (!words.length) return;
    if (litIndex >= 0) words[litIndex].classList.remove("lit");
    litIndex = (litIndex + 1) % words.length;
    words[litIndex].classList.add("lit");
  }

  function down(el, midi, id) {
    prefetch(true);
    startNote(midi, id); lightWord();
    el.classList.add("down");
  }
  function up(el) {
    el.classList.remove("down");
  }

  function bind(el, midi, id, stopProp) {
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault(); if (stopProp) e.stopPropagation();
      down(el, midi, id);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
      el.addEventListener(ev, function () { up(el); });
    });
    el.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); down(el, midi, id); }
    });
    el.addEventListener("keyup", function (e) {
      if (e.key === "Enter" || e.key === " ") up(el);
    });
  }

  WHITE.forEach(function (k, i) {
    var b = document.createElement("button");
    b.className = "key"; b.type = "button"; b.textContent = k[0];
    b.setAttribute("aria-label", "Play note " + k[0]);
    bind(b, k[1], "w" + i, false);
    host.appendChild(b); byKey[k[2]] = { el: b, midi: k[1], id: "w" + i };
  });
  BLACK.forEach(function (k, i) {
    var b = document.createElement("button");
    b.className = "black"; b.type = "button"; b.style.setProperty("--i", k[0]);
    b.setAttribute("aria-label", "Play note " + k[3]);
    bind(b, k[1], "b" + i, true);
    host.appendChild(b); byKey[k[2]] = { el: b, midi: k[1], id: "b" + i };
  });

  // Tastiera del computer
  var heldKeys = {};
  document.addEventListener("keydown", function (e) {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
    var hit = byKey[e.key.toUpperCase()];
    if (hit && getComputedStyle(hit.el).display !== "none") { heldKeys[e.key.toUpperCase()] = true; down(hit.el, hit.midi, hit.id); }
  });
  document.addEventListener("keyup", function (e) {
    var k = e.key.toUpperCase(), hit = byKey[k];
    if (hit && heldKeys[k]) { delete heldKeys[k]; up(hit.el); }
  });

  // I campioni si scaricano quando il browser è libero, o appena ci si avvicina alla tastiera.
  var warm = function () { prefetch(); };
  if ("requestIdleCallback" in window) requestIdleCallback(warm, { timeout: 3000 }); else setTimeout(warm, 1500);
  host.addEventListener("pointerenter", warm, { once: true });
  host.addEventListener("touchstart", warm, { once: true, passive: true });

  // iOS: il Web Audio tace con l'interruttore silenzioso, a meno che la sessione audio sia "playback"
  // (Safari 16.4+) o suoni un elemento <audio> (trucco per le versioni precedenti).
  var silentEl = null;
  function ignoreSilentSwitch() {
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    if (silentEl) return;
    try {
      silentEl = document.createElement("audio");
      silentEl.setAttribute("playsinline", ""); silentEl.loop = true;
      // WAV muto di 0,1 s
      silentEl.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=";
      var pr = silentEl.play(); if (pr && pr.catch) pr.catch(function () {});
    } catch (e) {}
  }

  // Se dopo il tocco il suono non parte, lo dice invece di restare muta.
  var hintEl = document.querySelector(".hint"), hintHTML = hintEl ? hintEl.innerHTML : "", warned = false;
  function watchState() {
    setTimeout(function () {
      if (!hintEl || warned || (ctx && ctx.state === "running" && haveSamples())) return;
      warned = true;
      hintEl.textContent = "No sound? Check your phone isn’t on silent and the volume is up, then tap a key again.";
    }, 3500);
  }

  // Sblocco dell'audio: Safari/iOS vogliono un gesto "completo" (touchend, click o tasto).
  function unlock() {
    var c = ensureContext(); if (!c) return;
    ignoreSilentSwitch();
    var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination); s.start(0);
    decodeAll();
  }
  ["touchend", "pointerup", "click", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, function () { unlock(); }, true);
  });
  host.addEventListener("pointerdown", watchState, { once: true });
})();
