// System Wise LLC — shared behavior

// Scroll-reveal animations: tag sections and cards, then fade them in as they enter the viewport
(function () {
  var groups = [
    // [selector, effect, stagger children?]
    [".section-head, .mission, .sample-note, .t-more, .filter-bar, .notice, .stepper", "", false],
    [".about-text, .module-body, .form-card", "reveal-left", false],
    [".about-visual, .module-visual, .info-card", "reveal-right", false],
    [".cta-band, .t-slider", "reveal-zoom", false],
    [".service-grid, .process, .t-grid, .serve-grid, .stat-grid, .feature-grid, .footer-grid, .highlights", "", true]
  ];
  var items = [];

  groups.forEach(function (g) {
    document.querySelectorAll(g[0]).forEach(function (el) {
      var targets = g[2] ? Array.prototype.slice.call(el.children) : [el];
      targets.forEach(function (t, i) {
        if (t.classList.contains("reveal")) return;
        t.classList.add("reveal");
        if (g[1]) t.classList.add(g[1]);
        if (g[2]) t.style.setProperty("--reveal-delay", (i % 4) * 90 + "ms");
        items.push(t);
      });
    });
  });

  // Hand control back to each element's own styles (e.g. card hover effects) once revealed
  function done(el) {
    var delay = parseInt(el.style.getPropertyValue("--reveal-delay") || "0", 10);
    setTimeout(function () {
      el.classList.remove("reveal", "reveal-left", "reveal-right", "reveal-zoom", "in");
      el.style.removeProperty("--reveal-delay");
    }, delay + 800);
  }

  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); done(el); });
    return;
  }
  var fired = false;
  // Safety net: if the browser never reports visibility (e.g. rendering stalled), show everything
  setTimeout(function () {
    if (fired) return;
    items.forEach(function (el) { el.classList.add("in"); done(el); });
  }, 2500);
  var io = new IntersectionObserver(function (entries) {
    fired = true;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
      done(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach(function (el) { io.observe(el); });
})();

// Header shadow once the page is scrolled
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;
  function update() { header.classList.toggle("scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", update, { passive: true });
  update();
})();

// Mobile nav toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();

// Footer year
(function () {
  var el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();

// Home hero: flowing light ribbons drawn on a canvas. Each ribbon is a bundle of thin
// glowing strands that sway slowly across the screen; strands add up where they overlap.
(function () {
  var canvas = document.querySelector("[data-ribbons]");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, dpr = 1, strands = 30, raf = 0, visible = true, t0 = performance.now();

  // [vertical position, tilt, wave height, wave length, speed, phase, spread, colour (r,g,b), strength]
  var RIBBONS = [
    [0.30, 0.30, 0.13, 1.6, 0.16, 0.0, 0.10, [70, 140, 255], 1.0],
    [0.55, 0.42, 0.10, 2.1, -0.12, 1.7, 0.08, [90, 210, 255], 0.9],
    [0.42, 0.36, 0.16, 1.3, 0.10, 3.1, 0.06, [255, 150, 60], 0.85],
    [0.78, 0.22, 0.09, 2.6, 0.14, 4.4, 0.12, [60, 100, 240], 0.7]
  ];

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1 : 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    strands = W < 700 ? 20 : 40;
    draw((performance.now() - t0) / 1000);
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    var step = Math.max(8, W / 90);
    for (var r = 0; r < RIBBONS.length; r++) {
      var R = RIBBONS[r], c = R[7];
      for (var i = 0; i < strands; i++) {
        var k = i / (strands - 1) - 0.5;                 // -0.5 … 0.5 across the ribbon
        var core = 1 - Math.min(1, Math.abs(k) * 2);     // brightest in the middle strands
        var alpha = (0.06 + 0.42 * core * core) * R[8];
        ctx.beginPath();
        for (var x = -step; x <= W + step; x += step) {
          var u = x / W;
          var sway = Math.sin(u * Math.PI * R[3] + t * R[4] * 2 + R[5]);
          var twist = Math.sin(u * Math.PI * 1.3 - t * R[4] * 1.5 + R[5] * 0.7 + k * 1.8);
          var y = H * (R[0] - (u - 0.5) * R[1])
                + sway * R[2] * H
                + k * R[6] * H * (0.55 + 0.45 * twist);   // strands pinch and fan out
          if (x === -step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha.toFixed(3) + ")";
        ctx.lineWidth = core > 0.85 ? 1.6 : 1;
        ctx.stroke();
      }
      // soft wide glow along the ribbon's centre
      ctx.beginPath();
      for (var gx = -step; gx <= W + step; gx += step) {
        var gu = gx / W;
        var gy = H * (R[0] - (gu - 0.5) * R[1]) + Math.sin(gu * Math.PI * R[3] + t * R[4] * 2 + R[5]) * R[2] * H;
        if (gx === -step) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
      }
      ctx.strokeStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.08 * R[8]).toFixed(3) + ")";
      ctx.lineWidth = Math.max(26, H * 0.08);
      ctx.stroke();
      ctx.strokeStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.12 * R[8]).toFixed(3) + ")";
      ctx.lineWidth = Math.max(8, H * 0.018);
      ctx.stroke();
    }
  }

  function frame(now) {
    raf = 0;
    draw((now - t0) / 1000);
    if (visible && !document.hidden && !reduce) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible && !document.hidden && !reduce) raf = requestAnimationFrame(frame); }

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    kick();
  }).observe(canvas);
  document.addEventListener("visibilitychange", kick);
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
  resize();
  kick();
})();

