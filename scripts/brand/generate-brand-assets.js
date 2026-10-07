const opentype = require("opentype.js");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

function toArrayBuffer(buffer) {
  const ab = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return ab;
}

const cormorantBuf = fs.readFileSync(path.join(__dirname, "fonts/CormorantGaramond-600.ttf"));
const cormorant = opentype.parse(toArrayBuffer(cormorantBuf));

const interBuf = fs.readFileSync(path.join(__dirname, "fonts/Inter-400.ttf"));
const inter = opentype.parse(toArrayBuffer(interBuf));

function getCenteredTextPath(font, text, centerX, baselineY, fontSize, letterSpacing) {
  const scale = (1 / font.unitsPerEm) * fontSize;
  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    totalWidth += (glyph.advanceWidth * scale) + letterSpacing;
  }
  totalWidth -= letterSpacing;

  const startX = centerX - (totalWidth / 2);
  let fullPath = new opentype.Path();
  let x = startX;

  for (let i = 0; i < text.length; i++) {
    const glyph = font.charToGlyph(text[i]);
    const glyphPath = glyph.getPath(x, baselineY, fontSize);
    fullPath.commands.push(...glyphPath.commands);
    x += (glyph.advanceWidth * scale) + letterSpacing;
  }

  return {
    pathData: fullPath.toPathData(2),
    startX: Number(startX.toFixed(2)),
    endX: Number((startX + totalWidth).toFixed(2)),
    totalWidth: Number(totalWidth.toFixed(2)),
    centerX
  };
}

// -------------------------------------------------------------
// 1. ai-bootcamp-mark.svg (200x200)
// -------------------------------------------------------------
const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" fill="none" role="img" aria-label="AI Bootcamp Mark">
  <defs>
    <circle id="dot" cx="100" cy="42.0" r="7.0" fill="#FF7315" />
  </defs>
  <!-- Outer ring: circle r=92, no fill, gold stroke 1.8 -->
  <circle cx="100" cy="100" r="92" stroke="#FF7315" stroke-width="1.8" />
  <!-- Inner ring: circle r=76, no fill, gold stroke 1, opacity 0.6 -->
  <circle cx="100" cy="100" r="76" stroke="#FF7315" stroke-width="1" opacity="0.6" />
  <!-- 12 dots: placed at r=84 from center every 30 degrees, starting at top (100,16) -->
  <use href="#dot" xlink:href="#dot" />
  <use href="#dot" xlink:href="#dot" transform="rotate(60 100 100)" />
  <use href="#dot" xlink:href="#dot" transform="rotate(120 100 100)" />
  <use href="#dot" xlink:href="#dot" transform="rotate(180 100 100)" />
  <use href="#dot" xlink:href="#dot" transform="rotate(240 100 100)" />
  <use href="#dot" xlink:href="#dot" transform="rotate(300 100 100)" />
  <!-- Secondary star (line only): transformed with rotate(45 100 100), no fill, gold stroke 1.6, round linejoin -->
  <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" opacity="0.45" stroke="#FF7315" stroke-width="1.6" stroke-linejoin="round" fill="none" /><path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="#FF7315" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
  <!-- Main star (solid gold) -->
  <circle cx="100" cy="100" r="13" fill="#FF7315" />
  <!-- Center gem: circle r=4.5 at 100,100, fill #0B0B0D, gold stroke 1.4 -->
  <circle cx="100" cy="100" r="5.5" fill="#0B0B0D" />
