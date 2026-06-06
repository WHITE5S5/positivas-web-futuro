# positivas-web-futuro — Ritual cinemático (landing bowls)

Web de storytelling por scroll. Stack: HTML + CSS + JS vanilla, servido por `serve.py` (ThreadingHTTPServer).

## Archivos clave
- `ritual-cinema.js` — lógica del ritual (órbita, leche, convergencia, aterrizaje, ascenso). **Aquí está el bug del aterrizaje.**
- `index.html`, `styles.css`, `main.js`, `serve.py`, `brand/ritual-assets/` (imágenes).

## GUARDARRAÍLES (no tocar)
- ❌ NO tocar la **órbita**.
- ❌ NO tocar la **leche**.
- ❌ NO tocar el **storytelling** / copy / headline.
- ❌ NO rehacer la animación desde cero.
- ✅ SOLO corregir: **aterrizaje final de las frutas** + **ascenso del bol al centro** (easing, timing, escala).

## Bug a resolver
Las frutas no aterrizan dentro del bol: caen desplazadas a la derecha.
Causa diagnosticada: el **bol final usa coordenadas de pantalla (viewport)** y las **frutas usan coordenadas del escenario (stage)**; al converger dejan de coincidir.
Solución: mantener el bol en coordenadas del escenario, que las frutas aterricen ahí, y luego desplazar el escenario completo (transformación stage→viewport) para centrar el bol. El bol nunca se teletransporta entre sistemas de coordenadas.

## Sistema de coordenadas (referencia rápida, de ritual-cinema.js)
- Escenario lógico: **860×900**, centro de leche en `milkX=640, milkY=438`.
- `stageInner` se escala con `stageScale` y se posiciona con `translate(-50%,-50%)`.
- Bol en stage-local ≈ `(619, 576)` (ver `restX/restY` usan offset +189/+126 sobre el centro de celda).

## Errores a no repetir
(vacío — añadir aquí cada error cometido: qué pasó + regla)
