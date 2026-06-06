/* ============================================================
   POSITIVAS · Nutriclub — interacciones "del futuro"
   WebGL aurora · Lenis · GSAP ScrollTrigger · cursor · tilt
   Todo con guardas: si una CDN falla, la web sigue viéndose bien.
   ============================================================ */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const LenisLib = window.Lenis || window.lenis;

  document.documentElement.classList.remove("no-js");

  /* ----------------------------------------------------------
     1. WebGL aurora background (raw WebGL, sin dependencias)
     ---------------------------------------------------------- */
  function initAurora() {
    if (reduced) return;
    const canvas = document.getElementById("aurora");
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: false });
    if (!gl) { canvas.style.display = "none"; return; }

    const vert = `
      attribute vec2 p;
      void main(){ gl_Position = vec4(p, 0.0, 1.0); }
    `;
    const frag = `
      precision highp float;
      uniform vec2  u_res;
      uniform float u_time;
      uniform vec2  u_mouse;

      // hash + value noise + fbm
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for(int i=0;i<6;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
        return v;
      }

      void main(){
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        vec2 st = uv;
        st.x *= u_res.x / u_res.y;

        float t = u_time * 0.05;
        vec2 m = (u_mouse - 0.5) * 0.6;

        // domain warp -> flujo orgánico
        vec2 q = vec2(fbm(st*2.0 + t + m), fbm(st*2.0 - t*0.8 - m));
        vec2 r = vec2(fbm(st*2.0 + 1.7*q + 0.15*t), fbm(st*2.0 + 1.7*q - 0.12*t));
        float f = fbm(st*2.2 + 2.4*r);

        // paleta de marca
        vec3 ink  = vec3(0.039, 0.051, 0.031);
        vec3 fern = vec3(0.063, 0.231, 0.141);
        vec3 moss = vec3(0.329, 0.392, 0.122);
        vec3 neon = vec3(0.110, 1.000, 0.459);

        vec3 col = ink;
        col = mix(col, fern, smoothstep(0.0, 0.7, f));
        col = mix(col, moss, smoothstep(0.35, 0.95, length(r)));
        col += neon * pow(smoothstep(0.55, 0.9, f), 3.0) * 0.5;

        // halo que sigue al ratón
        float halo = smoothstep(0.55, 0.0, distance(uv, u_mouse));
        col += neon * halo * 0.12;

        // viñeta
        float vig = smoothstep(1.25, 0.25, distance(uv, vec2(0.5)));
        col *= 0.55 + 0.45*vig;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function shader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
      return s;
    }
    const vs = shader(gl.VERTEX_SHADER, vert);
    const fs = shader(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) { canvas.style.display = "none"; return; }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = "none"; return; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    window.addEventListener("pointermove", (e) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = 1.0 - e.clientY / window.innerHeight;
    }, { passive: true });

    const DPR = Math.min(window.devicePixelRatio || 1, 1.6);
    function resize() {
      const w = Math.floor(window.innerWidth * DPR);
      const h = Math.floor(window.innerHeight * DPR);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }
    window.addEventListener("resize", resize);
    resize();

    const start = performance.now();
    let running = true;
    document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) loop(); });

    function loop() {
      if (!running) return;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ----------------------------------------------------------
     2. Helpers de split de texto
     ---------------------------------------------------------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = "";
    const spans = [];
    for (const ch of text) {
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = ch === " " ? " " : ch;
      el.appendChild(s);
      spans.push(s);
    }
    return spans;
  }
  function splitWords(el) {
    const words = el.textContent.split(/(\s+)/);
    el.textContent = "";
    const spans = [];
    words.forEach((w) => {
      if (w.trim() === "") { el.appendChild(document.createTextNode(" ")); return; }
      const s = document.createElement("span");
      s.className = "word";
      s.textContent = w;
      el.appendChild(s);
      spans.push(s);
    });
    return spans;
  }

  /* ----------------------------------------------------------
     3. Cursor personalizado + magnético + tilt
     ---------------------------------------------------------- */
  function initCursor() {
    if (!fine || reduced) return;
    const ring = document.getElementById("cursor");
    const dot = document.getElementById("cursor-dot");
    if (!ring || !dot) return;
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate3d(${mx - 3}px,${my - 3}px,0)`; }, { passive: true });
    (function r() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx - 19}px,${ry - 19}px,0)`;
      requestAnimationFrame(r);
    })();
    document.querySelectorAll("a, button, [data-magnetic], [data-tilt]").forEach((el) => {
      el.addEventListener("pointerenter", () => ring.classList.add("is-hover"));
      el.addEventListener("pointerleave", () => ring.classList.remove("is-hover"));
    });
  }

  function initMagnetic() {
    if (!fine || reduced) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.4;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  function initTilt() {
    if (!fine || reduced) return;
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const max = 8;
      el.style.transformStyle = "preserve-3d";
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateZ(0)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ----------------------------------------------------------
     4. Preloader
     ---------------------------------------------------------- */
  function runPreloader(done) {
    const pre = document.getElementById("preloader");
    const count = document.getElementById("count");
    if (!pre) { done(); return; }
    if (reduced || !hasGSAP) {
      if (count) count.textContent = "100";
      pre.style.transition = "opacity .5s ease";
      pre.style.opacity = "0";
      setTimeout(() => { pre.style.display = "none"; done(); }, 520);
      return;
    }
    const gsap = window.gsap;
    const obj = { v: 0 };
    const word = pre.querySelector(".preloader__word");
    const wchars = word ? splitChars(word) : [];
    gsap.from(wchars, { y: 30, opacity: 0, stagger: 0.04, duration: 0.6, ease: "power3.out" });
    const tl = gsap.timeline({ onComplete: () => { pre.style.display = "none"; done(); } });
    tl.to(obj, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => { if (count) count.textContent = Math.round(obj.v); } })
      .to(pre.querySelector(".preloader__inner"), { y: -30, opacity: 0, duration: 0.5, ease: "power2.in" }, "-=0.2")
      .to(pre, { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, "-=0.1");
  }

  /* ----------------------------------------------------------
     5. Fallback de reveals sin GSAP (IntersectionObserver)
     ---------------------------------------------------------- */
  function fallbackReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }

  /* ----------------------------------------------------------
     6. Animaciones principales (GSAP + ScrollTrigger + Lenis)
     ---------------------------------------------------------- */
  function initMotion() {
    const gsap = window.gsap;
    const hasST = typeof window.ScrollTrigger !== "undefined";
    if (hasST) gsap.registerPlugin(window.ScrollTrigger);
    const ST = window.ScrollTrigger;

    // Lenis smooth scroll
    let lenis = null;
    if (LenisLib && !reduced) {
      lenis = new LenisLib({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
      window.__lenis = lenis; // depuración / pruebas
      if (hasST) lenis.on("scroll", ST.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      // anclas suaves
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const id = a.getAttribute("href");
          if (id.length < 2) return;
          const t = document.querySelector(id);
          if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80, duration: 1.2 }); }
        });
      });
    }

    // Barra de progreso + nav hide
    const bar = document.getElementById("progress-bar");
    const nav = document.getElementById("nav");
    let lastY = 0;
    const onScroll = (y) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
      if (nav) {
        if (y > lastY && y > 300) nav.classList.add("is-hidden");
        else nav.classList.remove("is-hidden");
      }
      lastY = y;
    };
    if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
    else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

    // Reveals
    if (hasST) {
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.fromTo(el, { y: 36, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.95, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" }
        });
      });
    } else {
      fallbackReveals();
    }

    // Títulos h2 -> palabras que suben al hacer scroll
    document.querySelectorAll("[data-split-lines]").forEach((h) => {
      const words = splitWords(h);
      if (!hasST) return;
      gsap.fromTo(words, { yPercent: 120, opacity: 0 }, {
        yPercent: 0, opacity: 1, duration: 0.9, ease: "power4.out", stagger: 0.05,
        scrollTrigger: { trigger: h, start: "top 85%" }
      });
    });

    // Parallax imágenes
    if (hasST) {
      gsap.utils.toArray("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        gsap.fromTo(el, { yPercent: -speed * 16 }, {
          yPercent: speed * 16, ease: "none",
          scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true }
        });
      });
    }

    // Flotantes
    if (!reduced) {
      document.querySelectorAll("[data-float]").forEach((el) => {
        const amp = parseFloat(el.dataset.float) || 14;
        gsap.to(el, { y: amp, duration: 2.6 + Math.random(), repeat: -1, yoyo: true, ease: "sine.inOut", delay: Math.random() });
      });
    }

    // Marquee infinito
    const track = document.querySelector("[data-marquee]");
    if (track && !reduced) {
      gsap.to(track, { xPercent: -50, duration: 26, ease: "none", repeat: -1 });
    }

    // Contadores
    if (hasST) {
      document.querySelectorAll(".stat__num").forEach((el) => {
        const target = parseFloat(el.dataset.count) || 0;
        const suffix = el.dataset.suffix || "";
        const o = { v: 0 };
        gsap.to(o, {
          v: target, duration: 1.8, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => { el.textContent = Math.round(o.v) + suffix; }
        });
      });
    }

    // Ensamblaje del bol por scroll (sistema de partículas)
    initBowlAssembly();

    // Sección cinematográfica vertical "el bol que cobra vida"
    initCine();

    // Hero: refresco tras cargar imágenes
    if (hasST) window.addEventListener("load", () => ST.refresh());
  }

  /* ----------------------------------------------------------
     7. Intro del hero (tras preloader)
     ---------------------------------------------------------- */
  function heroIntro() {
    const title = document.querySelector(".hero__title");
    if (!hasGSAP || reduced) {
      if (title) title.classList.add("is-done");
      document.querySelectorAll(".hero [data-reveal]").forEach((e) => e.classList.add("is-in"));
      return;
    }
    const gsap = window.gsap;
    const lines = document.querySelectorAll(".hero__title [data-split]");
    const allChars = [];
    lines.forEach((l) => splitChars(l).forEach((c) => { c.style.display = "inline-block"; c.style.transform = "translateY(110%)"; allChars.push(c); }));
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(allChars, { y: 0, transform: "translateY(0%)", duration: 1.0, stagger: 0.025 })
      .add(() => { if (title) title.classList.add("is-done"); });
  }

  /* ----------------------------------------------------------
     8. Ensamblaje del bol — partículas que entran en espiral
        (girasol/phyllotaxis) y se forman al hacer scroll, y
        al final se resuelven en la foto nítida.
     ---------------------------------------------------------- */
  function initBowlAssembly() {
    const canvas = document.getElementById("bowl-canvas");
    const img = document.querySelector(".hero__img--fallback");
    const hero = document.getElementById("hero");
    if (!canvas || !img || !hero) return;

    const ST = window.ScrollTrigger;
    // Solo en escritorio con motion permitido; si no, se queda la foto estática.
    const enable = !reduced && hasGSAP && typeof ST !== "undefined" && window.innerWidth >= 1024;
    if (!enable) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0, H = 0, step = 10, particles = [], progress = 0, ready = false, started = false;
    const PIVOT_X = 0.56, PIVOT_Y = 0.5;

    const source = new Image();
    source.decoding = "async";

    function build() {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);

      // Pintar la foto en "cover" con object-position 60% 50% y muestrear.
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const octx = off.getContext("2d");
      const ir = source.width / source.height, cr = W / H;
      let dw, dh, dx, dy;
      if (ir > cr) { dh = H; dw = H * ir; dx = (W - dw) * 0.6; dy = 0; }
      else { dw = W; dh = W / ir; dx = 0; dy = (H - dh) * 0.5; }
      octx.drawImage(source, dx, dy, dw, dh);

      let data;
      try { data = octx.getImageData(0, 0, W, H).data; }
      catch (e) { canvas.style.display = "none"; return; } // imagen "tainted": deja la foto

      step = Math.max(6, Math.round(Math.sqrt((W * H) / 8500)));
      const cx = W * PIVOT_X, cy = H * PIVOT_Y;
      const maxR = Math.hypot(W, H) * 0.62;
      const golden = Math.PI * (3 - Math.sqrt(5));

      const pts = [];
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const idx = (y * W + x) * 4;
          if (data[idx + 3] < 28) continue;
          pts.push(x, y, data[idx], data[idx + 1], data[idx + 2], data[idx + 3]);
        }
      }
      const N = pts.length / 6;
      particles = new Array(N);
      for (let k = 0; k < N; k++) {
        const o = k * 6;
        const x = pts[o], y = pts[o + 1];
        // Inicio: espiral de girasol (phyllotaxis) alrededor del bol.
        const sa = k * golden;
        const sr = maxR * Math.sqrt((k + 1) / N) * 1.05;
        const sx = cx + Math.cos(sa) * sr;
        const sy = cy + Math.sin(sa) * sr * 0.92;
        const startA = Math.atan2(sy - cy, sx - cx);
        const startR = Math.hypot(sx - cx, sy - cy);
        const ta = Math.atan2(y - cy, x - cx);
        const tr = Math.hypot(x - cx, y - cy);
        let dA = ta - startA;
        while (dA > Math.PI) dA -= Math.PI * 2;
        while (dA < -Math.PI) dA += Math.PI * 2;
        const delay = Math.min(0.55, (tr / maxR) * 0.6); // florece de dentro hacia fuera
        particles[k] = { r: pts[o + 2], g: pts[o + 3], b: pts[o + 4], a: pts[o + 5], startA, startR, ta, tr, dA, delay };
      }
      ready = true;
      canvas.style.opacity = "1";
      draw();
      if (ST) ST.refresh();
    }

    function draw() {
      if (!ready) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cx = W * PIVOT_X, cy = H * PIVOT_Y, s = step, e = progress, swirl = 0.9;
      for (let k = 0, n = particles.length; k < n; k++) {
        const p = particles[k];
        let lt = (e - p.delay) / (1 - p.delay);
        lt = lt < 0 ? 0 : lt > 1 ? 1 : lt;
        const t = ease(lt);
        const R = p.startR + (p.tr - p.startR) * t;
        const A = p.startA + p.dA * t + swirl * Math.sin(Math.PI * t);
        ctx.globalAlpha = (p.a / 255) * (0.34 + 0.66 * t);
        ctx.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
        ctx.fillRect(cx + Math.cos(A) * R, cy + Math.sin(A) * R, s, s);
      }
      ctx.globalAlpha = 1;
    }

    function setProgress(v) {
      progress = v;
      // La foto nítida emerge al final (cubre el mosaico).
      const f = Math.max(0, Math.min(1, (v - 0.82) / 0.18));
      img.style.opacity = String(f);
      if (v < 0.999) draw();
    }

    function startSystem() {
      if (started || !source.naturalWidth) return;
      started = true;
      build();
      img.style.opacity = "0";
      setProgress(0);
      ST.create({
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => setProgress(self.progress)
      });
      ST.refresh();
    }

    source.onload = startSystem;
    source.onerror = () => { canvas.style.display = "none"; };
    source.src = img.currentSrc || img.getAttribute("src");
    if (source.complete && source.naturalWidth) startSystem();

    let rT;
    window.addEventListener("resize", () => {
      clearTimeout(rT);
      rT = setTimeout(() => { if (started && source.naturalWidth) { build(); setProgress(progress); } }, 220);
    });
  }

  /* ----------------------------------------------------------
     9. Sección cinematográfica vertical: destellos que orbitan,
        vapor, rayos de luz y el bol formándose al hacer scroll.
        Si pones un clip IA en el <video>, se usa ese.
     ---------------------------------------------------------- */
  function initCine() {
    document.querySelectorAll("[data-cine]").forEach(setupCine);
  }

  function setupCine(cine) {
    const img = cine.querySelector(".cine__img");
    const rays = cine.querySelector(".cine__rays");
    const canvas = cine.querySelector(".cine__spark");
    const vid = cine.querySelector(".cine__video");
    const milk = cine.querySelector(".cine__milk");
    const splash = cine.querySelector(".cine__splash");
    const ST = window.ScrollTrigger;

    // ¿Hay clip IA? -> úsalo y salta el efecto nativo.
    if (vid && (vid.getAttribute("src") || vid.dataset.src)) {
      if (vid.dataset.src && !vid.getAttribute("src")) vid.src = vid.dataset.src;
      cine.classList.add("has-video");
      const tryPlay = () => vid.play().catch(() => {});
      tryPlay();
      if (ST) ST.create({ trigger: cine, start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? tryPlay() : vid.pause()) });
      return;
    }

    if (reduced || !hasGSAP || typeof ST === "undefined" || !canvas) {
      if (img) img.style.clipPath = "none";
      if (milk) milk.style.clipPath = "none";
      if (rays) rays.style.opacity = "0.45";
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) { if (img) img.style.clipPath = "none"; return; }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0, H = 0, sparks = [], prog = 0, inView = false, raf = null, rt = null;

    function resize() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const N = Math.min(260, Math.round((W * H) / 2400));
      sparks = [];
      for (let i = 0; i < N; i++) {
        const hue = Math.random();
        sparks.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.6 + 0.4,
          vy: Math.random() * 0.5 + 0.18,
          ph: Math.random() * Math.PI * 2,
          tw: Math.random() * 0.045 + 0.012,
          col: hue < 0.55 ? "28,255,117" : hue < 0.82 ? "232,212,150" : "255,255,255"
        });
      }
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.52, cy = H * 0.46;
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        s.y -= s.vy * (0.5 + prog);
        s.ph += s.tw;
        if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W; }
        // leve atracción hacia el centro al formarse
        s.x += (cx - s.x) * 0.0015 * prog;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(s.ph));
        const a = tw * (0.12 + 0.88 * prog);
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + s.col + "," + a.toFixed(3) + ")";
        ctx.arc(s.x, s.y, s.r * (0.6 + prog * 0.9), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() { if (!inView) { raf = null; return; } draw(); raf = requestAnimationFrame(loop); }

    resize();
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 200); });

    // Formación atada al scroll
    ST.create({
      trigger: cine,
      start: "top 85%",
      end: "center 42%",
      scrub: 0.6,
      onUpdate: (self) => {
        prog = self.progress;
        if (img) {
          img.style.clipPath = "circle(" + (8 + prog * 126) + "% at 52% 46%)";
          img.style.transform = "scale(" + (1.12 - prog * 0.12) + ")";
        }
        if (rays) rays.style.opacity = (prog * 0.85).toFixed(3);
        // La leche se vierte en el primer ~72% del recorrido; luego el impacto brilla
        const mp = Math.min(1, prog / 0.72);
        if (milk) milk.style.clipPath = "inset(0 0 " + (100 - mp * 100).toFixed(1) + "% 0)";
        if (splash) splash.style.opacity = (mp * 0.85).toFixed(3);
      }
    });
    // Ciclo de vida del rAF de destellos mientras la sección es visible
    ST.create({
      trigger: cine, start: "top bottom", end: "bottom top",
      onToggle: (self) => { inView = self.isActive; if (inView && !raf) loop(); }
    });
  }

  /* ----------------------------------------------------------
     Boot
     ---------------------------------------------------------- */
  initAurora();
  initCursor();
  initMagnetic();
  initTilt();

  // Salvavidas: nunca dejar el preloader pegado
  const safety = setTimeout(() => {
    const pre = document.getElementById("preloader");
    if (pre && pre.style.display !== "none") { pre.style.display = "none"; }
  }, 4000);

  runPreloader(() => {
    clearTimeout(safety);
    initMotion();
    heroIntro();
  });
})();
