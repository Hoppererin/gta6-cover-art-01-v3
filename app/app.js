/* Vice Heat — Cover Studio.
 * One render path: drawCover(ctx, W, H, state) powers the live preview AND every
 * PNG export, so screenshots always match exports. All art is drawn on canvas
 * (retro sun, palms, skyline); lettering uses system fonts only. Offline. */
'use strict';

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------------- grades: canvas filter + overlay wash per panel ---------------- */
const GRADES = {
  'vice-sunset': { label: 'Vice Sunset', filter: 'saturate(1.35) contrast(1.12) brightness(1.02)',
    sky: ['#2b1055', '#ff5e62', '#ff9a3d'], wash: ['rgba(255,94,98,.28)', 'rgba(255,154,61,.12)'], blend: 'soft-light',
    swatch: 'linear-gradient(135deg,#2b1055,#ff5e62 55%,#ff9a3d)' },
  'neon-nights': { label: 'Neon Nights', filter: 'saturate(1.6) contrast(1.15)',
    sky: ['#0b0221', '#7b2ff7', '#00e5c7'], wash: ['rgba(123,47,247,.34)', 'rgba(0,229,199,.14)'], blend: 'overlay',
    swatch: 'linear-gradient(135deg,#0b0221,#7b2ff7 55%,#00e5c7)' },
  'golden-hour': { label: 'Golden Hour', filter: 'saturate(1.25) contrast(1.05) brightness(1.06) sepia(.22)',
    sky: ['#3a1c00', '#ff8c1a', '#ffd76a'], wash: ['rgba(255,180,60,.30)', 'rgba(255,215,106,.10)'], blend: 'soft-light',
    swatch: 'linear-gradient(135deg,#3a1c00,#ff8c1a 55%,#ffd76a)' },
  'noir-drive': { label: 'Noir Drive', filter: 'grayscale(.92) contrast(1.35) brightness(.94)',
    sky: ['#050505', '#1c1c28', '#4a4a63'], wash: ['rgba(20,20,40,.40)', 'rgba(120,120,160,.10)'], blend: 'overlay',
    swatch: 'linear-gradient(135deg,#050505,#1c1c28 55%,#8a8aa3)' },
  'vice-pink': { label: 'Vice Pink', filter: 'saturate(1.45) contrast(1.08) hue-rotate(-12deg)',
    sky: ['#3d0a3d', '#ff2e88', '#ff8ac2'], wash: ['rgba(255,46,136,.30)', 'rgba(255,138,194,.12)'], blend: 'soft-light',
    swatch: 'linear-gradient(135deg,#3d0a3d,#ff2e88 55%,#ff8ac2)' },
  'teal-heat': { label: 'Teal Heat', filter: 'saturate(1.4) contrast(1.1)',
    sky: ['#022a2e', '#00b3a6', '#ffd76a'], wash: ['rgba(0,179,166,.30)', 'rgba(255,215,106,.14)'], blend: 'overlay',
    swatch: 'linear-gradient(135deg,#022a2e,#00b3a6 55%,#ffd76a)' },
  'palm-dusk': { label: 'Palm Dusk', filter: 'saturate(1.3) contrast(1.12) brightness(.96)',
    sky: ['#160a2e', '#5b2a86', '#ff7e5f'], wash: ['rgba(91,42,134,.34)', 'rgba(255,126,95,.16)'], blend: 'soft-light',
    swatch: 'linear-gradient(135deg,#160a2e,#5b2a86 55%,#ff7e5f)' },
  'cotton-candy': { label: 'Cotton Candy', filter: 'saturate(1.2) contrast(1.02) brightness(1.07)',
    sky: ['#2a1a4a', '#ff9ad5', '#8ad8ff'], wash: ['rgba(255,154,213,.26)', 'rgba(138,216,255,.16)'], blend: 'soft-light',
    swatch: 'linear-gradient(135deg,#2a1a4a,#ff9ad5 55%,#8ad8ff)' },
};

