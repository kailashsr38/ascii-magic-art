/*
 * scene.js: the toolkit for hand-built picture scenes, the 192x108 square-cell
 * pieces drawn as halftone dots (meta.cell = "square", meta.look = "dots").
 *
 * A scene is a small painting. The still part is painted once into a Canvas
 * of RGB values; each frame copies it and adds what moves (birds, cloud,
 * boats, smoke, people, water falling), then `encoder` turns the RGB into the
 * text and colour layers every piece returns: each cell becomes its nearest
 * palette colour, plus a level glyph from ▁ to █ for how bright it is against
 * that colour.
 *
 * The palette is fitted to the painting itself (median cut), plus the colours
 * of anything that moves, so every scene gets the colours that matter for it.
 *
 * Motion rule for the library: real things moving, never shimmer. No twinkle,
 * no sweeping glints, no breathing brightness.
 */
import { clamp, lerp, fbm, KEYS } from "./kit.js";

export const W = 192, H = 108;

/* ── colour ─────────────────────────────────────────────────────────── */
const HX = new Map();
/** "#rrggbb" to [r, g, b], cached. */
export const hex = (h) => {
  let v = HX.get(h);
  if (!v) { v = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); HX.set(h, v); }
  return v;
};
export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** A colour from gradient stops [[0, "#hex"], [0.5, "#hex"], [1, "#hex"]] at t. */
export const ramp = (stops, t) => {
  t = clamp(t);
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) return mix(hex(stops[i - 1][1]), hex(stops[i][1]), (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1));
  }
  return hex(stops[stops.length - 1][1]);
};
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
const col = (c) => (typeof c === "string" ? hex(c) : c);

