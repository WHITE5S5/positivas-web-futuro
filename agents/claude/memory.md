# Claude — Memoria del proyecto positivas-web-futuro

Última actualización: 2026-06-06

## Contexto del proyecto
Web de storytelling por scroll para la marca **POSITIVAS** (bowls saludables).
Stack: HTML + CSS + JS vanilla, servidor Python (`serve.py`).
Animación principal en `ritual-cinema.js`: órbita de frutas → leche laminar → convergencia → aterrizaje en bol → ascenso al centro.

## Estado actual (2026-06-06)
- Órbita ✅ funciona — no tocar
- Leche laminar ✅ funciona — no tocar
- Storytelling / copy ✅ — no tocar
- **Bug activo:** frutas no aterrizan dentro del bol — caen desplazadas a la derecha

## Bug diagnosticado: sistema de coordenadas mixto
- El bol final usa **coordenadas viewport** (pantalla)
- Las frutas usan **coordenadas del escenario** (stage lógico 860×900)
- Al converger, los dos sistemas no coinciden → desfase visual

**Solución acordada:**
1. Mantener bol en coordenadas del escenario
2. Frutas aterrizan en coordenadas del escenario (sin conversión)
3. Después: mover el `stageInner` completo para centrar el bol en viewport
4. Nunca teletransportar el bol entre sistemas de coordenadas

**Referencia de coordenadas (ritual-cinema.js):**
- Escenario lógico: 860×900
- Centro de leche: `milkX=640, milkY=438`
- Bol en stage-local ≈ `(619, 576)` (offset +189/+126 sobre centro de celda)
- `stageInner` escala con `stageScale`, posición con `translate(-50%,-50%)`

## Guardarraíles (acordados con el usuario)
- ❌ NO tocar la órbita
- ❌ NO tocar la leche
- ❌ NO tocar el storytelling / copy / headline
- ❌ NO rehacer la animación desde cero
- ✅ SOLO corregir: aterrizaje final de frutas + ascenso del bol al centro (easing, timing, escala)

## Asset pendiente
- `brand/ritual.mp4` — clip fotorrealista del bol (generar con Hailuo/Kling/Runway)
- Prompt ya preparado en `AI-PROMPT.md`
- Cuando esté: añadir `src="brand/ritual.mp4"` al `<video>` en `index.html` sección `#ritual`

## Notas de colaboración con Codex
- Codex trabaja en la misma carpeta — ver `agents/codex/memory.md`
- Log compartido de cambios: `agents/CHANGELOG.md`
- Cualquier cambio estructural acordarlo antes de tocar los guardarraíles

## Errores cometidos (no repetir)
*(vacío — ir añadiendo)*