/* ---------------- layouts: panel rects as fractions of the cover ---------------- */
const LAYOUTS = {
  solo:  { label: 'Solo',   rects: [[0, 0, 1, 1]], hero: 0 },
  duo:   { label: 'Duo',    rects: [[0, 0, .56, 1], [.56, 0, .44, 1]], hero: 0 },
  trio:  { label: 'Trio',   rects: [[0, 0, .62, 1], [.62, 0, .38, .5], [.62, .5, .38, .5]], hero: 0 },
  quad:  { label: 'Quad',   rects: [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]], hero: 0 },
  epic:  { label: 'Epic 7', rects: [[0, 0, .58, 1], [.58, 0, .21, 1 / 3], [.79, 0, .21, 1 / 3],
                                     [.58, 1 / 3, .21, 1 / 3], [.79, 1 / 3, .21, 1 / 3],
                                     [.58, 2 / 3, .21, 1 / 3], [.79, 2 / 3, .21, 1 / 3]], hero: 0 },
};

const DEFAULT_TAGS = ['THE DRIVER', 'THE FIXER', 'THE LOOKOUT', 'THE INSIDE MAN', 'THE GETAWAY', 'THE HUSTLER', 'THE WHEELMAN'];

const PRESETS = [
  { name: 'Neon Duo', layout: 'duo', grade: 'neon-nights', title: 'NEON HEAT', tagline: 'THE CITY NEVER SLEEPS' },
  { name: 'Golden Trio', layout: 'trio', grade: 'golden-hour', title: 'VICE HEAT', tagline: 'ONE CITY · EVERY ANGLE' },
  { name: 'Noir Solo', layout: 'solo', grade: 'noir-drive', title: 'MIDNIGHT DRIVE', tagline: 'NO WAY BACK' },
  { name: 'Epic Sunset', layout: 'epic', grade: 'vice-sunset', title: 'VICE HEAT', tagline: 'SEVEN STORIES · ONE SUNSET' },
  { name: 'Cotton Quad', layout: 'quad', grade: 'cotton-candy', title: 'PALM CREW', tagline: 'FOUR WAYS IN · ONE WAY OUT' },
];

/* ---------------- state ---------------- */
const state = {
  title: 'VICE HEAT',
  tagline: 'ONE CITY · EVERY ANGLE',
  billing: 'A VICE HEAT PRODUCTION · STARRING YOU',
  layout: 'trio',
  grade: 'vice-sunset',
  photos: [],          // {img, name}[]
  panels: [],          // {photo, zoom, ox, oy, tag}
  selected: 0,
};

function resetPanels() {
  const n = LAYOUTS[state.layout].rects.length;
  const old = state.panels;
  state.panels = [];
  for (let i = 0; i < n; i++) {
    const prev = old[i];
    state.panels.push(prev || {
      photo: state.photos.length ? i % state.photos.length : -1,
      zoom: 1.15, ox: 0, oy: -0.12, tag: DEFAULT_TAGS[i % DEFAULT_TAGS.length],
    });
  }
  state.selected = clamp(state.selected, 0, n - 1);
}

/* ---------------- image loading ---------------- */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load ' + src));
    img.src = src;
  });
}
async function loadSamples() {
  const names = ['boulevard.jpg', 'neon.jpg', 'pier.jpg'];
  for (const n of names) {
    try {
      const img = await loadImage('samples/' + n);
      if (!state.photos.some((p) => p.name === n)) state.photos.push({ img, name: n });
    } catch (e) { /* sample missing: panel falls back to drawn art */ }
  }
  state.panels.forEach((p, i) => { if (p.photo < 0 && state.photos.length) p.photo = i % state.photos.length; });
}
function loadUserFiles(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  let done = 0;
  list.forEach((f) => {
    const url = URL.createObjectURL(f);
    loadImage(url).then((img) => {
      state.photos.push({ img, name: f.name });
      if (++done === list.length) { syncPhotoUI(); render(); }
    }).catch(() => { if (++done === list.length) { syncPhotoUI(); render(); } });
  });
}