/** Point in polygon [[x, y], ...]. */
export function inPoly(x, y, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/* ── the canvas ─────────────────────────────────────────────────────── */
/**
 * RGB pixels plus a mask byte per pixel. The mask says what a pixel is (sky,
 * water, building...) so moving things can stay where they belong: birds and
 * cloud only over sky, a boat's wake only on water. Colours are "#hex" or
 * [r, g, b]; a fill colour can also be a function (x, y) => colour.
 */
export class Canvas {
  constructor(w = W, h = H) {
    this.w = w; this.h = h;
    this.rgb = new Float32Array(w * h * 3);
    this.mask = new Uint8Array(w * h);
  }
  copy(from) { this.rgb.set(from.rgb); this.mask.set(from.mask); return this; }
  put(x, y, c, m) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x, v = col(c);
    this.rgb[i * 3] = v[0]; this.rgb[i * 3 + 1] = v[1]; this.rgb[i * 3 + 2] = v[2];
    if (m !== undefined) this.mask[i] = m;
  }
  get(x, y) {
    x = clamp(Math.round(x), 0, this.w - 1); y = clamp(Math.round(y), 0, this.h - 1);
    const i = (y * this.w + x) * 3;
    return [this.rgb[i], this.rgb[i + 1], this.rgb[i + 2]];
  }
  maskAt(x, y) {
    x = Math.round(x); y = Math.round(y);
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.mask[y * this.w + x];
  }
  /** Blend colour c over the pixel by alpha a; `only` limits it to one mask id. */
  add(x, y, c, a = 1, only) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
    const i = y * this.w + x;
    if (only !== undefined && (Array.isArray(only) ? !only.includes(this.mask[i]) : this.mask[i] !== only)) return;
    const v = col(c), k = i * 3;
    a = Math.min(1, a);
    this.rgb[k] += (v[0] - this.rgb[k]) * a; this.rgb[k + 1] += (v[1] - this.rgb[k + 1]) * a; this.rgb[k + 2] += (v[2] - this.rgb[k + 2]) * a;
  }
  /** fn(x, y) returns a colour (or null to skip) for every pixel in the box. */
  each(x0, y0, x1, y1, fn, m) {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(this.h, Math.ceil(y1)); y++)
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(this.w, Math.ceil(x1)); x++) {
        const c = fn(x, y);
        if (c) this.put(x, y, c, m);
      }
    return this;
  }
  fill(fn, m) { return this.each(0, 0, this.w, this.h, fn, m); }
  rect(x0, y0, x1, y1, c, m) { return this.each(x0, y0, x1, y1, typeof c === "function" ? c : () => c, m); }
  poly(P, c, m) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const f = typeof c === "function" ? c : () => c;
    return this.each(x0, y0, x1 + 1, y1 + 1, (x, y) => (inPoly(x + 0.5, y + 0.5, P) ? f(x, y) : null), m);
  }
  ellipse(cx, cy, rx, ry, c, m) {
    const f = typeof c === "function" ? c : () => c;
    return this.each(cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, (x, y) => (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1 ? f(x, y) : null), m);
  }
  /** A thick line from (x0, y0) to (x1, y1). */
  line(x0, y0, x1, y1, c, w = 1, m) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2)), r = (w - 1) / 2;
    for (let i = 0; i <= n; i++) {
      const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n);
      for (let dy = -Math.floor(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.floor(r); dx <= Math.ceil(r); dx++) this.put(x + dx, y + dy, c, m);
    }
    return this;
  }
  /** Vertical gradient from stops over rows y0..y1 (the whole height by default). */
  sky(stops, m, y0 = 0, y1 = this.h) {
    return this.each(0, y0, this.w, y1, (x, y) => ramp(stops, (y - y0) / (y1 - y0)), m);
  }
  /** A soft light: a solid disk of radius r, falling off to nothing at r + spread. */
  glow(cx, cy, r, spread, c, a = 0.6, only) {
    const R = r + spread;
    for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r) this.add(x, y, c, 1, only);
      else if (d < R) this.add(x, y, c, a * (1 - (d - r) / spread) ** 1.6, only);
    }
    return this;
  }
  /**
   * A ridge line of hills: crest height from fractal noise, filled below with
   * top -> bottom colours. Returns the crest (y per column) for later use.
   */
  ridge({ base, amp, f = 3, seed = 1, top, bot, depth = 20, m, rough = 1, shape }) {
    const crest = new Float32Array(this.w);
    for (let x = 0; x < this.w; x++) {
      const u = x / this.w;
      const n = shape ? shape(u) : fbm(u * f, seed * 0.37, 4, seed) * 1.6 - 0.5 + Math.sin(u * 7 + seed) * 0.15 * rough;
      crest[x] = (base - amp * n) * this.h;
    }
    for (let x = 0; x < this.w; x++) for (let y = Math.max(0, Math.floor(crest[x])); y < this.h; y++) {
      this.put(x, y, mix(col(top), col(bot), clamp((y - crest[x]) / depth)), m);
    }
    return crest;
  }
  /** Mirror the rows above y0 into the rows below it (still water), darkened toward `tint`. */
  reflect(y0, y1, tint, amount = 0.35, m) {
    const t = col(tint);
    for (let y = Math.floor(y0); y < Math.min(this.h, y1); y++) {
      const sy = Math.round(2 * y0 - y - 1);
      if (sy < 0) continue;
      for (let x = 0; x < this.w; x++) {
        const s = this.get(x, sy), k = clamp(amount + ((y - y0) / (y1 - y0)) * 0.25);
        this.put(x, y, mix(s, t, k), m);
      }
    }
    return this;
  }
}

/* ── things that move ───────────────────────────────────────────────── */
/**
 * A flock crossing the sky every `period` seconds, flapping. Birds are three
 * pixels, wings up or level. dir -1 flies right to left.
 */
export function birds(cv, t, { n = 6, y = 18, period = 18, dir = -1, c = "#1a1420", only, phase = 0, spread = 1, rise = 4 } = {}) {
  const bt = (((t / period) + phase) % 1 + 1) % 1;
  const fx = dir < 0 ? lerp(cv.w + 12, -30, bt) : lerp(-30, cv.w + 12, bt);
  const fy = y + Math.sin(bt * 6) * rise;
  for (let i = 0; i < n; i++) {
    const dx = ((i % 4) * 5 + (i > 3 ? 2 : 0)) * spread * -dir, dy = (Math.floor(i / 2) * 2 + (i % 2)) * spread;
    const x = Math.round(fx + dx), yy = Math.round(fy + dy + Math.sin(t * 2 + i * 0.7)), up = Math.sin(t * 9 + i * 0.7) > 0;
    cv.add(x, yy, c, 1, only);
    cv.add(x - 1, yy + (up ? -1 : 0), c, 1, only);
    cv.add(x + 1, yy + (up ? -1 : 0), c, 1, only);
  }
}