// Home hero: optional background video (HLS .m3u8 or MP4 in data-src). Uses native HLS where
// available (Safari/iOS), otherwise loads hls.js on demand. Paused while off screen.
(function () {
  var video = document.querySelector(".hero-bg__video");
  if (!video) return;
  var src = (video.dataset.src || "").trim();
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!src || reduce) { video.remove(); return; }
  var wrap = video.parentNode;
  video.addEventListener("playing", function () { wrap.classList.add("is-playing"); });
  function start() { var p = video.play(); if (p && p.catch) p.catch(function () {}); }

  if (/\.m3u8(\?|$)/i.test(src)) {
    if (video.canPlayType("application/vnd.apple.mpegurl")) { video.src = src; start(); }
    else {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js";
      s.onload = function () {
        if (!window.Hls || !window.Hls.isSupported()) return;
        var hls = new window.Hls({ capLevelToPlayerSize: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, start);
      };
      document.head.appendChild(s);
    }
  } else { video.src = src; start(); }

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start(); else video.pause();
  }).observe(wrap);
})();

// Home "How We Work": a line draws between the step numbers, the steps pop in one by one,
// then a spotlight moves through the steps. The line follows the layout (row, grid or column).
(function () {
  var list = document.querySelector("[data-flow]");
  if (!list) return;
  var steps = Array.prototype.slice.call(list.children);
  var dots = steps.map(function (li) { return li.querySelector(".step"); });
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "flow__svg");
  svg.setAttribute("aria-hidden", "true");
  var track = document.createElementNS(NS, "path");
  track.setAttribute("class", "flow__track");
  var line = document.createElementNS(NS, "path");
  line.setAttribute("class", "flow__line");
  var dash = document.createElementNS(NS, "path");
  dash.setAttribute("class", "flow__dash");
  svg.appendChild(track); svg.appendChild(line); svg.appendChild(dash);
  list.appendChild(svg);

  // Connect consecutive step numbers that share a row or a column (no diagonals across cards)
  function draw() {
    var box = list.getBoundingClientRect();
    svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
    var pts = dots.map(function (d) {
      var r = d.getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top, r: r.width / 2 };
    });
    var dPath = "";
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var sameRow = Math.abs(a.y - b.y) < 4, sameCol = Math.abs(a.x - b.x) < 4;
      if (!sameRow && !sameCol) continue;
      var gap = a.r + 8;
      if (sameRow) dPath += "M" + (a.x + gap) + " " + a.y + " L" + (b.x - gap) + " " + b.y + " ";
      else dPath += "M" + a.x + " " + (a.y + gap) + " L" + b.x + " " + (b.y - gap) + " ";
    }
    [track, line, dash].forEach(function (p) { p.setAttribute("d", dPath.trim()); });
    var len = 0;
    try { len = line.getTotalLength(); } catch (e) {}
    line.style.strokeDasharray = len + " " + len;
    if (!list.classList.contains("is-drawn")) line.style.strokeDashoffset = reduce ? 0 : len;
  }

  var current = -1, cycle = 0, hovering = false, started = false;
  function spotlight(i) {
    current = i;
    steps.forEach(function (li, j) { li.classList.toggle("is-current", j === i); });
  }
  function startCycle() {
    if (reduce) return;
    clearInterval(cycle);
    cycle = setInterval(function () {
      if (!hovering && !document.hidden) spotlight((current + 1) % steps.length);
    }, 2600);
  }

  function play() {
    if (started) return;
    started = true;
    draw();
    if (reduce) { list.classList.add("is-drawn"); steps.forEach(function (li) { li.classList.add("is-shown"); }); return; }
    void line.getBoundingClientRect();
    list.classList.add("is-drawn");
    setTimeout(draw, 1200); // re-measure once the cards' scroll-reveal has settled
    setTimeout(draw, 2600); // and again for slower devices
    line.style.strokeDashoffset = 0;
    steps.forEach(function (li, i) {
      setTimeout(function () { li.classList.add("is-shown"); }, 250 + i * 450);
    });
    setTimeout(function () { list.classList.add("is-flowing"); spotlight(0); startCycle(); }, 250 + steps.length * 450 + 300);
  }

  list.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hovering = true; });
  list.addEventListener("pointerleave", function () { hovering = false; });
  steps.forEach(function (li, i) {
    li.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" && started) spotlight(i); });
    li.addEventListener("focusin", function () { if (started) spotlight(i); });
  });

  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { play(); io.disconnect(); }
  }, { threshold: 0.3 });
  io.observe(list);
  setTimeout(play, 6000); // safety net if visibility is never reported
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(draw, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  draw();
})();