/* deterministic pseudo-random for skyline windows */
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------------- canvas-drawn original art ---------------- */
function drawSun(ctx, cx, cy, r, skyTop) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffe27a'); g.addColorStop(.45, '#ff9a3d'); g.addColorStop(1, '#ff2e88');
  ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // retro horizontal stripe gaps, widening toward the bottom
  ctx.fillStyle = skyTop;
  let y = cy + r * 0.05, h = r * 0.03;
  while (y < cy + r) { ctx.fillRect(cx - r, y, r * 2, h); y += h + r * 0.16; h *= 1.45; }
  ctx.restore();
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -55, 26, -96); ctx.stroke();
  ctx.lineWidth = 5;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.08 - (i * Math.PI) / 7.4;
    const tx = 26 + Math.cos(a) * 52, ty = -96 + Math.sin(a) * 30 + 14;
    ctx.beginPath(); ctx.moveTo(26, -96);
    ctx.quadraticCurveTo(26 + Math.cos(a) * 30, -96 + Math.sin(a) * 8, tx, ty + 16);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(26, -96, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawSkyline(ctx, x, y, w, h, seed) {
  const r = rng(seed);
  ctx.save(); ctx.fillStyle = '#12081f';
  let bx = x;
  while (bx < x + w - 8) {
    const bw = 14 + r() * (w * 0.09), bh = h * (0.35 + r() * 0.6);
    ctx.fillRect(bx, y + h - bh, bw, bh);
    ctx.fillStyle = 'rgba(255,214,106,.85)';
    for (let k = 0; k < Math.floor(bw * bh / 260); k++) {
      if (r() > 0.45) ctx.fillRect(bx + 3 + r() * (bw - 7), y + h - bh + 4 + r() * (bh - 9), 2.5, 3.5);
    }
    ctx.fillStyle = '#12081f';
    bx += bw + 3 + r() * 6;
  }
  ctx.restore();
}

function drawArtPanel(ctx, x, y, w, h, seed) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#2b1055'); g.addColorStop(.55, '#ff5e62'); g.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  drawSun(ctx, x + w * 0.5, y + h * 0.42, Math.min(w, h) * 0.30, '#ff5e62');
  drawSkyline(ctx, x, y + h * 0.62, w, h * 0.38, seed);
  drawPalm(ctx, x + w * 0.12, y + h * 0.98, Math.min(w, h) / 260, '#12081f');
  drawPalm(ctx, x + w * 0.9, y + h * 0.98, Math.min(w, h) / 320, '#0d0518');
}

/* ---------------- photo panel with face-aware crop ---------------- */
function drawPhotoPanel(ctx, x, y, w, h, photo, panel, grade) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (photo) {
    const iw = photo.img.naturalWidth, ih = photo.img.naturalHeight;
    const scale = Math.max(w / iw, h / ih) * panel.zoom;
    const dw = iw * scale, dh = ih * scale;
    // default crop biased to the upper third (face region); ox/oy shift it
    const cx = (dw - w) / 2 - panel.ox * w * 0.6;
    const cy = (dh - h) / 2 + panel.oy * h * 0.6;
    ctx.filter = grade.filter;
    ctx.drawImage(photo.img, x - cx, y - cy, dw, dh);
    ctx.filter = 'none';
  } else {
    drawArtPanel(ctx, x, y, w, h, 7);
  }
  // grade wash
  const wg = ctx.createLinearGradient(x, y, x + w, y + h);
  wg.addColorStop(0, grade.wash[0]); wg.addColorStop(1, grade.wash[1]);
  ctx.globalCompositeOperation = grade.blend;
  ctx.fillStyle = wg; ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  // subtle vignette so lettering pops
  const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,2,24,.38)');
  ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/* ---------------- chrome 3D striped title (offscreen, then stamped) ---------------- */
