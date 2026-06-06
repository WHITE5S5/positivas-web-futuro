/* ============================================================================
   RITUAL SCROLL · POSITIVAS  (port vanilla de components/ritual-scroll.tsx)
   Pilar de leche vivo + 16 frutas orbitando en doble hélice que se asientan
   en el bowl al hacer scroll. Sin dependencias. Imágenes reales (ritual-assets).
   ========================================================================== */
(function () {
  "use strict";

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (v) => v * v * (3 - 2 * v);
  const A = "brand/ritual-assets/";

  const FRUIT = [
    { src: A + "fruit-strawberry.png", w: 116, h: 128 },
    { src: A + "fruit-blueberry.png", w: 68, h: 64 },
    { src: A + "fruit-raspberry.png", w: 92, h: 88 },
    { src: A + "fruit-banana.png", w: 96, h: 96 },
    { src: A + "fruit-kiwi.png", w: 118, h: 80 },
    { src: A + "fruit-almond.png", w: 72, h: 62 },
    { src: A + "fruit-oats.png", w: 122, h: 82 },
    { src: A + "fruit-chia.png", w: 84, h: 72 },
    { src: A + "fruit-strawberry.png", w: 96, h: 106 },
    { src: A + "fruit-blueberry.png", w: 58, h: 55 },
    { src: A + "fruit-raspberry.png", w: 76, h: 73 },
    { src: A + "fruit-banana.png", w: 78, h: 78 },
    { src: A + "fruit-kiwi.png", w: 94, h: 64 },
    { src: A + "fruit-almond.png", w: 58, h: 50 },
    { src: A + "fruit-oats.png", w: 98, h: 66 },
    { src: A + "fruit-chia.png", w: 68, h: 58 }
  ];
  const COUNT = FRUIT.length;

  function getFruitPose(index, p) {
    const appear = smooth(clamp((p - 0.09 - index * 0.006) / 0.12));
    const orbit = clamp((p - 0.14) / 0.46);
    const contract = smooth(clamp((p - 0.58) / 0.22));
    const settle = smooth(clamp((p - 0.71) / 0.08));  // frutas COMPLETAMENTE gone en p=0.79
    const milkX = 640, milkY = 438;
    const baseAngle = (index / COUNT) * Math.PI * 2;
    const angle = baseAngle + p * Math.PI * 6.8;
    const depth = Math.sin(angle);
    const radius = lerp(300, 188, orbit);
    const helixY = milkY - 335 + (index / (COUNT - 1)) * 670 + Math.sin(angle) * 38;
    const helixX = milkX + Math.cos(angle) * radius;
    const mouthRow = index % 8;
    const mouthLane = index > 7 ? 1 : 0;
    // Centro en x=619 (72% de 860 = posición real del bol), rango ±140
    const bowlCX = 619;
    const mouthX = bowlCX - 140 + mouthRow * 40 + (mouthLane ? 10 : 0);
    // y≈540 = dentro del bol (centro del bol en y=576, apertura superior)
    const mouthY = 540 + mouthLane * 28 + Math.sin(mouthRow * 0.7) * 14;
    const x = lerp(helixX, mouthX, contract);
    const y = lerp(helixY, mouthY, contract);
    const scale = lerp(0.62 + (depth + 1) * 0.16, 0.20 + (index % 3) * 0.02, settle);
    const opacity = appear * lerp(0.92, 0, settle);
    const rotate = (angle * 180) / Math.PI + p * 220;
    const blur = Math.abs(depth) * (1 - contract) * 5;
    const z = Math.round(30 + depth * 18 + index);
    return { x, y, scale, opacity, rotate, blur, z, depth };
  }

  function init() {
    const section = document.getElementById("ritual-cinema");
    if (!section) return;
    const sticky = section.querySelector(".rc__sticky");
    const stageInner = section.querySelector(".rc__stage-inner");
    const fruitsBox = section.querySelector(".rc__fruits");
    const milk = section.querySelector(".rc__milk");
    const bowl = section.querySelector(".rc__bowl");
    const bowlFilled = section.querySelector(".rc__bowl-filled");
    const copy = section.querySelector(".rc__copy");
    const badge = section.querySelector(".rc__badge");
    const bar = section.querySelector(".rc__progressbar");
    const guide = section.querySelector(".rc__guide");
    const bowlShadow = section.querySelector(".rc__bowlshadow");
    const keylight = section.querySelector(".rc__keylight");
    const scrollhint = section.querySelector(".rc__scrollhint");
    const flash = section.querySelector(".rc__flash");
    const finaleCopy = section.querySelector(".rc__finale-copy");
    if (!sticky || !stageInner || !fruitsBox || !milk) return;

    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // crear 16 frutas
    const fruitEls = FRUIT.map((f) => {
      const im = document.createElement("img");
      im.src = f.src; im.alt = ""; im.setAttribute("aria-hidden", "true");
      im.className = "rc__fruit";
      im.style.width = f.w + "px"; im.style.height = f.h + "px";
      fruitsBox.appendChild(im);
      return im;
    });

    // escala del escenario (coordenadas lógicas 860×900) para encajar en su celda
    let stageScale = 1;
    function fitStage() {
      const cell = stageInner.parentElement.getBoundingClientRect();
      stageScale = Math.min(cell.width / 860, cell.height / 900, 1.08);
      stageInner.style.transform = "translate(-50%, -50%) scale(" + stageScale.toFixed(4) + ")";
    }

    let progress = 0;
    function readProgress() {
      const total = section.offsetHeight - window.innerHeight;
      const top = section.getBoundingClientRect().top;
      progress = total > 0 ? clamp(-top / total, 0, 1) : 0;
    }

    function apply() {
      readProgress();
      const p = progress;

      // ── leche (pilar que fluye, una sola imagen, sin saltos) ──
      milk.style.width = lerp(188, 62, smooth(clamp((p - 0.56) / 0.28))) + "px";
      milk.style.height = lerp(1420, 330, smooth(clamp((p - 0.54) / 0.34))) + "px";
      milk.style.top = lerp(-315, 520, smooth(clamp((p - 0.56) / 0.3))) + "px";
      // leche desaparece rápido: va a 0 justo cuando el flash está al 50%
      milk.style.opacity = (p > 0.72 ? clamp(1 - (p - 0.72) / 0.08) : 1).toFixed(3);

      // ── frutas ──
      for (let i = 0; i < fruitEls.length; i++) {
        const pose = getFruitPose(i, p);
        const el = fruitEls[i];
        // durante settle, frutas bajan a z<65 → debajo del flash (z:65)
        const sz = smooth(clamp((p - 0.71) / 0.08));
        el.style.zIndex = sz > 0.05 ? Math.min(pose.z, 55) : pose.z;
        el.style.opacity = pose.opacity.toFixed(3);
        // Iluminación por profundidad: delante = más brillo/saturación + glow; detrás = apagado + blur
        const d = pose.depth;
        const bright = (0.72 + (d + 1) * 0.26).toFixed(2);
        const sat = (0.82 + (d + 1) * 0.14).toFixed(2);
        let f = (pose.blur > 0.4 ? "blur(" + pose.blur.toFixed(1) + "px) " : "") + "brightness(" + bright + ") saturate(" + sat + ")";
        if (d > 0) f += " drop-shadow(0 " + Math.round(7 + d * 12) + "px " + Math.round(11 + d * 12) + "px rgba(0,0,0,0.42))";
        if (d > 0.45) f += " drop-shadow(0 0 " + Math.round(7 * d) + "px rgba(190,255,170,0.4))";
        el.style.filter = f;
        el.style.transform =
          "translate3d(" + pose.x.toFixed(1) + "px," + pose.y.toFixed(1) + "px,0) translate(-50%,-50%) scale(" + pose.scale.toFixed(3) + ") rotate(" + pose.rotate.toFixed(1) + "deg)";
      }

      // ── final: la fruta ATERRIZA en el bol (en el escenario, alineada) y
      //    luego el escenario se desplaza para llevar el bol al CENTRO ──
      // flash sólido (sin blend mode): cubre TODO lo que hay debajo (z<65) en p=0.79-0.81
      // el bol (z:68) ya está por encima → aparece DESPUÉS del pico del flash
      const fl = smooth(clamp(1 - Math.abs(p - 0.795) / 0.035));
      if (flash) {
        flash.style.opacity = fl.toFixed(3);
        flash.style.transform = "translate(-50%,-50%) scale(" + (0.1 + fl * 1.9).toFixed(3) + ")";
      }
      // bol aparece SOLO cuando frutas y leche ya desaparecieron (p≥0.81)
      // gap de ~0.02 entre "frutas gone" (0.79) y "bol aparece" (0.81) cubierto por el flash
      const finalBowl = smooth(clamp((p - 0.81) / 0.09));
      const rise = smooth(clamp((p - 0.89) / 0.11));
      if (bowlFilled) {
        bowlFilled.style.opacity = finalBowl.toFixed(3);
        bowlFilled.style.transform = "translate(-50%,-50%) scale(" + (lerp(1.06, 1, finalBowl) * lerp(1, 1.13, rise)).toFixed(3) + ")";
      }
      if (bowlShadow) bowlShadow.style.opacity = (finalBowl * 0.55).toFixed(3);
      // desplazar el ESCENARIO para centrar el bol (bol en stage-local 619,576)
      const cell = stageInner.parentElement.getBoundingClientRect();
      const restX = cell.left + cell.width / 2 + 189 * stageScale;
      const restY = cell.top + cell.height / 2 + 126 * stageScale;
      const TX = (window.innerWidth * 0.5 - restX) * rise;
      const TY = (window.innerHeight * 0.43 - restY) * rise;
      stageInner.style.transform = "translate(" + TX.toFixed(1) + "px," + TY.toFixed(1) + "px) translate(-50%,-50%) scale(" + stageScale.toFixed(4) + ")";
      // remate centrado (titular + CTA)
      if (finaleCopy) {
        const fc = smooth(clamp((p - 0.93) / 0.07));
        finaleCopy.style.opacity = fc.toFixed(3);
        finaleCopy.style.transform = "translate(-50%," + lerp(22, 0, fc).toFixed(1) + "px)";
      }

      // ── copy / guía / badge / barra ──
      if (copy) {
        copy.style.transform = "translateY(" + lerp(0, -36, smooth(clamp((p - 0.28) / 0.5))).toFixed(1) + "px)";
        copy.style.opacity = lerp(1, 0.08, smooth(clamp((p - 0.78) / 0.16))).toFixed(3);
      }
      if (guide) guide.style.opacity = lerp(0.42, 0, finalBowl).toFixed(3);
      if (badge) {
        badge.style.opacity = finalBowl.toFixed(3);
        badge.style.transform = "translateX(-50%) translateY(" + lerp(24, 0, finalBowl).toFixed(1) + "px)";
      }
      if (bar) bar.style.width = (p * 100).toFixed(2) + "%";

      // luz clave (foco que crece con la órbita) + pista de scroll
      const orbitL = clamp((p - 0.14) / 0.46);
      if (keylight) {
        keylight.style.left = lerp(72, 54, rise) + "%";
        keylight.style.opacity = Math.min(0.95, lerp(0.3, 0.62, orbitL) + finalBowl * 0.3 + rise * 0.12).toFixed(3);
        keylight.style.transform = "translate(-50%,-50%) scale(" + (0.9 + orbitL * 0.22 + finalBowl * 0.18 + rise * 0.12).toFixed(3) + ")";
      }
      if (scrollhint) scrollhint.style.opacity = clamp(1 - p * 16).toFixed(3);
    }

    if (reduced) {
      // estado final estático: bol centrado + remate
      if (bowlFilled) { bowlFilled.style.left = "50%"; bowlFilled.style.top = "46%"; bowlFilled.style.opacity = "1"; bowlFilled.style.transform = "translate(-50%,-50%) scale(1.05)"; }
      if (finaleCopy) finaleCopy.style.opacity = "1";
      fitStage();
      return;
    }

    let raf = null, visible = false;
    function loop() { if (!visible) { raf = null; return; } apply(); raf = requestAnimationFrame(loop); }

    fitStage();
    window.addEventListener("resize", fitStage);
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); });
    }, { threshold: 0 });
    io.observe(sticky);
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.__ritualScroll = { init };
})();