/**
 * Long thin cloud streaks drifting sideways and wrapping. Each cloud is
 * [u (0..1 start x), len (fraction of width), v (0..1 y), thickness px, colour, speed].
 */
export function clouds(cv, t, list, only, alpha = 0.9) {
  for (const [u, len, v, thick, c, speed] of list) {
    const span = cv.w * (1 + len) + 20;
    const cx = ((((u * cv.w - t * speed * 1.6) % span) + span) % span) - cv.w * len * 0.5 - 10, cy = v * cv.h, L = len * cv.w;
    for (let y = Math.floor(cy - thick * 3); y <= cy + thick * 3; y++) for (let x = Math.floor(cx - L / 2); x < cx + L / 2; x++) {
      const along = 1 - Math.abs((x - cx) / (L / 2)), wob = Math.sin(x * 0.11 + v * 40) * thick;
      const a = clamp(along * 2) * clamp(1 - Math.abs(y - cy - wob) / (thick * 1.6 * (0.4 + along)));
      if (a > 0.05) cv.add(x, y, c, a * alpha, only);
    }
  }
}

/** Puffy cumulus: a few overlapping soft blobs, drifting. [u, v, size, colour, speed, shadow]. */
export function puffs(cv, t, list, only) {
  for (const [u, v, s, c, speed, shade] of list) {
    const span = cv.w + s * 8;
    const cx = ((((u * cv.w + t * speed) % span) + span) % span) - s * 4, cy = v * cv.h;
    for (let k = 0; k < 5; k++) {
      const bx = cx + (k - 2) * s * 0.9, by = cy - (k === 1 || k === 2 ? s * 0.45 : 0), r = s * (k === 0 || k === 4 ? 0.7 : 1);
      for (let y = Math.floor(by - r); y <= by + r * 0.6; y++) for (let x = Math.floor(bx - r * 1.4); x <= bx + r * 1.4; x++) {
        const d = Math.hypot((x - bx) / 1.4, y - by) / r;
        if (d < 1) cv.add(x, y, y > by + r * 0.15 && shade ? shade : c, clamp((1 - d) * 3) * 0.95, only);
      }
    }
  }
}

/** Fog or mist bands drifting through rows y0..y1, fractal so it breaks up. */
export function mist(cv, t, { y0, y1, c, a = 0.45, speed = 0.1, scale = 22, cut = 0.48, only, seed = 3 }) {
  for (let y = Math.floor(y0); y < y1; y++) for (let x = 0; x < cv.w; x++) {
    const n = fbm(x / scale - t * speed, y / (scale * 0.2) + seed, 3, seed);
    const edge = 1 - Math.abs((y - y0) / (y1 - y0) - 0.5) * 2;
    const al = clamp((n - cut) * 2.4) * a * clamp(edge * 1.6);
    if (al > 0.02) cv.add(x, y, c, al, only);
  }
}

/** Falling snow (or blossom, or ash): n flakes, each a pixel, drifting. */
export function snow(cv, t, { n = 160, c = "#ffffff", speed = 6, sway = 2, only, seed = 7, a = 0.9 } = {}) {
  for (let i = 0; i < n; i++) {
    const r1 = fract(Math.sin(i * 12.9898 + seed) * 43758.5453), r2 = fract(Math.sin(i * 78.233 + seed) * 12543.123);
    const v = speed * (0.6 + r2 * 0.8);
    const y = ((r1 * cv.h + t * v) % (cv.h + 4)) - 2;
    const x = ((r2 * cv.w + Math.sin(t * 0.8 + i) * sway) % cv.w + cv.w) % cv.w;
    cv.add(x, y, c, a, only);
  }
}

/** Rain: short slanted streaks. */
export function rain(cv, t, { n = 140, c = "#9fb8d0", speed = 60, len = 3, slant = 0.35, only, seed = 11, a = 0.5 } = {}) {
  for (let i = 0; i < n; i++) {
    const r1 = fract(Math.sin(i * 12.9898 + seed) * 43758.5453), r2 = fract(Math.sin(i * 78.233 + seed) * 12543.123);
    const y = ((r1 * cv.h + t * speed * (0.8 + r2 * 0.4)) % (cv.h + 8)) - 4;
    const x = ((r2 * cv.w - y * slant) % cv.w + cv.w) % cv.w;
    for (let k = 0; k < len; k++) cv.add(x + k * slant, y + k, c, a, only);
  }
}