</svg>`;

// -------------------------------------------------------------
// 2. ai-bootcamp-logo-stacked.svg (viewBox 0 0 360 380, dark rounded bg)
// -------------------------------------------------------------
const stackedThe = getCenteredTextPath(cormorant, "AI", 180, 229, 15, 3.5);
const stackedMs = getCenteredTextPath(cormorant, "BOOTCAMP", 180, 269, 28, 4.2);
const stackedTag = getCenteredTextPath(inter, "LEARN · BUILD · SHIP AI", 180, 311, 10.5, 2.8);

const stackedSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 360 380" fill="none" role="img" aria-label="AI Bootcamp Logo">
  <defs>
    <circle id="stacked-dot" cx="100" cy="42.0" r="7.0" fill="#FF7315" />
  </defs>
  <!-- Dark rounded background -->
  <rect width="360" height="380" rx="16" fill="#0B0B0D" />
  <!-- Centered Emblem (scale 0.7, center 180, 130) -->
  <g transform="translate(180, 130) scale(0.7) translate(-100, -100)">
    <circle cx="100" cy="100" r="92" stroke="#FF7315" stroke-width="1.8" />
    <circle cx="100" cy="100" r="76" stroke="#FF7315" stroke-width="1" opacity="0.6" />
    <use href="#stacked-dot" xlink:href="#stacked-dot" />
    <use href="#stacked-dot" xlink:href="#stacked-dot" transform="rotate(60 100 100)" />
    <use href="#stacked-dot" xlink:href="#stacked-dot" transform="rotate(120 100 100)" />
    <use href="#stacked-dot" xlink:href="#stacked-dot" transform="rotate(180 100 100)" />
    <use href="#stacked-dot" xlink:href="#stacked-dot" transform="rotate(240 100 100)" />
    <use href="#stacked-dot" xlink:href="#stacked-dot" transform="rotate(300 100 100)" />
    <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" stroke="#FF7315" stroke-width="1.6" stroke-linejoin="round" opacity="0.45" fill="none" />
      <path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="#FF7315" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="100" cy="100" r="13" fill="#FF7315" />
      <circle cx="100" cy="100" r="5.5" fill="#0B0B0D" />
  </g>

  <!-- Wordmark Section -->
  <g id="wordmark">
    <!-- Flanked THE -->
    <line x1="118" y1="224" x2="152" y2="224" stroke="#FF7315" stroke-width="1" />
    <path d="${stackedThe.pathData}" fill="#FF7315" />
    <line x1="208" y1="224" x2="242" y2="224" stroke="#FF7315" stroke-width="1" />

    <!-- BOOTCAMP -->
    <path d="${stackedMs.pathData}" fill="#FF7315" />

    <!-- Optional Tagline Group (Easy to toggle or remove) -->
    <g id="tagline-group">
      <!-- Divider with centered diamond -->
      <line x1="90" y1="291" x2="270" y2="291" stroke="#FF7315" stroke-width="0.8" opacity="0.6" />
      <polygon points="180,288.5 182.5,291 180,293.5 177.5,291" fill="#FF7315" />
      <!-- Tagline text in Inter -->
      <path d="${stackedTag.pathData}" fill="#A8A399" />
    </g>
  </g>
</svg>`;

// -------------------------------------------------------------
// 3. ai-bootcamp-logo-horizontal.svg (viewBox 0 0 500 120, transparent bg)
// Heavier strokes (about 2.4 and 1.4) so it stays crisp at 40px tall
// -------------------------------------------------------------
const horizThe = getCenteredTextPath(cormorant, "AI", 315, 36, 14, 3.2);
const horizMs = getCenteredTextPath(cormorant, "BOOTCAMP", 315, 67, 27, 3.8);
const horizTag = getCenteredTextPath(inter, "LEARN · BUILD · SHIP AI", 315, 99, 10, 2.5);

const horizSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 120" fill="none" role="img" aria-label="AI Bootcamp Logo">
  <defs>
    <circle id="horiz-dot" cx="65" cy="31" r="3.5" fill="#FF7315" />
  </defs>
  <!-- Mark on the left (center 65,60, heavier strokes 2.4 and 1.4 for crisp 40px rendering) -->
  <g id="mark">
    <!-- Outer ring: r=46, stroke 2.4 -->
    <circle cx="65" cy="60" r="46" stroke="#FF7315" stroke-width="2.4" />
    <!-- Inner ring: r=38, stroke 1.4, opacity 0.6 -->
    <circle cx="65" cy="60" r="38" stroke="#FF7315" stroke-width="1.4" opacity="0.6" />
    <!-- 12 dots at r=42 every 30 deg -->
    <use href="#horiz-dot" xlink:href="#horiz-dot" />
    <use href="#horiz-dot" xlink:href="#horiz-dot" transform="rotate(60 65 60)" />
    <use href="#horiz-dot" xlink:href="#horiz-dot" transform="rotate(120 65 60)" />
    <use href="#horiz-dot" xlink:href="#horiz-dot" transform="rotate(180 65 60)" />
    <use href="#horiz-dot" xlink:href="#horiz-dot" transform="rotate(240 65 60)" />
    <use href="#horiz-dot" xlink:href="#horiz-dot" transform="rotate(300 65 60)" />
    <!-- Secondary star (line only, scaled 0.5, stroke 1.8) -->
    <g transform="translate(65, 60) scale(0.5) translate(-100, -100)">
      <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" stroke="#FF7315" stroke-width="3.2" stroke-linejoin="round" opacity="0.45" fill="none" />
      <path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="#FF7315" stroke-width="3.2" stroke-linecap="round" />
      <circle cx="100" cy="100" r="13" fill="#FF7315" />
      <circle cx="100" cy="100" r="5.5" fill="#0B0B0D" />
    </g>
  </g>

  <!-- Wordmark on the right -->
  <g id="wordmark">
    <!-- Flanked THE -->
    <line x1="255" y1="31.5" x2="290" y2="31.5" stroke="#FF7315" stroke-width="1" />
    <path d="${horizThe.pathData}" fill="#FF7315" />
    <line x1="340" y1="31.5" x2="375" y2="31.5" stroke="#FF7315" stroke-width="1" />

    <!-- BOOTCAMP -->
    <path d="${horizMs.pathData}" fill="#FF7315" />

    <!-- Optional Tagline Group -->
    <g id="tagline-group">
      <line x1="230" y1="82" x2="400" y2="82" stroke="#FF7315" stroke-width="0.8" opacity="0.6" />
      <polygon points="315,79.5 317.5,82 315,84.5 312.5,82" fill="#FF7315" />
      <path d="${horizTag.pathData}" fill="#A8A399" />
    </g>
  </g>
</svg>`;

// -------------------------------------------------------------
// 4. favicon.svg (Thickened strokes for 16px crispness)
// -------------------------------------------------------------
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" fill="none" role="img" aria-label="AI Bootcamp Favicon">
  <defs>
    <circle id="fav-dot" cx="100" cy="42.0" r="7.0" fill="#FF7315" />
  </defs>
  <!-- Outer ring: thickened stroke 4.0 -->
  <circle cx="100" cy="100" r="92" stroke="#FF7315" stroke-width="4.0" />
  <!-- Inner ring: stroke 2.4, opacity 0.7 -->
  <circle cx="100" cy="100" r="76" stroke="#FF7315" stroke-width="2.4" opacity="0.7" />
  <!-- 12 dots: enlarged for 16px render -->
  <use href="#fav-dot" xlink:href="#fav-dot" />
  <use href="#fav-dot" xlink:href="#fav-dot" transform="rotate(60 100 100)" />
  <use href="#fav-dot" xlink:href="#fav-dot" transform="rotate(120 100 100)" />
  <use href="#fav-dot" xlink:href="#fav-dot" transform="rotate(180 100 100)" />
  <use href="#fav-dot" xlink:href="#fav-dot" transform="rotate(240 100 100)" />
  <use href="#fav-dot" xlink:href="#fav-dot" transform="rotate(300 100 100)" />
  <!-- Secondary star: stroke 3.2 -->
  <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" opacity="0.45" stroke="#FF7315" stroke-width="3.2" stroke-linejoin="round" fill="none" /><path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="#FF7315" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" />
  <!-- Main star -->
  <circle cx="100" cy="100" r="13" fill="#FF7315" />
  <!-- Center gem -->
  <circle cx="100" cy="100" r="5.5" fill="#0B0B0D" />
</svg>`;