// Home "Our Services": endless ribbon that bends into a wave while it moves (drag, swipe,
// trackpad or page scroll), flares and smears near the edges, then settles flat.
// Without JavaScript the ribbon is a plain horizontally scrollable row.
(function () {
  var root = document.querySelector("[data-rf]");
  if (!root) return;
  var track = root.querySelector("[data-rf-track]");
  var items = Array.prototype.slice.call(root.querySelectorAll("[data-rf-item]"));
  if (items.length < 2) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Settings (wave strength/frequency, settle speed, scroll speed, edge zone/flare, smear, fringe)
  var S = { strength: 1, freq: 1, settle: 9, scroll: 1, zone: 0.26, flare: 1, smear: 0.8, fringe: 0.7, gap: 18 };

  // Clone the set until the loop is wider than any screen, so it never shows a gap
  var originals = items.slice();
  root.classList.add("rf--js");
  var W = 0, itemW = 0, itemH = 0, pitch = 0, total = 0;
  function ensureClones() {
    var need = Math.max(window.innerWidth, root.clientWidth) * 2;
    while (items.length * pitch < need && items.length < originals.length * 6) {
      originals.forEach(function (o) {
        var c = o.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
        track.appendChild(c);
        items.push(c);
      });
    }
  }

  var x = 0, vel = 0, bend = 0, raf = 0, last = 0, visible = false, t = 0;
  var dragging = false;

  function measure() {
    W = root.clientWidth;
    itemW = originals[0].offsetWidth;
    itemH = 0;
    originals.forEach(function (o) { itemH = Math.max(itemH, o.offsetHeight); });
    pitch = itemW + S.gap;
    ensureClones();
    total = items.length * pitch;
    var amp = Math.min(70, W * 0.06);
    root.style.setProperty("--rf-h", Math.ceil(itemH + amp * 2 + 96) + "px");
    render();
  }

  function render() {
    var b = reduce ? 0 : bend;
    var nb = Math.max(-1, Math.min(1, b / 1400)); // normalized bend from velocity
    var amp = Math.min(70, W * 0.06) * S.strength;
    var zonePx = W * S.zone;
    var cy = 0;
    for (var i = 0; i < items.length; i++) {
      var px = ((i * pitch + x) % total + total) % total;
      if (px > total - pitch) px -= total;         // wrap so cards enter from either side
      var cx = px + itemW / 2;                      // card centre in ribbon space
      var el = items[i];
      if (px > W + 40 || px + itemW < -40) { if (el._v !== 0) { el.style.visibility = "hidden"; el._v = 0; } continue; }
      if (el._v !== 1) { el.style.visibility = ""; el._v = 1; }
      var phase = (cx / W) * Math.PI * 2 * S.freq + t * 1.6;
      var y = Math.sin(phase) * amp * nb;
      var slope = Math.cos(phase) * amp * nb * (Math.PI * 2 * S.freq / W);
      var rot = Math.atan(slope) * 180 / Math.PI;
      var edgeDist = Math.min(cx, W - cx);
      var e = edgeDist < zonePx ? 1 - Math.max(0, edgeDist) / zonePx : 0;   // 0 inside, 1 at the edge
      var motion = Math.abs(nb);
      var sx = 1 + S.flare * 0.18 * e * (0.35 + motion) + motion * S.smear * 0.06;
      var sy = 1 + S.flare * 0.06 * e * (0.35 + motion);
      el.style.transform = "translate3d(" + px.toFixed(1) + "px," + (cy + y).toFixed(1) + "px,0) translateY(-50%) rotate(" + rot.toFixed(2) + "deg) scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ")";
      el.style.transformOrigin = (cx < W / 2 ? "100%" : "0%") + " 50%";
      var blur = S.smear * motion * (1.2 + 3 * e);
      var fr = S.fringe * nb * (2 + 4 * e);
      var f = "";
      if (blur > 0.15) f += "blur(" + blur.toFixed(1) + "px) ";
      if (Math.abs(fr) > 0.3) f += "drop-shadow(" + fr.toFixed(1) + "px 0 0 rgba(255,40,80,.35)) drop-shadow(" + (-fr).toFixed(1) + "px 0 0 rgba(0,180,255,.35))";
      if (el._f !== f) { el.style.filter = f; el._f = f; }
      el.style.opacity = (1 - 0.35 * e * e).toFixed(3);
    }
  }

  function frame(now) {
    raf = 0;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    t += dt;
    if (!dragging) {
      x += vel * dt;
      vel *= Math.exp(-S.settle * 0.35 * dt);     // glide to a stop
      if (Math.abs(vel) < 2) vel = 0;
    }
    bend += (vel - bend) * (1 - Math.exp(-S.settle * dt)); // the wave follows speed, then settles flat
    render();
    if (dragging || Math.abs(vel) > 0 || Math.abs(bend) > 1) kick();
    else { bend = 0; render(); last = 0; }
  }
  function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  // Drag / swipe (1:1), with momentum on release; drags never open a card link
  var startX = 0, startY = 0, lastX = 0, lastT = 0, pid = null, maybe = false, moved = false;
  root.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    maybe = true; moved = false; pid = e.pointerId;
    startX = lastX = e.clientX; startY = e.clientY; lastT = performance.now();
  });
  root.addEventListener("pointermove", function (e) {
    if (!maybe || e.pointerId !== pid) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (!dragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { maybe = false; return; } // vertical: let the page scroll
      if (Math.abs(dx) < 6) return;
      dragging = true; moved = true; root.classList.add("is-dragging");
      try { root.setPointerCapture(pid); } catch (err) {}
    }
    var now = performance.now(), step = e.clientX - lastX;
    x += step * S.scroll;
    var inst = step / Math.max(1, now - lastT) * 1000;
    vel = vel * 0.6 + inst * 0.4;
    lastX = e.clientX; lastT = now;
    kick();
  });
  function end(e) {
    if (!maybe) return;
    maybe = false;
    if (!dragging) return;
    dragging = false; root.classList.remove("is-dragging");
    if (performance.now() - lastT > 90) vel *= 0.2; // held still before letting go
    vel = Math.max(-3000, Math.min(3000, vel));
    kick();
  }
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
  root.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  root.addEventListener("dragstart", function (e) { e.preventDefault(); });

  // Trackpad / shift+wheel sideways swipes move the ribbon
  root.addEventListener("wheel", function (e) {
    var dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
    if (!dx) return;
    e.preventDefault();
    x -= dx * S.scroll;
    vel = vel * 0.7 - dx * 6 * 0.3;
    kick();
  }, { passive: false });

  // Scrolling the page nudges the ribbon too (the page itself still scrolls normally)
  var lastScroll = window.scrollY;
  window.addEventListener("scroll", function () {
    var d = window.scrollY - lastScroll;
    lastScroll = window.scrollY;
    if (!visible || dragging || Math.abs(d) > 400) return;
    vel -= d * 9 * S.scroll;
    vel = Math.max(-2200, Math.min(2200, vel));
    kick();
  }, { passive: true });

  // Keyboard: focus a card link and use Tab, or arrows on the ribbon
  root.addEventListener("focusin", function (e) {
    var item = e.target.closest("[data-rf-item]");
    if (!item) return;
    var i = items.indexOf(item);
    var px = ((i * pitch + x) % total + total) % total;
    if (px > total - pitch) px -= total;
    if (px < 24 || px + itemW > W - 24) { x += (W / 2 - itemW / 2) - px; render(); }
  });

  var io = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) kick();
  }, { threshold: 0 });
  io.observe(root);
  document.addEventListener("visibilitychange", function () { last = 0; kick(); });
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(measure, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  x = Math.min(0, (root.clientWidth - originals[0].offsetWidth) / 2 - originals[0].offsetWidth - 18); // start with a card near the middle
  measure();
})();