/** Smoke or steam rising from (x, y): puffs that drift, grow and fade. */
export function smoke(cv, t, x, y, { c = "#cfc8c0", n = 7, rise = 5, drift = 2.5, size = 2, a = 0.5, only, seed = 1 } = {}) {
  for (let i = 0; i < n; i++) {
    const p = (((t * 0.35 + i / n + seed * 0.13) % 1) + 1) % 1;
    const px = x + p * drift * 6 + Math.sin(p * 9 + i + seed) * 1.2, py = y - p * rise * 6, r = size * (0.6 + p * 1.6);
    for (let yy = Math.floor(py - r); yy <= py + r; yy++) for (let xx = Math.floor(px - r); xx <= px + r; xx++) {
      const d = Math.hypot(xx - px, yy - py) / r;
      if (d < 1) cv.add(xx, yy, c, (1 - d) * a * (1 - p), only);
    }
  }
}

/** A flag or banner of w x h pixels at (x, y), waving. */
export function flag(cv, t, x, y, w, h, c, { pole = "#2a2622", c2 } = {}) {
  for (let yy = -1; yy < h + 5; yy++) cv.put(x, y + yy, pole);
  for (let i = 1; i <= w; i++) {
    const off = Math.round(Math.sin(t * 4 - i * 0.9) * (i / w) * 1.2);
    for (let j = 0; j < h; j++) cv.put(x + i, y + j + off, c2 && j >= h / 2 ? c2 : c);
  }
}

/** Water falling down a face from x0..x1 between y0 and y1: streaks moving down. */
export function falls(cv, t, x0, x1, y0, y1, { c = "#eef6ff", c2 = "#a9c8dc", speed = 22, only } = {}) {
  for (let x = Math.floor(x0); x < x1; x++) {
    const ph = fract(Math.sin(x * 91.7) * 4375.5) * 30;
    for (let y = Math.floor(y0); y < y1; y++) {
      const s = Math.sin((y - t * speed + ph) * 0.55) * 0.5 + 0.5;
      cv.add(x, y, s > 0.55 ? c : c2, 0.85, only);
    }
  }
}

const fract = (v) => v - Math.floor(v);

/* ── things scenes keep needing ─────────────────────────────────────── */
/** Where something moving across the frame is at time t: wraps over the width plus a margin. */
export const across = (t, speed, phase = 0, w = W, margin = 30) => {
  const span = w + margin * 2;
  return ((((phase * span + t * speed) % span) + span) % span) - margin;
};

/** A palm: a curved trunk from (x, y) up, fronds drooping from the crown. sway moves the crown. */
export function palm(cv, x, y, h, { lean = 0.25, c = "#1c1a16", sway = 0, fronds = 7, len = 1 } = {}) {
  let px = x, py = y;
  for (let i = 0; i <= h; i++) {
    const u = i / h;
    px = x + lean * h * u * u + sway * u * u * 2; py = y - i;
    cv.put(px, py, c); cv.put(px + 1, py, c);
  }
  for (let k = 0; k < fronds; k++) {
    const a = -Math.PI * 0.95 + (k / (fronds - 1)) * Math.PI * 0.9 + sway * 0.05;
    const L = h * 0.42 * len * (0.8 + ((k * 37) % 5) / 12);
    for (let j = 0; j <= L; j++) {
      const u = j / L;
      const fx = px + Math.cos(a) * j * 1.2, fy = py + Math.sin(a) * j * 0.7 + u * u * L * 0.55;
      cv.put(fx, fy, c); if (u < 0.7) cv.put(fx, fy + 1, c);
    }
  }
}