// -------------------------------------------------------------
// App Icon SVG (Mark with #0B0B0D background and 12% padding)
// ViewBox 200x200, padding 12% means mark is scaled to (1 - 0.24) = 0.76 => 152x152 centered
// -------------------------------------------------------------
const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" fill="none">
  <rect width="200" height="200" fill="#0B0B0D" />
  <g transform="translate(100, 100) scale(0.76) translate(-100, -100)">
    <defs>
      <circle id="app-dot" cx="100" cy="42.0" r="7.0" fill="#FF7315" />
    </defs>
    <circle cx="100" cy="100" r="92" stroke="#FF7315" stroke-width="2.4" />
    <circle cx="100" cy="100" r="76" stroke="#FF7315" stroke-width="1.4" opacity="0.65" />
    <use href="#app-dot" xlink:href="#app-dot" />
    <use href="#app-dot" xlink:href="#app-dot" transform="rotate(60 100 100)" />
    <use href="#app-dot" xlink:href="#app-dot" transform="rotate(120 100 100)" />
    <use href="#app-dot" xlink:href="#app-dot" transform="rotate(180 100 100)" />
    <use href="#app-dot" xlink:href="#app-dot" transform="rotate(240 100 100)" />
    <use href="#app-dot" xlink:href="#app-dot" transform="rotate(300 100 100)" />
    <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" opacity="0.45" stroke="#FF7315" stroke-width="2.2" stroke-linejoin="round" fill="none" /><path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="#FF7315" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />
    <circle cx="100" cy="100" r="13" fill="#FF7315" />
    <circle cx="100" cy="100" r="5.5" fill="#0B0B0D" />
  </g>
</svg>`;

// -------------------------------------------------------------
// 6. OG Image (1200x630, stacked logo on --black with soft gold radial glow)
// -------------------------------------------------------------
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 630" fill="none">
  <defs>
    <!-- Soft low-opacity gold radial glow behind the mark -->
    <radialGradient id="og-glow" cx="50%" cy="40%" r="45%">
      <stop offset="0%" stop-color="#FF7315" stop-opacity="0.18" />
      <stop offset="50%" stop-color="#FF7315" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#0B0B0D" stop-opacity="0" />
    </radialGradient>
    <circle id="og-dot" cx="100" cy="42.0" r="7.0" fill="#FF7315" />
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0B0B0D" />

  <!-- Radial Glow behind the emblem -->
  <circle cx="600" cy="225" r="280" fill="url(#og-glow)" />

  <!-- Stacked Logo Centered at 600, 315 -->
  <!-- Scale factor = 1.35. Native width=360, height=380. Scaled w=486, h=513 -->
  <g transform="translate(600, 315) scale(1.35) translate(-180, -190)">
    <!-- Emblem -->
    <g transform="translate(180, 130) scale(0.7) translate(-100, -100)">
      <circle cx="100" cy="100" r="92" stroke="#FF7315" stroke-width="1.8" />
      <circle cx="100" cy="100" r="76" stroke="#FF7315" stroke-width="1" opacity="0.6" />
      <use href="#og-dot" xlink:href="#og-dot" />
      <use href="#og-dot" xlink:href="#og-dot" transform="rotate(60 100 100)" />
      <use href="#og-dot" xlink:href="#og-dot" transform="rotate(120 100 100)" />
      <use href="#og-dot" xlink:href="#og-dot" transform="rotate(180 100 100)" />
      <use href="#og-dot" xlink:href="#og-dot" transform="rotate(240 100 100)" />
      <use href="#og-dot" xlink:href="#og-dot" transform="rotate(300 100 100)" />
      <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" stroke="#FF7315" stroke-width="1.6" stroke-linejoin="round" opacity="0.45" fill="none" />
      <path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="#FF7315" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="100" cy="100" r="13" fill="#FF7315" />
      <circle cx="100" cy="100" r="5.5" fill="#0B0B0D" />
    </g>

    <!-- Wordmark -->
    <g id="og-wordmark">
      <line x1="118" y1="224" x2="152" y2="224" stroke="#FF7315" stroke-width="1" />
      <path d="${stackedThe.pathData}" fill="#FF7315" />
      <line x1="208" y1="224" x2="242" y2="224" stroke="#FF7315" stroke-width="1" />
      <path d="${stackedMs.pathData}" fill="#FF7315" />
      <line x1="90" y1="291" x2="270" y2="291" stroke="#FF7315" stroke-width="0.8" opacity="0.6" />
      <polygon points="180,288.5 182.5,291 180,293.5 177.5,291" fill="#FF7315" />
      <path d="${stackedTag.pathData}" fill="#A8A399" />
    </g>
  </g>
</svg>`;