// Testimonials: curved "inside of a cylinder" carousel. Cards drift right-to-left, can be
// dragged and flung (momentum decays), and each card's shape is recomputed every frame from
// its position: upright in the middle, taller and leaning outward toward the edges.
(function () {
  var THEMES = 4;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-tc]").forEach(function (root) {
    var track = root.querySelector("[data-tc-track]");
    var pauseBtn = root.querySelector("[data-tc-pause]");
    var figs;
    if (root.dataset.tcSource) {
      var src = document.querySelector(root.dataset.tcSource);
      figs = src ? Array.prototype.map.call(src.querySelectorAll(".t-card"), function (f) {
        var c = f.cloneNode(true);
        // The source cards may be mid scroll-reveal (hidden); the copies must always be visible
        c.classList.remove("reveal", "reveal-left", "reveal-right", "reveal-zoom", "in");
        c.style.removeProperty("--reveal-delay");
        return c;
      }) : [];
    } else {
      figs = Array.prototype.slice.call(track.querySelectorAll(".t-card"));
    }
    if (!figs.length) return;

    var cards = figs.map(function (fig, i) {
      var card = document.createElement("div");
      card.className = "tc__card";
      card.dataset.theme = i % THEMES;
      var bg = document.createElement("span");
      bg.className = "tc__bg";
      card.appendChild(bg);
      card.appendChild(fig);
      track.appendChild(card);
      return { el: card, fig: fig };
    });

    var n = cards.length;
    var cfg, u = 1, W = 0, offset = 0, fling = 0, auto = reduce ? 0 : 1, autoTarget = auto;
    var paused = false, hover = false, visible = false, raf = 0, last = 0;
    var SPEED = 50; // design units per second, right to left

    function measure() {
      W = root.clientWidth;
      var mobile = W < 820;
      // Design units: desktop 1440-wide frame, phones 640-wide
      cfg = mobile
        ? { design: 640, base: 440, pitch: 470, H0: 430, G: 120, pad: 30 }
        : { design: 1440, base: 300, pitch: 330, H0: 330, G: 110, pad: 28 };
      // Keep cards a readable size (about 250–300px wide) whatever the screen width;
      // the cylinder then spans however many design units fit on screen.
      u = Math.max(250 / cfg.base, Math.min(300 / cfg.base, W / cfg.design));
      cfg.design = W / u;
      cfg.half = cfg.design / 2 - 14;
      cfg.grow = cfg.base * 0.28;
      cfg.total = Math.max(n * cfg.pitch, cfg.design * 1.6);
      if (n * cfg.pitch < cfg.total) cfg.pitch = cfg.total / n;
      var contentW = (cfg.base - cfg.pad * 2) * u;
      var tallest = 0;
      cards.forEach(function (c) { c.fig.style.width = contentW + "px"; tallest = Math.max(tallest, c.fig.offsetHeight); });
      // Grow the cards if the longest quote needs more room
      cfg.H0 = Math.max(cfg.H0, tallest / u + cfg.pad * 2);
      var bandH = (cfg.H0 + cfg.G + 70) * u;
      root.style.height = Math.round(bandH) + "px";
      cfg.cy = bandH / 2 / u;
      render();
    }

    function q(v) { return Math.min(Math.abs(v) / cfg.half, 1.3); }

    function render() {
      var cx = cfg.design / 2, r = 15 * (cfg.base / 170) * 0.7;
      for (var i = 0; i < n; i++) {
        var t = (((i * cfg.pitch + offset + cfg.total / 2) % cfg.total) + cfg.total) % cfg.total - cfg.total / 2;
        var x = t * (1 + 0.083 * Math.pow(t / cfg.half, 2));
        var d = q(x);
        var w = cfg.base + cfg.grow * d * d;
        var xL = x - w / 2, xR = x + w / 2;
        var hL = cfg.H0 + cfg.G * Math.pow(q(xL), 2.6);
        var hR = cfg.H0 + cfg.G * Math.pow(q(xR), 2.6);
        var yc = cfg.cy - 12 * (cfg.H0 / 280) * d * d;
        var hMax = Math.max(hL, hR);
        var el = cards[i].el;
        var left = (cx + xL) * u;
        if (left > W + 40 || left + w * u < -40) { el.style.visibility = "hidden"; continue; }
        el.style.visibility = "visible";
        // Card box (px) and its rounded-quad outline
        var bw = w * u, bh = hMax * u, rr = r * u;
        var yTL = (hMax - hL) / 2 * u, yBL = (hMax + hL) / 2 * u;
        var yTR = (hMax - hR) / 2 * u, yBR = (hMax + hR) / 2 * u;
        var m1 = (yTR - yTL) / bw, m2 = (yBR - yBL) / bw;
        var p = "M0," + (yTL + rr) + " Q0," + yTL + " " + rr + "," + (yTL + m1 * rr) +
          " L" + (bw - rr) + "," + (yTR - m1 * rr) + " Q" + bw + "," + yTR + " " + bw + "," + (yTR + rr) +
          " L" + bw + "," + (yBR - rr) + " Q" + bw + "," + yBR + " " + (bw - rr) + "," + (yBR - m2 * rr) +
          " L" + rr + "," + (yBL + m2 * rr) + " Q0," + yBL + " 0," + (yBL - rr) + " Z";
        el.style.width = bw.toFixed(1) + "px";
        el.style.height = bh.toFixed(1) + "px";
        el.style.transform = "translate3d(" + left.toFixed(1) + "px," + ((yc - hMax / 2) * u).toFixed(1) + "px,0)";
        el.style.clipPath = "path('" + p.replace(/(\d+\.\d{2})\d+/g, "$1") + "')";
      }
    }

    function frame(now) {
      raf = 0;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      autoTarget = (paused || hover || reduce) ? 0 : 1;
      auto += (autoTarget - auto) * (1 - Math.exp(-dt / 0.35)); // ease in/out of the drift
      if (!dragging) {
        offset += (fling - SPEED * auto) * dt;
        fling *= Math.pow(0.05, dt); // momentum decays ~95% per second
        if (Math.abs(fling) < 0.5) fling = 0;
      }
      render();
      if (visible && !document.hidden && (dragging || fling || auto > 0.001 || autoTarget > 0)) raf = requestAnimationFrame(frame);
      else last = 0;
    }
    function kick() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

    // Drag 1:1 with momentum on release
    var dragging = false, pid = null, lastX = 0, samples = [];
    root.addEventListener("pointerdown", function (e) {
      if (e.target.closest("[data-tc-pause]")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true; pid = e.pointerId; lastX = e.clientX; fling = 0;
      samples = [{ x: e.clientX, t: performance.now() }];
      root.classList.add("is-dragging");
      root.classList.add("was-dragged");
      try { root.setPointerCapture(pid); } catch (err) {}
      kick();
    });
    root.addEventListener("pointermove", function (e) {
      if (!dragging || e.pointerId !== pid) return;
      offset += (e.clientX - lastX) / u;
      lastX = e.clientX;
      samples.push({ x: e.clientX, t: performance.now() });
      if (samples.length > 6) samples.shift();
      if (!raf) render();
    });
    function release(e) {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false;
      root.classList.remove("is-dragging");
      var f = samples[0], l = samples[samples.length - 1];
      if (l && f && l.t - f.t > 0 && performance.now() - l.t < 100) {
        fling = Math.max(-2000, Math.min(2000, (l.x - f.x) / (l.t - f.t) * 1000 / u));
      }
      kick();
    }
    root.addEventListener("pointerup", release);
    root.addEventListener("pointercancel", release);

    // Ease the drift to a stop while a mouse is over a card (easier reading)
    root.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { hover = true; kick(); } });
    root.addEventListener("pointerleave", function () { hover = false; kick(); });

    pauseBtn.addEventListener("click", function () {
      paused = !paused;
      pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
      pauseBtn.setAttribute("aria-label", paused ? "Play testimonials" : "Pause testimonials");
      root.classList.toggle("is-paused", paused);
      kick();
    });
    if (reduce) { paused = true; root.classList.add("is-paused"); pauseBtn.hidden = true; }
    var io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { root.classList.add("is-in"); kick(); }
    }, { threshold: 0 });
    io.observe(root);
    setTimeout(function () { root.classList.add("is-in"); }, 2500); // safety net if visibility is never reported
    document.addEventListener("visibilitychange", function () { last = 0; kick(); });
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(measure, 100); });

    measure();
  });
})();

