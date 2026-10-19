/* taj-mahal-sunset: a white domed mausoleum with four minarets and a long reflecting pool at sunset. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#2a2058", "#5a2e70", "#a8406e", "#e8705a", "#ffaa5a", "#ffe0a0"], 14));
const SUN = grp(["#ffd080", "#fff4d8"]);
const MARBLE = grp(gradient(["#5a4a6a", "#8a7090", "#c8a0a8", "#f0c8b0", "#fff0e0"], 10));
const ARCH = grp(["#2a1e34", "#4a3450"]);
const CYP = grp(["#0c1a14", "#1a3020"]);
const LAWN = grp(gradient(["#14281a", "#24442a", "#3a5e34"], 4));
const PATH = grp(["#8a7070", "#b89488"]);
const POOL = grp(gradient(["#2a2a58", "#5a3a70", "#c06a70", "#ffb070"], 6));
const BIRD = grp(["#1a1020"]);

export const meta = {
  slug: "taj-mahal-sunset",
  name: "Taj Mahal Sunset",
  category: "landscapes",
  note: "A white domed mausoleum with four minarets glows at sunset above its long reflecting pool.",
  tags: ["india", "monument", "sunset", "architecture", "travel", "wallpaper"],
  cols: 96, rows: 40, fps: 20,
  palette: palette(P),
};

const CX = 48, GROUND = 27;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(3);
  // static monument: char + shade value (0..1) per cell, null where sky shows
  const mch = new Array(cols * GROUND).fill(null), mv = new Float32Array(cols * GROUND), mk = new Uint8Array(cols * GROUND);
  const put = (x, y, ch, v, kind = 0) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= cols || y < 0 || y >= GROUND) return;
    mch[x + y * cols] = ch; mv[x + y * cols] = v; mk[x + y * cols] = kind;
  };
  const lightAt = (x, half) => clamp(0.55 + ((x - CX) / half) * 0.35);
  // plinth
  for (let y = 24; y < GROUND; y++) for (let x = 16; x <= 80; x++) put(x, y, y === 24 ? "▀" : "█", 0.45 + (x - 16) / 64 * 0.35);
  // main hall with chamfered corners
  for (let y = 14; y < 24; y++) for (let x = 31; x <= 65; x++) {
    const ch = (x < 34 || x > 62) && y < 16 ? null : "█";
    if (ch) put(x, y, ch, lightAt(x, 18) - ((x < 34 || x > 62) ? 0.12 : 0));
  }
  // great central arch frame and recessed pointed arch
  for (let y = 12; y < 24; y++) for (let x = 41; x <= 55; x++) put(x, y, "█", lightAt(x, 18) + 0.06);
  for (let y = 15; y < 24; y++) {
    const hw = y < 18 ? (y - 15) * 1.4 + 0.5 : 4.5;
    for (let x = CX - hw; x <= CX + hw; x++) put(x, y, y === 15 ? "▄" : "█", 0, 1);
  }
  // side arches, two storeys
  for (const ax of [35, 59]) for (const ay of [15, 19]) for (let y = ay; y < ay + 4; y++) {
    const hw = y === ay ? 0.5 : 1.6;
    for (let x = ax - hw; x <= ax + hw + 0.5; x++) put(x, y, y === ay ? "▄" : "█", 0, 1);
  }
  // drum and onion dome
  for (let y = 10; y < 12; y++) for (let x = 40; x <= 56; x++) put(x, y, "█", lightAt(x, 9) - 0.05);
  for (let y = 0; y < 10; y++) {
    const s = (y + 0.5) / 10;             // 0 at the tip, 1 at the base
    const hw = s < 0.18 ? s / 0.18 * 2.2 : s < 0.75 ? 2.2 + Math.sin(((s - 0.18) / 0.57) * Math.PI * 0.5) * 8 : 10.2 - (s - 0.75) * 10;
    for (let x = CX - hw; x <= CX + hw; x++) {
      const nx = (x - CX) / (hw + 0.01);
      put(x, y + 1, "█", clamp(0.5 + nx * 0.38 + (1 - Math.abs(nx)) * 0.15 - (1 - s) * 0.05));
    }
  }
  put(CX, 0, "│", 0.9);
  // corner kiosks with small domes
  for (const kx of [36, 60]) {
    for (let y = 11; y < 14; y++) for (let x = kx - 2; x <= kx + 2; x++) put(x, y, (x - kx) % 2 ? "█" : "▌", lightAt(x, 20));
    put(kx - 1, 10, "▄", 0.6); put(kx, 10, "█", 0.75); put(kx + 1, 10, "▄", 0.8); put(kx, 9, "▲", 0.8);
  }
  // four minarets with balconies
  for (const mx of [20, 76, 27, 69]) {
    const near = mx === 20 || mx === 76;
    const topY = near ? 8 : 10;
    for (let y = topY; y < 24; y++) {
      const balcony = y === topY + 4 || y === topY + 9 || y === topY + 13;
      for (let x = mx - (balcony ? 2 : 1); x <= mx + (balcony ? 2 : 1); x++) put(x, y, balcony ? "▀" : "█", lightAt(x, 40) + (balcony ? 0.1 : 0) - (near ? 0 : 0.08));
    }
    put(mx - 1, topY - 1, "▄", 0.6); put(mx, topY - 1, "█", 0.75); put(mx + 1, topY - 1, "▄", 0.8); put(mx, topY - 2, "▲", 0.8);
  }
  const cyp = [];
  for (let k = 0; k < 6; k++) { const y = GROUND + 2 + k * 2; const off = 5 + k * 2.6; cyp.push([CX - off - 3, y, 2 + k * 0.6], [CX + off + 3, y, 2 + k * 0.6]); }
  const birds = Array.from({ length: 6 }, () => [r() * 120, 2 + r() * 8, 1.5 + r() * 2, r() * TAU]);
  const sx = 82, sy = 21;

  return (t) => {
    g.clear();
    // sunset sky with lit cloud streaks
    for (let y = 0; y < GROUND; y++) for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - sx) / 2, y - sy);
      const streak = fbm(x * 0.025 - t * 0.04, y * 0.5, 4, 2);
      const v = clamp(Math.pow(y / GROUND, 1.1) * 0.85 + Math.exp(-d / 10) * 0.4 + (streak - 0.5) * 0.45);
      if (d < 3.5) g.set(x, y, "█", SUN(d < 2.2 ? 1 : 0));
      else g.set(x, y, streak > 0.6 ? "▓" : "█", SKY(v));
    }
    const glow = 0.04 * Math.sin(t * 0.5);
    for (let i = 0; i < mch.length; i++) {
      if (!mch[i]) continue;
      g.set(i % cols, Math.floor(i / cols), mch[i], mk[i] ? ARCH(mk[i] && mv[i] > 0.5 ? 1 : 0) : MARBLE(clamp(mv[i] + glow)));
    }
    // gardens, paths and the reflecting pool
    for (let y = GROUND; y < rows; y++) {
      const d = (y - GROUND) / (rows - GROUND);
      const hw = 2 + d * 9, pw = hw + 2 + d * 3;
      for (let x = 0; x < cols; x++) {
        const dx = Math.abs(x - CX);
        if (dx < hw) {
          const sy2 = Math.round(GROUND - 1 - (y - GROUND) * 2.1);
          const wob = Math.round(Math.sin(y * 1.7 + t * 2.5) * 0.7 * (0.4 + d));
          const sxx = x + wob, i = sxx + sy2 * cols;
          const rip = noise2(x * 0.3, y * 1.4 - t * 1.5, 6);
          if (sy2 >= 0 && mch[i] && rip > 0.25) g.set(x, y, rip > 0.6 ? "▓" : "▒", mk[i] ? ARCH(0) : MARBLE(clamp(mv[i] - 0.15)));
          else g.set(x, y, rip > 0.55 ? "▓" : "█", POOL(clamp(0.75 - d * 0.6 + (rip - 0.5) * 0.4)));
        } else if (dx < pw) g.set(x, y, "█", PATH(dx < hw + 1 ? 1 : 0));
        else g.set(x, y, noise2(x * 0.3, y, 4) > 0.6 ? "▓" : "█", LAWN(clamp(0.2 + d * 0.5 + noise2(x * 0.2, y * 0.6, 8) * 0.3)));
      }
    }
    for (const [x0, y0, h] of cyp) for (let j = 0; j < h * 2; j++) {
      const w = Math.max(0, Math.floor((1 - Math.abs(j - h * 0.7) / (h * 1.3)) * h * 0.45));
      for (let i = -w; i <= w; i++) g.set(x0 + i, y0 - j, "█", CYP(i > 0 ? 1 : 0));
    }
    for (const [bx0, by, sp, ph] of birds) {
      const bx = ((bx0 + t * sp) % 120) - 10, y = by + Math.sin(t * 0.8 + ph);
      const up = Math.sin(t * 8 + ph) > 0;
      g.set(bx, y, up ? "v" : "-", BIRD(0)); g.set(bx + 1, y, up ? "v" : "-", BIRD(0));
    }
    return g.frame();
  };
}