/** A round-canopied tree: trunk and a lumpy crown, lit from the left. */
export function tree(cv, x, y, r, { trunk = "#3a2a1e", dark = "#2e4a24", light = "#5f8a3a", seed = 1, m, sway = 0 } = {}) {
  cv.rect(x - 1, y - r * 0.9, x + 1, y + 1, trunk, m);
  const cy = y - r * 1.25;
  for (let yy = Math.floor(cy - r * 1.1); yy <= cy + r * 0.9; yy++) for (let xx = Math.floor(x - r * 1.3); xx <= x + r * 1.3; xx++) {
    const d = Math.hypot((xx - x - sway * ((cy + r - yy) / (2 * r))) / 1.25, yy - cy) / r;
    const n = fbm(xx / 3, yy / 3, 2, seed) * 0.45;
    if (d < 0.75 + n) cv.put(xx, yy, mix(col(light), col(dark), clamp((xx - x) / (r * 2.4) + 0.5 + (yy - cy) / (r * 3))), m);
  }
}

/** A conifer: stacked triangles. */
export function pine(cv, x, y, h, c = "#1e3020", m) {
  for (let i = 0; i < h; i++) {
    const w = Math.max(0.5, (h - i) * 0.32 * (1 + 0.3 * Math.sin(i * 1.3)));
    for (let dx = -Math.floor(w); dx <= w; dx++) cv.put(x + dx, y - i, c, m);
  }
}

/** A small boat hull of width w at (x, y) waterline, optional triangular sail. */
export function boat(cv, x, y, w, { hull = "#2a1e18", sail, sailH = 0, mast = "#3a2c22", dir = 1 } = {}) {
  for (let j = 0; j < 2; j++) for (let i = -Math.floor(w / 2) + j; i <= w / 2 - j; i++) cv.put(x + i, y - 1 + j, hull);
  cv.put(x + (w / 2) * dir, y - 2, hull);
  if (sail && sailH) {
    for (let i = 0; i < sailH; i++) cv.put(x, y - 2 - i, mast);
    for (let i = 0; i < sailH; i++) { const ww = Math.round((i / sailH) * w * 0.45); for (let k = 1; k <= ww; k++) cv.put(x - k * dir, y - 2 - sailH + i + 1, sail); }
  }
}

/** A tiny person, 4 pixels tall, walking (step alternates the feet). */
export function person(cv, x, y, { body = "#3a5a8a", head = "#e8c8a0", legs = "#2a1c18", step = 0 } = {}) {
  cv.put(x, y - 3, head); cv.put(x, y - 2, body); cv.put(x, y - 1, body);
  cv.put(x - (step % 2), y, legs); cv.put(x + 1 - (step % 2), y, legs);
}

/** Lit windows on a facade: a grid in the box, some dark, chosen by seed. */
export function windows(cv, x0, y0, x1, y1, { lit = "#ffd27a", dark = "#3a2a24", gx = 3, gy = 3, on = 0.6, seed = 1, w = 1, h = 1 } = {}) {
  for (let y = y0; y + h <= y1; y += gy) for (let x = x0; x + w <= x1; x += gx) {
    const r = fract(Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453);
    cv.rect(x, y, x + w, y + h, r < on ? lit : dark);
  }
}

/** Still stars over the sky mask: fixed points, no twinkle. */
export function stars(cv, { n = 90, y1 = cv.h * 0.5, c = "#fff8e8", c2 = "#c8d4ff", only, seed = 5 } = {}) {
  for (let i = 0; i < n; i++) {
    const x = fract(Math.sin(i * 91.17 + seed) * 4375.85) * cv.w, y = fract(Math.sin(i * 47.31 + seed * 3) * 9821.3) * y1;
    const big = fract(Math.sin(i * 13.7 + seed) * 777.7) > 0.88;
    if (only !== undefined && cv.maskAt(x, y) !== only) continue;
    cv.put(x, y, i % 3 ? c : c2);
    if (big) { cv.add(x + 1, y, c, 0.5, only); cv.add(x - 1, y, c, 0.5, only); cv.add(x, y + 1, c, 0.5, only); cv.add(x, y - 1, c, 0.5, only); }
  }
}

/** A shooting star crossing once every `period` seconds, for about a second. */
export function shootingStar(cv, t, { period = 11, y = 12, c = "#ffffff", only } = {}) {
  const k = (t % period) / 1.1;
  if (k > 1) return;
  const x0 = cv.w * 0.75 - k * 60, y0 = y + k * 18;
  for (let i = 0; i < 12; i++) cv.add(x0 + i * 1.6, y0 - i * 0.5, c, (1 - i / 12) * (1 - k * 0.6), only);
}