// Home page: testimonial slider (arrows, dots, swipe, gentle autoplay)
(function () {
  var slider = document.querySelector("[data-slider]");
  if (!slider) return;
  var track = slider.querySelector(".t-track");
  var cards = track.querySelectorAll(".t-card");
  var dotsWrap = document.querySelector(".t-dots");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timer;

  function perView() {
    return Math.max(1, Math.round(track.clientWidth / cards[0].getBoundingClientRect().width));
  }
  function pages() { return Math.ceil(cards.length / perView()); }
  function currentPage() {
    var step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    return Math.min(pages() - 1, Math.round(track.scrollLeft / (step * perView())));
  }
  function goTo(page) {
    var total = pages();
    page = (page + total) % total;
    var card = cards[Math.min(page * perView(), cards.length - 1)];
    track.scrollTo({ left: card.offsetLeft - cards[0].offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
  }
  function buildDots() {
    dotsWrap.innerHTML = "";
    for (var i = 0; i < pages(); i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.tabIndex = -1;
      b.addEventListener("click", goTo.bind(null, i));
      dotsWrap.appendChild(b);
    }
    updateDots();
  }
  function updateDots() {
    var p = currentPage();
    dotsWrap.querySelectorAll("button").forEach(function (b, i) { b.classList.toggle("active", i === p); });
  }

  slider.querySelectorAll(".t-arrow").forEach(function (btn) {
    btn.addEventListener("click", function () { goTo(currentPage() + Number(btn.dataset.dir)); });
  });
  track.addEventListener("scroll", function () { window.requestAnimationFrame(updateDots); });
  window.addEventListener("resize", buildDots);

  function start() {
    if (reduceMotion) return;
    stop();
    timer = setInterval(function () { goTo(currentPage() + 1); }, 6000);
  }
  function stop() { clearInterval(timer); }
  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);
  slider.addEventListener("focusin", stop);
  slider.addEventListener("focusout", start);
  track.addEventListener("touchstart", stop, { passive: true });

  buildDots();
  start();
})();

// Services page: 3D service ring (turning carousel with depth blur, autoplay, drag and custom cursor)
(function () {
  var root = document.querySelector("[data-sr]");
  if (!root) return;

  var stage = root.querySelector("[data-sr-stage]");
  var cards = Array.prototype.slice.call(root.querySelectorAll("[data-sr-card]"));
  var ticks = Array.prototype.slice.call(root.querySelectorAll("[data-sr-tick]"));
  var panels = Array.prototype.slice.call(root.querySelectorAll("[data-sr-panel]"));
  var hits = cards.map(function (c) { return c.querySelector(".sr__hit"); });
  var live = root.querySelector("[data-sr-live]");
  var autoBtn = root.querySelector("[data-sr-auto]");
  var request = root.querySelector("[data-sr-request]");
  var requestLabel = root.querySelector("[data-sr-request-label]");
  var cursor = root.querySelector("[data-sr-cursor]");
  var N = cards.length, STEP = Math.PI * 2 / N;
  var K = 95, C = 2 * Math.sqrt(K);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var speed = parseInt(root.dataset.speed, 10) || 5000;

  var index = 0, target = 0, cur = reduce ? 0 : -1.15, vel = 0;
  var W = 0, H = 0, R = 0, P = 0, cx = 0, floorY = 0, horizon = 0, unit = 120, cardW = 0, fs = 1.08;
  var raf = 0, last = 0, visible = false, dragging = false, playing = false;
  var panelHover = false, engaged = false, timer = 0, started = false;

  function mod(a, n) { return ((a % n) + n) % n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function measure() {
    var r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    var mobile = W < 620;
    var byH = Math.round((H - 34 - 18) / fs);
    var byW = Math.round((mobile ? 0.6 : 0.34) * W / 0.74);
    var cardH = Math.max(180, Math.min(byH, byW));
    stage.style.setProperty("--sr-card-h", cardH + "px");
    cardW = cardH * 0.74;
    cx = W / 2;
    R = (mobile ? 0.62 : 0.42) * W;
    P = (mobile ? 1.9 : 1.65) * W;
    floorY = H - 34;
    horizon = H * 0.4;
    unit = Math.max(mobile ? 90 : 120, W * 0.3);
    render();
  }

  function render() {
    var still = Math.abs(cur - target) < 0.002 && Math.abs(vel) < 0.002;
    for (var a = 0; a < N; a++) {
      var phi = mod((a - cur) * STEP + Math.PI, Math.PI * 2) - Math.PI;
      var z = R * (1 - Math.cos(phi));
      var persp = P / (P + z);
      var sl = Math.abs(phi) / STEP;
      var scale = persp * (1 + (fs - 1) * clamp(1 - sl, 0, 1));
      var x = cx + R * Math.sin(phi) * persp;
      var bottom = H - (horizon + (floorY - horizon) * persp);
      var blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
      var op = clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);
      var half = cardW * scale / 2;
      if (x + half < -4 || x - half > W + 4) op = 0;
      var el = cards[a];
      el.style.transform = "translate3d(" + x.toFixed(2) + "px," + (-bottom).toFixed(2) + "px,0) translateX(-50%) scale(" + scale.toFixed(4) + ")";
      el.style.opacity = op.toFixed(3);
      el.style.visibility = op < 0.01 ? "hidden" : "visible";
      el.style.pointerEvents = op < 0.5 ? "none" : "";
      el.style.zIndex = Math.round(scale * 1000);
      var b = blur <= 0.05 ? "" : "blur(" + blur.toFixed(1) + "px)";
      if (el._blur !== b) { el.style.filter = b; el._blur = b; }
      el.classList.toggle("is-front", sl < 0.5 && still);
    }
  }

  function settled() { return Math.abs(cur - target) <= 0.0005 && Math.abs(vel) <= 0.0005; }

  function frame(now) {
    raf = 0;
    var dt = last ? Math.min(0.034, (now - last) / 1000) : 1 / 60;
    last = now;
    if (reduce && !dragging) { cur = target; vel = 0; }
    else {
      var h = dt / 3;
      for (var s = 0; s < 3; s++) {
        var acc = -K * (cur - target) - C * vel;
        vel += acc * h; cur += vel * h;
      }
    }
    if (!dragging && settled()) { cur = target; vel = 0; render(); last = 0; return; }
    render();
    kick();
  }
  function kick() {
    if (raf || !visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
  }

  function rank(a) { var k = mod(a - Math.round(target), N); return k > N / 2 ? k - N : k; }

  function setIndex(i, silent) {
    var changed = i !== index;
    index = i;
    hits.forEach(function (h, a) {
      var k = rank(a);
      var reachable = Math.abs(k) <= 2;
      h.tabIndex = reachable ? 0 : -1;
      cards[a].setAttribute("aria-hidden", reachable ? "false" : "true");
    });
    ticks.forEach(function (t, j) {
      t.setAttribute("aria-current", j === i ? "true" : "false");
      t.classList.toggle("is-past", j < i);
    });
    if (changed || silent) {
      panels.forEach(function (p, j) { p.hidden = j !== i; p.classList.remove("is-in"); });
      void panels[i].offsetWidth;
      panels[i].classList.add("is-in");
      var hit = hits[i];
      request.href = "contact.html?service=" + hit.dataset.slug;
      requestLabel.textContent = "Request " + hit.dataset.tick;
      if (!silent) {
        live.textContent = hit.getAttribute("aria-label");
        if (!reduce) { stage.classList.remove("is-sweep"); void stage.offsetWidth; stage.classList.add("is-sweep"); }
      }
    }
    restartBar();
    kick();
  }

  function moveTo(T) { target = T; setIndex(mod(T, N)); }
  function next() { moveTo(Math.round(target) + 1); }
  function prev() { moveTo(Math.round(target) - 1); }
  function go(i) { var d = mod(i - index, N); if (d > N / 2) d -= N; moveTo(Math.round(target) + d); }

  // Autoplay with progress bar on the current tick
  function restartBar() {
    ticks.forEach(function (t) { t.classList.remove("is-run"); });
    clearTimeout(timer);
    if (!playing) return;
    void root.offsetWidth;
    ticks[index].classList.add("is-run");
    timer = setTimeout(function () {
      if (playing && visible && !dragging && !document.hidden && !panelHover && !engaged) next();
      else restartBar();
    }, speed);
  }
  function play(on) {
    playing = on;
    root.classList.toggle("is-playing", on);
    autoBtn.classList.toggle("is-playing", on);
    autoBtn.setAttribute("aria-pressed", on ? "true" : "false");
    autoBtn.setAttribute("aria-label", on ? "Pause autoplay" : "Play autoplay");
    restartBar();
  }

  // Clicks
  root.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-sr-next]")) return next();
    if (t.closest("[data-sr-prev]")) return prev();
    var tick = t.closest("[data-sr-tick]");
    if (tick) return go(Number(tick.dataset.srTick));
    if (t.closest("[data-sr-auto]")) { if (!playing) engaged = false; return play(!playing); }
    var hit = t.closest("[data-sr-go]");
    if (hit) {
      var a = Number(hit.dataset.srGo), k = rank(a);
      if (k !== 0) return moveTo(Math.round(target) + k);
      return showDetails(hit.dataset.slug);
    }
    var details = t.closest("[data-sr-details]");
    if (details) { e.preventDefault(); return showDetails(details.dataset.slug); }
    if (t.closest(".sr__panel a, .sr__panel button")) { engaged = true; play(false); }
  });

  // Jump to the full service module below (resetting the filter so it is visible)
  function showDetails(slug) {
    var all = document.querySelector('.filter-btn[data-filter="all"]');
    if (all && !all.classList.contains("active")) all.click();
    var mod = document.getElementById(slug);
    if (mod) mod.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  // Keyboard
  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
  });

  // Drag / swipe with momentum
  var startX = 0, startY = 0, startT = 0, pid = null, samples = [], suppress = 0, maybe = false;
  stage.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    maybe = true; pid = e.pointerId; startX = e.clientX; startY = e.clientY; startT = target;
    samples = [{ x: e.clientX, t: performance.now() }];
  });
  stage.addEventListener("pointermove", function (e) {
    if (!maybe || e.pointerId !== pid) return;
    if (e.pointerType === "mouse" && !(e.buttons & 1)) return end(e);
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if (!dragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { maybe = false; return; }
      if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
        dragging = true; root.classList.add("is-dragging");
        try { stage.setPointerCapture(pid); } catch (err) {}
      } else return;
    }
    samples.push({ x: e.clientX, t: performance.now() });
    if (samples.length > 6) samples.shift();
    target = startT - dx / unit;
    kick();
  });
  function end(e) {
    if (!maybe) return;
    maybe = false;
    if (!dragging) return;
    dragging = false; root.classList.remove("is-dragging");
    var dx = e.clientX - startX;
    var f = samples[0], l = samples[samples.length - 1];
    var vx = l.t > f.t ? (l.x - f.x) / (l.t - f.t) : 0;
    var from = Math.round(startT), i;
    if (W < 620) {
      i = (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) ? from + (dx > 0 ? -1 : 1) : from;
    } else {
      i = Math.round(target - vx * 160 / unit);
      if (i === from && Math.abs(vx) > 0.3) i = from + (vx > 0 ? -1 : 1);
      i = clamp(i, from - 2, from + 2);
    }
    suppress = performance.now() + 60;
    moveTo(i);
  }
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  stage.addEventListener("click", function (e) {
    if (performance.now() < suppress) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  // Trackpad horizontal swipe
  var wheelAcc = 0, wheelLock = 0;
  stage.addEventListener("wheel", function (e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (performance.now() < wheelLock) return;
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 45) {
      if (wheelAcc > 0) next(); else prev();
      wheelAcc = 0; wheelLock = performance.now() + 520;
    }
  }, { passive: false });

  // Pause while reading the panel
  var panel = root.querySelector("[data-sr-panelwrap]");
  panel.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") panelHover = true; });
  panel.addEventListener("pointerleave", function () { panelHover = false; restartBar(); });

  // Custom "Drag / View" cursor with inertia (mouse / trackpad only)
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    root.classList.add("sr--cursor");
    var tx = 0, ty = 0, x = 0, y = 0, craf = 0, on = false;
    var follow = function () {
      craf = 0;
      var k = reduce ? 1 : 0.18;
      x += (tx - x) * k; y += (ty - y) * k;
      cursor.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) craf = requestAnimationFrame(follow);
    };
    stage.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = stage.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!on) { x = tx; y = ty; on = true; cursor.classList.add("is-on"); }
      var hit = e.target.closest(".sr__hit");
      var front = hit && rank(Number(hit.dataset.srGo)) === 0;
      cursor.classList.toggle("is-view", !!front && !dragging);
      cursor.classList.toggle("is-link", !!hit && !front && !dragging);
      if (!craf) craf = requestAnimationFrame(follow);
    });
    stage.addEventListener("pointerleave", function () {
      on = false; cursor.classList.remove("is-on", "is-view", "is-link");
    });
  } else if (cursor) {
    cursor.remove();
  }

  // Run only while visible
  var io = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible && !started) {
      started = true;
      if (root.dataset.autoplay === "true" && !reduce) play(true);
    }
    if (visible) kick();
  }, { threshold: 0 });
  io.observe(root);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { last = 0; kick(); } });
  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(measure, 120); });
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(stage);

  measure();
  setIndex(0, true);
})();