// -------------------------------------------------------------
// Glow Variants Implementation
// -------------------------------------------------------------

// 1. ai-bootcamp-mark-glow.svg (viewBox="-50 -50 300 300")
const markGlowSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-50 -50 300 300" fill="none" role="img" aria-label="AI Bootcamp Mark with Glow">
  <defs>
    <!-- Ambient Halo: Center gold at 0.26 opacity, 45% stop at 0.10, fading to 0 at the edge -->
    <radialGradient id="mark-glow-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF7315" stop-opacity="0.26" />
      <stop offset="45%" stop-color="#FF7315" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#FF7315" stop-opacity="0" />
    </radialGradient>
    <!-- Star Bloom Filter: Gaussian blur stdDeviation 6, opacity 0.5 -->
    <filter id="mark-star-bloom" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
    </filter>
    <circle id="mark-glow-dot" cx="100" cy="42.0" r="7.0" fill="#FF7315" />
  </defs>

  <!-- 1. Ambient Halo Circle (r=130 from center 100,100) -->
  <circle cx="100" cy="100" r="130" fill="url(#mark-glow-halo)" />

  <!-- 2. Star Bloom: Blurred gold copy of main star directly behind solid star -->
  <circle cx="100" cy="100" r="13"
    fill="#FF7315"
    opacity="0.5"
    filter="url(#mark-star-bloom)"
  />

  <!-- 3. Rings and 12 Dots (Stay crisp and unglowed) -->
  <circle cx="100" cy="100" r="92" stroke="#FF7315" stroke-width="1.8" />
  <circle cx="100" cy="100" r="76" stroke="#FF7315" stroke-width="1.0" opacity="0.6" />
  <use href="#mark-glow-dot" xlink:href="#mark-glow-dot" />
  <use href="#mark-glow-dot" xlink:href="#mark-glow-dot" transform="rotate(60 100 100)" />
  <use href="#mark-glow-dot" xlink:href="#mark-glow-dot" transform="rotate(120 100 100)" />
  <use href="#mark-glow-dot" xlink:href="#mark-glow-dot" transform="rotate(180 100 100)" />
  <use href="#mark-glow-dot" xlink:href="#mark-glow-dot" transform="rotate(240 100 100)" />
  <use href="#mark-glow-dot" xlink:href="#mark-glow-dot" transform="rotate(300 100 100)" />

  <!-- 4. Secondary Star (Line only, rotated 45 deg) -->
  <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" opacity="0.45" stroke="#FF7315"
    stroke-width="1.6"
    stroke-linejoin="round" fill="none" /><path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="#FF7315"
    stroke-width="1.6"
    stroke-linejoin="round" stroke-linecap="round" />

  <!-- 5. Main Star (Solid Gold) -->
  <circle cx="100" cy="100" r="13"
    fill="#FF7315"
  />

  <!-- 6. Center Gem -->
  <circle cx="100" cy="100" r="5.5" fill="#0B0B0D" />