function drawChromeTitle(ctx, text, cx, topY, size, W) {
  const pad = size * 0.55;
  const tmp = document.createElement('canvas');
  const tctx = tmp.getContext('2d');
  const font = `italic 900 ${size}px "Arial Black", Impact, "Segoe UI", sans-serif`;
  tctx.font = font;
  const tw = Math.ceil(tctx.measureText(text).width);
  tmp.width = tw + pad * 2; tmp.height = Math.ceil(size * 1.9);
  tctx.font = font; tctx.textBaseline = 'middle'; tctx.textAlign = 'left';
  const bx = pad, by = tmp.height * 0.46;
  // extruded 3D offset layers
  const layers = 7;
  for (let i = layers; i >= 1; i--) {
    tctx.fillStyle = i % 2 ? '#2a0a4d' : '#160527';
    tctx.fillText(text, bx + i * size * 0.028, by + i * size * 0.03);
  }
  // chrome gradient fill
  const g = tctx.createLinearGradient(0, by - size * 0.55, 0, by + size * 0.55);
  g.addColorStop(0, '#ffffff'); g.addColorStop(.28, '#ffe27a'); g.addColorStop(.5, '#ff9a3d');
  g.addColorStop(.68, '#ff2e88'); g.addColorStop(.88, '#7b2ff7'); g.addColorStop(1, '#00e5c7');
  tctx.fillStyle = g; tctx.fillText(text, bx, by);
  // horizontal retro stripes clipped to the letters
  tctx.globalCompositeOperation = 'source-atop';
  tctx.fillStyle = 'rgba(255,255,255,.34)';
  for (let y = by - size * 0.5; y < by + size * 0.6; y += size * 0.17) tctx.fillRect(0, y, tmp.width, size * 0.045);
  tctx.fillStyle = 'rgba(20,4,40,.20)';
  for (let y = by - size * 0.42; y < by + size * 0.6; y += size * 0.17) tctx.fillRect(0, y, tmp.width, size * 0.03);
  tctx.globalCompositeOperation = 'source-over';
  // heavy outline
  tctx.lineWidth = Math.max(3, size * 0.055); tctx.strokeStyle = '#160527'; tctx.lineJoin = 'round';
  tctx.strokeText(text, bx, by);
  tctx.lineWidth = Math.max(1.5, size * 0.014); tctx.strokeStyle = 'rgba(255,255,255,.85)';
  tctx.strokeText(text, bx, by);
  // stamp slanted onto the cover
  ctx.save();
  ctx.translate(cx, topY + tmp.height / 2);
  ctx.rotate(-0.035);
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = size * 0.16; ctx.shadowOffsetY = size * 0.05;
  const dw = Math.min(tmp.width, W * 0.96), dh = dw * (tmp.height / tmp.width);
  ctx.drawImage(tmp, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawTagPill(ctx, text, x, y, h, fg, bg) {
  ctx.save();
  ctx.font = `900 ${h * 0.52}px "Arial Black", Impact, sans-serif`;
  const w = ctx.measureText(text).width + h * 1.1;
  ctx.fillStyle = bg;
  ctx.beginPath();
  const r = h / 2;
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.fill();
  ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(text, x + h * 0.55, y + h / 2 + 1);
  ctx.restore();
  return w;
}

function drawSeal(ctx, cx, cy, r) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = '#f5c542';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#160527';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f5c542'; ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f5c542'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${r * 0.34}px "Arial Black", Impact, sans-serif`;
  ctx.fillText('★', 0, -r * 0.30);
  ctx.font = `900 ${r * 0.26}px "Arial Black", Impact, sans-serif`;
  ctx.fillText('VICE', 0, r * 0.02);
  ctx.fillText('HEAT', 0, r * 0.30);
  ctx.font = `700 ${r * 0.13}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText('EST. 2026', 0, r * 0.55);
  ctx.restore();
}

/* ---------------- the one render path: preview AND export ---------------- */
function drawCover(canvas, W, H, st) {
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[st.grade] || GRADES['vice-sunset'];
  const layout = LAYOUTS[st.layout] || LAYOUTS.trio;
  const u = W / 1080;                       // scale unit
  const gap = Math.max(3, 7 * u);
  const billH = H * 0.075;                  // billing strip height (tags stay above it)

  // sky backdrop
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, grade.sky[0]); sky.addColorStop(.55, grade.sky[1]); sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  drawSun(ctx, W * 0.72, H * 0.30, Math.min(W, H) * 0.16, grade.sky[0]);
  drawPalm(ctx, W * 0.04, H * 0.62, Math.min(W, H) / 900, 'rgba(18,8,31,.5)');
  drawPalm(ctx, W * 0.97, H * 0.58, Math.min(W, H) / 1100, 'rgba(18,8,31,.45)');

  // panels (non-hero first so the hero pops over them)
  const rects = layout.rects.map(([fx, fy, fw, fh]) => [fx * W, fy * H, fw * W, fh * H]);
  const heroIdx = layout.hero;
  const drawPanel = (i) => {
    let [x, y, w, h] = rects[i];
    x += gap / 2; y += gap / 2; w -= gap; h -= gap;
    const panel = st.panels[i] || { photo: -1, zoom: 1.15, ox: 0, oy: -0.12, tag: DEFAULT_TAGS[i] };
    const photo = panel.photo >= 0 ? st.photos[panel.photo] : null;
    ctx.save();
    if (i === heroIdx) {
      // POP-OUT HERO: rotated, enlarged, thick white outline + drop shadow
      const cx = x + w / 2, cy = y + h / 2;
      ctx.translate(cx, cy); ctx.rotate(-0.022); ctx.scale(1.045, 1.045); ctx.translate(-cx, -cy);
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 26 * u; ctx.shadowOffsetX = 10 * u; ctx.shadowOffsetY = 14 * u;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 5 * u, y - 5 * u, w + 10 * u, h + 10 * u);
      ctx.shadowColor = 'transparent';
    }
    drawPhotoPanel(ctx, x, y, w, h, photo, panel, grade);
    // panel border
    ctx.strokeStyle = i === heroIdx ? '#ffffff' : 'rgba(255,255,255,.85)';
    ctx.lineWidth = (i === heroIdx ? 5 : 2.5) * u;
    ctx.strokeRect(x, y, w, h);
    // cast / role tag pill — collected for a second pass so tags always sit on top
    // of the title ribbon, billing strip and seal, and stay above the billing strip
    const tagH = Math.max(20, (i === heroIdx ? 44 : 32) * u);
    const tagY = Math.min(y + h - tagH - 10 * u, H - billH - tagH - 8 * u);
    tagQueue.push({ text: (panel.tag || DEFAULT_TAGS[i]).toUpperCase(), x: x + 10 * u, y: tagY, h: tagH, hero: i === heroIdx });
    ctx.restore();
  };
  const tagQueue = [];
  rects.forEach((_, i) => { if (i !== heroIdx) drawPanel(i); });
  drawPanel(heroIdx);

  // chrome 3D title over the art
  const titleSize = clamp(Math.min(W, H) * 0.115, 60, 190);
  drawChromeTitle(ctx, (st.title || 'VICE HEAT').toUpperCase(), W / 2, H * 0.045, titleSize, W);

  // tagline ribbon under the title
  const tagSize = Math.max(15, 26 * u);
  ctx.save();
  ctx.font = `700 ${tagSize}px "Segoe UI", Arial, sans-serif`;
  const tw = ctx.measureText(st.tagline).width;
  const ribbonH = tagSize * 1.9, ribbonY = H * 0.045 + titleSize * 1.95;
  ctx.fillStyle = 'rgba(22,5,39,.82)';
  ctx.fillRect(W / 2 - tw / 2 - 18 * u, ribbonY, tw + 36 * u, ribbonH);
  ctx.fillStyle = '#ffe27a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(st.tagline.toUpperCase(), W / 2, ribbonY + ribbonH / 2 + 1);
  ctx.restore();

  // callout starburst, top right
  const cs = Math.max(34, 64 * u), ccx = W - cs * 0.9, ccy = H * 0.16;
  ctx.save(); ctx.translate(ccx, ccy); ctx.rotate(0.12);
  ctx.fillStyle = '#ff2e88';
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, r = i % 2 ? cs * 0.62 : cs;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${cs * 0.30}px "Arial Black", Impact, sans-serif`;
  ctx.fillText('NEW', 0, -cs * 0.14);
  ctx.font = `900 ${cs * 0.26}px "Arial Black", Impact, sans-serif`;
  ctx.fillText('2026', 0, cs * 0.20);
  ctx.restore();

  // billing strip + seal
  ctx.fillStyle = 'rgba(10,2,20,.88)'; ctx.fillRect(0, H - billH, W, billH);
  ctx.fillStyle = '#f5efff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `600 ${Math.max(11, 17 * u)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText((st.billing || '').toUpperCase(), W / 2, H - billH * 0.62);
  ctx.font = `400 ${Math.max(9, 13 * u)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = 'rgba(245,239,255,.65)';
  ctx.fillText('VICE HEAT STUDIO · MADE OFFLINE · PHOTOS NEVER LEAVE YOUR MACHINE', W / 2, H - billH * 0.24);
  drawSeal(ctx, W - Math.max(44, 74 * u), H - billH - Math.max(40, 62 * u), Math.max(34, 56 * u));

  // thin gold frame
  ctx.strokeStyle = '#f5c542'; ctx.lineWidth = Math.max(3, 5 * u);
  ctx.strokeRect(4 * u, 4 * u, W - 8 * u, H - 8 * u);
  ctx.strokeStyle = 'rgba(245,197,66,.5)'; ctx.lineWidth = Math.max(1, 1.5 * u);
  ctx.strokeRect(12 * u, 12 * u, W - 24 * u, H - 24 * u);

  // second pass: cast tags on top of everything, hero tag last
  tagQueue.sort((a, b) => (a.hero ? 1 : 0) - (b.hero ? 1 : 0));
  for (const t of tagQueue) {
    drawTagPill(ctx, t.text, t.x, t.y, t.h,
      t.hero ? '#160527' : '#fff',
      t.hero ? '#f5c542' : 'rgba(22,5,39,.82)');
  }
}

/* ---------------- export ---------------- */
function exportPNG(sizeStr) {
  const [W, H] = sizeStr.split('x').map(Number);
  const c = document.createElement('canvas');
  drawCover(c, W, H, state);
  c.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-heat-cover-${sizeStr}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

/* ---------------- editor ---------------- */
const preview = $('#preview');
let previewRects = [];

function render() {
  const layout = LAYOUTS[state.layout];
  // editor preview is a 4:5 portrait frame; exports render at their exact size
  const W = 900, H = 1125;
  drawCover(preview, W, H, state);
  previewRects = layout.rects.map(([fx, fy, fw2, fh2]) => {
    const r = preview.getBoundingClientRect();
    return { x: fx * r.width, y: fy * r.height, w: fw2 * r.width, h: fh2 * r.height };
  });
  $('#stageCaption').textContent =
    `${layout.label} · ${GRADES[state.grade].label} · ${W} × ${H} preview (exports at full size)`;
  $('#photoCount').textContent = `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded`;
  syncPanelUI();
}

function syncPhotoUI() {
  const sel = $('#photoSelect');
  sel.innerHTML = state.photos.map((p, i) => `<option value="${i}">${i + 1}. ${p.name}</option>`).join('') ||
    '<option value="-1">No photos yet</option>';
  const p = state.panels[state.selected];
  if (p) sel.value = String(p.photo);
}
function syncPanelUI() {
  const p = state.panels[state.selected];
  if (!p) return;
  $('#panelId').textContent = `Panel ${state.selected + 1}${state.selected === LAYOUTS[state.layout].hero ? ' — HERO (pops out)' : ''}`;
  $('#tagInput').value = p.tag || '';
  $('#zoomInput').value = p.zoom;
  $('#zoomVal').textContent = p.zoom.toFixed(2) + '×';
  syncPhotoUI();
}

function buildControls() {
  // layout buttons with mini thumbnails
  $('#layoutGrid').innerHTML = Object.entries(LAYOUTS).map(([key, L]) => {
    const rects = L.rects.map(([x, y, w, h], i) =>
      `<rect x="${(x * 100).toFixed(1)}%" y="${(y * 100).toFixed(1)}%" width="${(w * 100).toFixed(1)}%" height="${(h * 100).toFixed(1)}%" fill="${i === L.hero ? '#ff2e88' : '#7b2ff7'}" stroke="#fff" stroke-width="1"/>`).join('');
    return `<button type="button" class="layout-btn" data-layout="${key}" title="${L.label}"><svg class="thumb" viewBox="0 0 100 100" preserveAspectRatio="none">${rects}</svg><span class="lbl">${L.label}</span></button>`;
  }).join('');
  $('#layoutGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-layout]'); if (!b) return;
    state.layout = b.dataset.layout; resetPanels();
    document.querySelectorAll('.layout-btn').forEach((x) => x.classList.toggle('active', x === b));
    render();
  });
  // presets
  $('#presetRow').innerHTML = PRESETS.map((p, i) =>
    `<button type="button" class="btn preset-btn" data-preset="${i}">✦ ${p.name}</button>`).join('');
  $('#presetRow').addEventListener('click', (e) => {
    const b = e.target.closest('[data-preset]'); if (!b) return;
    const p = PRESETS[+b.dataset.preset];
    state.layout = p.layout; state.grade = p.grade; state.title = p.title; state.tagline = p.tagline;
    $('#titleInput').value = p.title; $('#taglineInput').value = p.tagline;
    resetPanels(); syncGradeUI(); syncLayoutUI(); render();
  });
  // grades
  $('#gradeGrid').innerHTML = Object.entries(GRADES).map(([key, g]) =>
    `<button type="button" class="grade-btn" data-grade="${key}"><span class="sw" style="background:${g.swatch}"></span><span class="lbl">${g.label}</span></button>`).join('');
  $('#gradeGrid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-grade]'); if (!b) return;
    state.grade = b.dataset.grade; syncGradeUI(); render();
  });
  document.querySelectorAll('.btn-export').forEach((b) =>
    b.addEventListener('click', () => exportPNG(b.dataset.size)));
}
function syncGradeUI() {
  document.querySelectorAll('.grade-btn').forEach((x) => x.classList.toggle('active', x.dataset.grade === state.grade));
}
function syncLayoutUI() {
  document.querySelectorAll('.layout-btn').forEach((x) => x.classList.toggle('active', x.dataset.layout === state.layout));
}

function bindEditor() {
  $('#titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('#taglineInput').addEventListener('input', (e) => { state.tagline = e.target.value; render(); });
  $('#billingInput').addEventListener('input', (e) => { state.billing = e.target.value; render(); });
  $('#tagInput').addEventListener('input', (e) => { state.panels[state.selected].tag = e.target.value; render(); });
  $('#photoSelect').addEventListener('change', (e) => { state.panels[state.selected].photo = +e.target.value; render(); });
  $('#zoomInput').addEventListener('input', (e) => { state.panels[state.selected].zoom = +e.target.value; render(); });
  $('#focusFaceBtn').addEventListener('click', () => { const p = state.panels[state.selected]; p.oy = -0.22; p.zoom = Math.max(p.zoom, 1.3); render(); });
  $('#centerBtn').addEventListener('click', () => { const p = state.panels[state.selected]; p.ox = 0; p.oy = 0; render(); });
  $('#cyclePhotoBtn').addEventListener('click', () => {
    const p = state.panels[state.selected];
    if (state.photos.length) { p.photo = (p.photo + 1) % state.photos.length; render(); }
  });
  $('#fileInput').addEventListener('change', (e) => { loadUserFiles(e.target.files); e.target.value = ''; });

  // drag & drop anywhere
  let dragDepth = 0;
  window.addEventListener('dragenter', (e) => { e.preventDefault(); if (++dragDepth === 1) $('#dropOverlay').hidden = false; });
  window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('#dropOverlay').hidden = true; } });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault(); dragDepth = 0; $('#dropOverlay').hidden = true;
    if (e.dataTransfer.files.length) loadUserFiles(e.dataTransfer.files);
  });

  // panel picking + drag-to-reposition + wheel zoom + dblclick focus face
  let drag = null;
  const pos = (e) => { const r = preview.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; };
  preview.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    const idx = previewRects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
    if (idx < 0) return;
    state.selected = idx; syncPanelUI();
    drag = { x: p.x, y: p.y, ox: state.panels[idx].ox, oy: state.panels[idx].oy, w: p.w, h: p.h };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pos(e), panel = state.panels[state.selected];
    panel.ox = clamp(drag.ox - (p.x - drag.x) / drag.w * 1.6, -0.5, 0.5);
    panel.oy = clamp(drag.oy - (p.y - drag.y) / drag.h * 1.6, -0.5, 0.5);
    render();
  });
  preview.addEventListener('pointerup', () => { drag = null; });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[state.selected];
    panel.zoom = clamp(panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93), 1, 2.5);
    render();
  }, { passive: false });
  preview.addEventListener('dblclick', () => {
    const p = state.panels[state.selected]; p.oy = -0.22; p.zoom = Math.max(p.zoom, 1.3); render();
  });
}

/* ---------------- shot mode (for screenshots) + boot ---------------- */
window.__viceheat = { state, GRADES, LAYOUTS, drawCover, exportPNG, render };

async function boot() {
  const q = new URLSearchParams(location.search);
  resetPanels();
  buildControls(); bindEditor(); syncGradeUI(); syncLayoutUI();
  await loadSamples();
  resetPanels();

  if (q.get('mode') === 'cover') {
    // full-viewport cover render: ?mode=cover&size=1080x1350&layout=trio&grade=vice-sunset
    const [W, H] = (q.get('size') || '1080x1350').split('x').map(Number);
    if (q.get('layout')) state.layout = q.get('layout');
    if (q.get('grade')) state.grade = q.get('grade');
    if (q.get('title')) state.title = q.get('title');
    if (q.get('tagline')) state.tagline = q.get('tagline');
    resetPanels();
    $('#app').hidden = true;
    const holder = $('#coverMode'); holder.hidden = false;
    drawCover($('#coverCanvas'), W, H, state);
    document.title = 'READY';
    return;
  }
  if (q.get('demo') === '1') {
    state.layout = 'trio'; state.grade = 'vice-sunset';
    state.title = 'VICE HEAT'; state.tagline = 'ONE CITY · EVERY ANGLE';
    resetPanels(); syncGradeUI(); syncLayoutUI();
  }
  render();
  document.title = 'READY';
}

window.addEventListener('error', (e) => { document.title = 'ERROR: ' + (e.message || e.error); });
boot();