// Services page: category filter bar
(function () {
  var buttons = document.querySelectorAll(".filter-btn");
  var modules = document.querySelectorAll(".service-module");
  if (!buttons.length || !modules.length) return;

  function apply(filter) {
    buttons.forEach(function (b) {
      var active = b.dataset.filter === filter;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    var visible = 0;
    modules.forEach(function (m) {
      var show = filter === "all" || m.dataset.category === filter;
      m.hidden = !show;
      // Keep the left/right alternation correct among visible modules only
      if (show) m.classList.toggle("alt", visible++ % 2 === 1);
    });
  }

  function animate() {
    modules.forEach(function (m) {
      if (m.hidden) return;
      m.classList.remove("filter-in");
      void m.offsetWidth; // restart the animation
      m.classList.add("filter-in");
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () { apply(b.dataset.filter); animate(); });
  });
  apply("all");
})();

// Intake page: multi-step form with per-step validation
(function () {
  var form = document.getElementById("intake-form");
  if (!form) return;

  var steps = form.querySelectorAll(".intake-step");
  var markers = document.querySelectorAll(".stepper li");
  var back = document.getElementById("step-back");
  var next = document.getElementById("step-next");
  var submit = document.getElementById("step-submit");
  var count = document.getElementById("step-count");
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var current = 0;

  function check(field) {
    var ok;
    if (field.dataset.group) {
      ok = field.querySelectorAll("input:checked").length > 0;
    } else {
      var input = field.querySelector("input, select, textarea");
      ok = input.value.trim() !== "";
      if (ok && input.type === "email") ok = emailPattern.test(input.value.trim());
    }
    field.classList.toggle("invalid", !ok);
    return ok;
  }

  function validStep(i) {
    var valid = true;
    steps[i].querySelectorAll(".field[data-required]").forEach(function (f) {
      if (!check(f)) valid = false;
    });
    if (!valid) {
      var first = steps[i].querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
      if (first) first.focus();
    }
    return valid;
  }

  function show(i) {
    current = i;
    steps.forEach(function (s, n) { s.hidden = n !== i; });
    markers.forEach(function (m, n) {
      m.classList.toggle("active", n === i);
      m.classList.toggle("done", n < i);
    });
    back.hidden = i === 0;
    next.hidden = i === steps.length - 1;
    submit.hidden = i !== steps.length - 1;
    count.textContent = "Step " + (i + 1) + " of " + steps.length;
    document.querySelector(".stepper").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  next.addEventListener("click", function () {
    if (validStep(current)) show(current + 1);
  });
  back.addEventListener("click", function () { show(current - 1); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validStep(current)) return;
    // TODO: connect to a form backend (e.g. Formspree, Netlify Forms, or your own endpoint)
    form.querySelectorAll(".intake-step, .step-nav").forEach(function (el) { el.hidden = true; });
    document.querySelector(".step-nav").style.display = "none";
    markers.forEach(function (m) { m.classList.remove("active"); m.classList.add("done"); });
    document.getElementById("intake-success").classList.add("show");
  });

  form.querySelectorAll(".field[data-required]").forEach(function (f) {
    f.addEventListener("input", function () { if (f.classList.contains("invalid")) check(f); });
    f.addEventListener("change", function () { if (f.classList.contains("invalid")) check(f); });
  });
})();

// Contact page: pre-select service from ?service= and validate form
(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var select = form.querySelector("#service");
  var requested = new URLSearchParams(window.location.search).get("service");
  if (requested && select.querySelector('option[value="' + requested + '"]')) {
    select.value = requested;
  }

  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function check(field) {
    var input = field.querySelector("input, select, textarea");
    var ok = input.value.trim() !== "";
    if (ok && input.type === "email") ok = emailPattern.test(input.value.trim());
    field.classList.toggle("invalid", !ok);
    return ok;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;
    form.querySelectorAll(".field[data-required]").forEach(function (f) {
      if (!check(f)) valid = false;
    });
    if (!valid) {
      var first = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
      if (first) first.focus();
      return;
    }
    // TODO: connect to a form backend (e.g. Formspree, Netlify Forms, or your own endpoint)
    form.reset();
    if (requested) select.value = requested;
    document.getElementById("form-success").classList.add("show");
  });

  form.querySelectorAll(".field[data-required]").forEach(function (f) {
    f.addEventListener("input", function () { if (f.classList.contains("invalid")) check(f); });
    f.addEventListener("change", function () { if (f.classList.contains("invalid")) check(f); });
  });
})();
