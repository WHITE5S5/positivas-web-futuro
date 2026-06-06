# 🎬 Clip IA del bol POSITIVAS (para la sección "Ritual")

La sección vertical ya funciona con un efecto **nativo** (destellos, vapor, rayos, borde neón).
Si quieres el look **fotorrealista** del vídeo de referencia (estilo hailuoai.video), genera un
clip y enchúfalo: la web lo detecta y lo usa automáticamente.

---

## 1) Genera el clip (image-to-video)
Usa una herramienta de **imagen-a-vídeo**: **Hailuo (MiniMax)**, **Kling**, **Runway Gen-3** o **Pika**.
- **Imagen de partida:** `brand/hero-bowl.png` (tu bol real) → así sale idéntico a tu marca.
- **Formato:** vertical **9:16**, ~**5 s**, que haga **bucle suave** (loop).

### Prompt (pégalo tal cual, en inglés rinde mejor)
```
Cinematic close-up of a healthy bowl of oats, fresh berries and sliced fruit while
creamy milk pours and swirls in slow motion. Glowing emerald-green and warm golden
light particles and sparkles rise and gently orbit around the bowl, soft steam drifting
upward, subtle volumetric god rays from above. The ingredients elegantly assemble and
settle into place. Premium food commercial, shallow depth of field, dark moody emerald
background, neon-green rim light, photorealistic, high detail, smooth seamless loop.
```
**Negative / evitar:** `text, watermark, logo, hands, cutlery, distorted fruit, flicker`
**Ajustes sugeridos:** movimiento medio, cámara casi fija, 9:16, semilla con loop si está disponible.

> Consejo: genera 2-3 variantes y quédate con la que tenga el bucle más limpio.

## 2) Enchúfalo en la web (10 segundos)
1. Guarda el vídeo como **`brand/ritual.mp4`** dentro de la carpeta del proyecto.
2. En `index.html`, en la sección `#ritual`, añade el `src` al `<video>`:
```html
<video class="cine__video" data-ai-slot src="brand/ritual.mp4"
       poster="brand/hero-bowl.png" muted loop playsinline preload="metadata" aria-hidden="true"></video>
```
3. Recarga. La web detecta el `src`, **oculta el efecto nativo** y reproduce tu clip
   (con borde neón, badge y la info al lado ya integrados).

> ¿Sin `src`? No pasa nada: se queda el efecto nativo, que también queda muy bien.

## 3) (Opcional) Versión ligera para móvil
Si el clip pesa, exporta también `brand/ritual-720.mp4` (720px de alto) y úsalo;
o deja el efecto nativo en móvil (más ligero) y el vídeo solo en escritorio — te lo configuro si quieres.