</svg>`;

// 2. ai-bootcamp-logo-stacked-glow.svg (viewBox="0 0 360 380", dark rounded bg)
const stackedGlowSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 360 380" fill="none" role="img" aria-label="AI Bootcamp Logo with Glow">
  <defs>
    <radialGradient id="stacked-glow-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF7315" stop-opacity="0.26" />
      <stop offset="45%" stop-color="#FF7315" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#FF7315" stop-opacity="0" />
    </radialGradient>
    <filter id="stacked-star-bloom" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
    </filter>
    <circle id="stacked-glow-dot" cx="100" cy="42.0" r="7.0" fill="#FF7315" />
  </defs>

  <!-- Dark rounded background -->
  <rect width="360" height="380" rx="16" fill="#0B0B0D" />

  <!-- Centered Emblem (scale 0.7, center 180, 130) -->
  <g transform="translate(180, 130) scale(0.7) translate(-100, -100)">
    <!-- 1. Ambient Halo -->
    <circle cx="100" cy="100" r="130" fill="url(#stacked-glow-halo)" />

    <!-- 2. Star Bloom -->
    <circle cx="100" cy="100" r="13"
      fill="#FF7315"
      opacity="0.5"
      filter="url(#stacked-star-bloom)"
    />

    <!-- 3. Rings & Dots -->
    <circle cx="100" cy="100" r="92" stroke="#FF7315" stroke-width="1.8" />
    <circle cx="100" cy="100" r="76" stroke="#FF7315" stroke-width="1.0" opacity="0.6" />
    <use href="#stacked-glow-dot" xlink:href="#stacked-glow-dot" />
    <use href="#stacked-glow-dot" xlink:href="#stacked-glow-dot" transform="rotate(60 100 100)" />
    <use href="#stacked-glow-dot" xlink:href="#stacked-glow-dot" transform="rotate(120 100 100)" />
    <use href="#stacked-glow-dot" xlink:href="#stacked-glow-dot" transform="rotate(180 100 100)" />
    <use href="#stacked-glow-dot" xlink:href="#stacked-glow-dot" transform="rotate(240 100 100)" />
    <use href="#stacked-glow-dot" xlink:href="#stacked-glow-dot" transform="rotate(300 100 100)" />

    <!-- 4. Secondary Star -->
    <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" opacity="0.45" stroke="#FF7315"
      stroke-width="1.6"
      stroke-linejoin="round" fill="none" /><path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="#FF7315"
      stroke-width="1.6"
      stroke-linejoin="round" stroke-linecap="round" />

    <!-- 5. Main Star -->
    <circle cx="100" cy="100" r="13"
      fill="#FF7315"
    />

    <!-- 6. Center Gem -->
    <circle cx="100" cy="100" r="5.5" fill="#0B0B0D" />
  </g>

  <!-- Wordmark Section (Unchanged, high contrast) -->
  <g id="stacked-glow-wordmark">
    <line x1="118" y1="224" x2="152" y2="224" stroke="#FF7315" stroke-width="1" />
    <path d="${stackedThe.pathData}" fill="#FF7315" />
    <line x1="208" y1="224" x2="242" y2="224" stroke="#FF7315" stroke-width="1" />
    <path d="${stackedMs.pathData}" fill="#FF7315" />
    <g id="tagline-group">
      <line x1="90" y1="291" x2="270" y2="291" stroke="#FF7315" stroke-width="0.8" opacity="0.6" />
      <polygon points="180,288.5 182.5,291 180,293.5 177.5,291" fill="#FF7315" />
      <path d="${stackedTag.pathData}" fill="#A8A399" />
    </g>
  </g>
</svg>`;