/**
 * Waves rolling onto a beach: bands of foam that travel from y0 (sea) to y1
 * (shore), thinning as they go, then wash back. Real surf, not shimmer.
 */
export function surf(cv, t, y0, y1, { foam = "#f4f8f8", n = 3, period = 6, only, wob = 3 } = {}) {
  for (let k = 0; k < n; k++) {
    const p = (((t / period) + k / n) % 1 + 1) % 1, y = lerp(y0, y1, Math.pow(p, 0.8));
    for (let x = 0; x < cv.w; x++) {
      const yy = y + Math.sin(x * 0.07 + k * 2.1) * wob * (1 - p) + Math.sin(x * 0.19 + k) * 0.8;
      const a = (p < 0.85 ? 0.85 : (1 - p) * 5.6) * (0.6 + 0.4 * fbm(x / 6, k * 3 + Math.floor(t / period), 2, 9));
      cv.add(x, yy, foam, a, only); cv.add(x, yy + 1, foam, a * 0.5, only);
    }
  }
}

/** A dome over (cx, by): onion (pointed) or round, shaded from the left, optional finial. */
export function dome(cv, cx, by, r, { c = "#f2ede4", shade = "#b8aa98", onion = false, finial = "#d8b04a", m } = {}) {
  const hgt = onion ? r * 1.5 : r;
  for (let y = Math.floor(by - hgt); y <= by; y++) {
    const u = (by - y) / hgt;
    const w = onion ? r * Math.sin(Math.PI * Math.min(1, 0.15 + u * 0.95)) * (1.2 - u * 0.5) : r * Math.sqrt(Math.max(0, 1 - u * u));
    for (let x = Math.floor(cx - w); x <= cx + w; x++) cv.put(x, y, mix(col(c), col(shade), clamp((x - cx) / (2 * w + 0.01) + 0.5)), m);
  }
  if (finial) { cv.put(cx, by - hgt - 1, finial, m); cv.put(cx, by - hgt - 2, finial, m); }
}

/** An arch opening (dark) in a wall: a rectangle with a round top. */
export function arch(cv, x0, y0, w, h, c = "#2a1e1a", m) {
  const r = w / 2, cx = x0 + r;
  for (let y = Math.floor(y0); y < y0 + h; y++) for (let x = Math.floor(x0); x < x0 + w; x++) {
    if (y < y0 + r && Math.hypot(x + 0.5 - cx, y + 0.5 - (y0 + r)) > r) continue;
    cv.put(x, y, c, m);
  }
}

/* ── tone ───────────────────────────────────────────────────────────── */
/**
 * The halftone renderer (runtime/canvas.js paintTone) sizes every dot by the
 * cell's brightness relative to the frame's own range: it stretches each frame
 * between its 4th and 98.5th percentile. So what decides how full a scene looks
 * is not how bright it is but how its brightness is spread: a mid-tone body
 * under a few near-white highlights reads as small dots, dark and empty.
 *
 * `balance` spreads it: partial histogram equalisation of luminance, blended
 * with the painting by `k`, applied as one hue-preserving gain per pixel. An
 * even spread gives the renderer the full run of dot sizes (mean dot level
 * close to 0.5, like the hand-tuned scenes); k keeps the painting's character,
 * dark silhouettes stay dark and the brightest light stays brightest.
 */
export function balance(cv, k = 0.6) {
  const n = cv.w * cv.h, Y = new Float32Array(n);
  for (let i = 0; i < n; i++) Y[i] = (0.2126 * cv.rgb[i * 3] + 0.7152 * cv.rgb[i * 3 + 1] + 0.0722 * cv.rgb[i * 3 + 2]) / 255;
  // the luminance CDF, from every other pixel each way
  const S = [];
  for (let y = 0; y < cv.h; y += 2) for (let x = 0; x < cv.w; x += 2) S.push(Y[y * cv.w + x]);
  const sorted = Float32Array.from(S).sort(), m = sorted.length;
  const rank = (y) => { let lo = 0, hi = m; while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < y) lo = mid + 1; else hi = mid; } return lo / m; };
  for (let i = 0; i < n; i++) {
    const y = Y[i];
    if (y <= 0.002) continue;
    const eq = 0.05 + rank(y) * 0.9, want = lerp(y, eq, k), f = want / y;
    for (let c = 0; c < 3; c++) cv.rgb[i * 3 + c] = Math.min(255, cv.rgb[i * 3 + c] * f);
  }
  return cv;
}