// 3. ai-bootcamp-logo-horizontal-glow.svg (viewBox="0 0 500 120", transparent bg)
// Glow behind mark only, kept within 120px height
const horizGlowSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 120" fill="none" role="img" aria-label="AI Bootcamp Logo with Glow">
  <defs>
    <!-- Halo confined to mark bounds (r=58 centered at 65,60) -->
    <radialGradient id="horiz-glow-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF7315" stop-opacity="0.26" />
      <stop offset="45%" stop-color="#FF7315" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#FF7315" stop-opacity="0" />
    </radialGradient>
    <filter id="horiz-star-bloom" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
    </filter>
    <circle id="horiz-glow-dot" cx="65" cy="31" r="3.5" fill="#FF7315" />
  </defs>

  <!-- Mark with Glow on the left -->
  <g id="horiz-glow-mark">
    <!-- 1. Ambient Halo (r=58 at 65,60 fits cleanly inside height 120) -->
    <circle cx="65" cy="60" r="58" fill="url(#horiz-glow-halo)" />

    <!-- 2. Star Bloom -->
    <g transform="translate(65, 60) scale(0.5) translate(-100, -100)">
      <circle cx="100" cy="100" r="13"
        fill="#FF7315"
        opacity="0.5"
        filter="url(#horiz-star-bloom)"
      />
    </g>

    <!-- 3. Rings & Dots -->
    <circle cx="65" cy="60" r="46" stroke="#FF7315" stroke-width="2.4" />
    <circle cx="65" cy="60" r="38" stroke="#FF7315" stroke-width="1.4" opacity="0.6" />
    <use href="#horiz-glow-dot" xlink:href="#horiz-glow-dot" />
    <use href="#horiz-glow-dot" xlink:href="#horiz-glow-dot" transform="rotate(60 65 60)" />
    <use href="#horiz-glow-dot" xlink:href="#horiz-glow-dot" transform="rotate(120 65 60)" />
    <use href="#horiz-glow-dot" xlink:href="#horiz-glow-dot" transform="rotate(180 65 60)" />
    <use href="#horiz-glow-dot" xlink:href="#horiz-glow-dot" transform="rotate(240 65 60)" />
    <use href="#horiz-glow-dot" xlink:href="#horiz-glow-dot" transform="rotate(300 65 60)" />

    <!-- 4. Secondary Star -->
    <g transform="translate(65, 60) scale(0.5) translate(-100, -100)">
      <polygon points="100,42 150.2,71 150.2,129 100,158 49.8,129 49.8,71" stroke="#FF7315" stroke-width="3.2" stroke-linejoin="round" opacity="0.45" fill="none" />
      <path d="M100 85L100 50M113 92.5L143.3 75M113 107.5L143.3 125M100 115L100 150M87 107.5L56.7 125M87 92.5L56.7 75" stroke="#FF7315" stroke-width="3.2" stroke-linecap="round" />
      <circle cx="100" cy="100" r="13" fill="#FF7315" />
      <circle cx="100" cy="100" r="5.5" fill="#0B0B0D" />
    </g>
  </g>

  <!-- Wordmark on the right (Text stays crisp and completely unglowed) -->
  <g id="horiz-glow-wordmark">
    <line x1="255" y1="31.5" x2="290" y2="31.5" stroke="#FF7315" stroke-width="1" />
    <path d="${horizThe.pathData}" fill="#FF7315" />
    <line x1="340" y1="31.5" x2="375" y2="31.5" stroke="#FF7315" stroke-width="1" />
    <path d="${horizMs.pathData}" fill="#FF7315" />
    <g id="tagline-group">
      <line x1="230" y1="82" x2="400" y2="82" stroke="#FF7315" stroke-width="0.8" opacity="0.6" />
      <polygon points="315,79.5 317.5,82 315,84.5 312.5,82" fill="#FF7315" />
      <path d="${horizTag.pathData}" fill="#A8A399" />
    </g>
  </g>