/* ── palette and output ─────────────────────────────────────────────── */
/**
 * Fit a palette to a painted canvas with median cut: up to `n` colours that
 * best cover what is there, plus `extras` (colours of things that move) when
 * nothing close is already in it. Deterministic.
 */
export function fitPalette(cv, { n = 52, extras = [] } = {}) {
  // every other pixel each way: a quarter of the work, the same colours
  const px = [];
  for (let y = 0; y < cv.h; y += 2) for (let x = 0; x < cv.w; x += 2) {
    const i = (y * cv.w + x) * 3;
    px.push([cv.rgb[i], cv.rgb[i + 1], cv.rgb[i + 2]]);
  }
  let boxes = [px];
  while (boxes.length < n) {
    // split the box with the largest (range x sqrt(count))
    let bi = -1, best = 0, bc = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      for (let c = 0; c < 3; c++) {
        let lo = Infinity, hi = -Infinity;
        for (const p of b) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; }
        const s = (hi - lo) * Math.sqrt(b.length);
        if (s > best) { best = s; bi = i; bc = c; }
      }
    });
    if (bi < 0 || best < 1) break;
    const b = boxes[bi].slice().sort((p, q) => p[bc] - q[bc]), mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  const pal = boxes.map((b) => {
    const s = [0, 0, 0];
    for (const p of b) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }
    return s.map((v) => v / b.length);
  });
  for (const e of extras) {
    const v = hex(e);
    if (pal.length >= KEYS.length) break;
    if (!pal.some((p) => (p[0] - v[0]) ** 2 + (p[1] - v[1]) ** 2 + (p[2] - v[2]) ** 2 < 140)) pal.push(v.slice());
  }
  // dark to light, so the palette reads in order
  return pal.sort((a, b) => lum(a) - lum(b)).slice(0, KEYS.length);
}
const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;

/** meta.palette from a fitted palette. */
export const paletteMeta = (PAL) => Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)]));

/** The halftone tuning every picture scene uses (see runtime/canvas.js). */
export const DOTS = { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } };

const LEVELS = "▁▂▃▄▅▆▇█";
// each level glyph's ink, as runtime/canvas.js reads it
const LVK = [0.135, 0.257, 0.378, 0.51, 0.635, 0.757, 0.878, 1];
/**
 * The function that turns a canvas into a frame: nearest palette colour per
 * cell (the colour layer) and a level glyph for its brightness against that
 * colour (the text layer). Make one per create(); it caches lookups.
 */
export function encoder(PAL) {
  const LUM = PAL.map(lum), cache = new Map();
  const nearest = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let hit = cache.get(k);
    if (hit !== undefined) return hit;
    let best = 0, bd = Infinity;
    for (let i = 0; i < PAL.length; i++) {
      const p = PAL[i], d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11;
      if (d < bd) { bd = d; best = i; }
    }
    cache.set(k, best);
    return best;
  };
  return (cv) => {
    const text = [], color = [];
    for (let y = 0; y < cv.h; y++) {
      let tr = "", cr = "";
      for (let x = 0; x < cv.w; x++) {
        const i = (y * cv.w + x) * 3;
        const r = clamp(cv.rgb[i], 0, 255), g = clamp(cv.rgb[i + 1], 0, 255), b = clamp(cv.rgb[i + 2], 0, 255);
        const k = nearest(r | 0, g | 0, b | 0), Y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        // the glyph whose ink x the palette colour's light comes closest to the painted
        // brightness, so dot size follows the painting with no step anywhere
        const want = LUM[k] > 0 ? Y / LUM[k] : 0;
        let lv = 7, bd = Infinity;
        for (let l = 2; l < 8; l++) { const d = Math.abs(LVK[l] - want); if (d < bd) { bd = d; lv = l; } }
        tr += LEVELS[lv]; cr += KEYS[k];
      }
      text.push(tr); color.push(cr);
    }
    return { text: text.join("\n"), color: color.join("\n") };
  };
}