</svg>`;

// Helper function to create simple standard 32x32 ICO buffer wrapping PNG
function pngToIco(pngBuffer) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(1, 4); // 1 image

  header.writeUInt8(32, 6);   // width 32
  header.writeUInt8(32, 7);   // height 32
  header.writeUInt8(0, 8);    // colors
  header.writeUInt8(0, 9);    // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(pngBuffer.length, 14); // image size
  header.writeUInt32LE(22, 18); // offset

  return Buffer.concat([header, pngBuffer]);
}

async function run() {
  const publicBrand = path.join(__dirname, "../../public/brand");
  const publicDir = path.join(__dirname, "../../public");
  fs.mkdirSync(publicBrand, { recursive: true });

  const svgoOptions = {
    multipass: true,
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            convertPathData: {
              floatPrecision: 1,
              transformPrecision: 1,
            },
            cleanupIds: false,
          },
        },
      },
    ],
  };

  const { optimize } = require("svgo");

  function optimizeAndWrite(filePath, svgRaw) {
    const opt = optimize(svgRaw.trim(), svgoOptions);
    fs.writeFileSync(filePath, opt.data);
    return opt.data.length;
  }

  // 1. Write Flat SVGs
  const sMark = optimizeAndWrite(path.join(publicBrand, "ai-bootcamp-mark.svg"), markSvg);
  const sStacked = optimizeAndWrite(path.join(publicBrand, "ai-bootcamp-logo-stacked.svg"), stackedSvg);
  const sHoriz = optimizeAndWrite(path.join(publicBrand, "ai-bootcamp-logo-horizontal.svg"), horizSvg);
  const sFav = optimizeAndWrite(path.join(publicBrand, "favicon.svg"), faviconSvg);
  fs.copyFileSync(path.join(publicBrand, "favicon.svg"), path.join(publicDir, "favicon.svg"));

  // 2. Write Glow SVGs
  const sMarkGlow = optimizeAndWrite(path.join(publicBrand, "ai-bootcamp-mark-glow.svg"), markGlowSvg);
  const sStackedGlow = optimizeAndWrite(path.join(publicBrand, "ai-bootcamp-logo-stacked-glow.svg"), stackedGlowSvg);
  const sHorizGlow = optimizeAndWrite(path.join(publicBrand, "ai-bootcamp-logo-horizontal-glow.svg"), horizGlowSvg);

  console.log("SVGs generated and optimized:");
  console.log("- ai-bootcamp-mark.svg:", sMark, "bytes");
  console.log("- ai-bootcamp-logo-stacked.svg:", sStacked, "bytes");
  console.log("- ai-bootcamp-logo-horizontal.svg:", sHoriz, "bytes");
  console.log("- favicon.svg:", sFav, "bytes");
  console.log("- ai-bootcamp-mark-glow.svg:", sMarkGlow, "bytes");
  console.log("- ai-bootcamp-logo-stacked-glow.svg:", sStackedGlow, "bytes");
  console.log("- ai-bootcamp-logo-horizontal-glow.svg:", sHorizGlow, "bytes");

  // 3. Generate PNG and ICO assets using sharp
  const icon512 = await sharp(Buffer.from(appIconSvg))
    .resize(512, 512)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicBrand, "icon.png"), icon512);
  fs.writeFileSync(path.join(publicDir, "icon.png"), icon512);

  const appleTouch = await sharp(Buffer.from(appIconSvg))
    .resize(180, 180)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicBrand, "apple-touch-icon.png"), appleTouch);
  fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), appleTouch);

  const fav32 = await sharp(Buffer.from(appIconSvg))
    .resize(32, 32)
    .png()
    .toBuffer();
  const icoBuf = pngToIco(fav32);
  fs.writeFileSync(path.join(publicBrand, "favicon.ico"), icoBuf);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuf);

  // og-image.png with stacked glow logo
  const ogGlowSvg = ogSvg; // Already configured with radial glow
  const ogBuf = await sharp(Buffer.from(ogGlowSvg))
    .resize(1200, 630)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicBrand, "og-image.png"), ogBuf);
  fs.writeFileSync(path.join(publicDir, "og-image.png"), ogBuf);

  console.log("Raster assets generated:");
  console.log("- icon.png (512x512):", icon512.length, "bytes");
  console.log("- apple-touch-icon.png (180x180):", appleTouch.length, "bytes");
  console.log("- favicon.ico (32x32):", icoBuf.length, "bytes");
  console.log("- og-image.png (1200x630):", ogBuf.length, "bytes");
}

run().catch(console.error);
