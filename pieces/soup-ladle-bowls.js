/* soup-ladle-bowls: a ladle dips into a steaming pot of tomato soup and fills a row of bowls one after another. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth, lerp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#3a2a1e", "#4e3a2a", "#665038", "#7e6648"], 5));
const COUNTER = add(gradient(["#1a1410", "#2e241c", "#463828"], 3));
const POT = add(gradient(["#4a0c0a", "#7a1612", "#b0241a", "#e0442e", "#ff7a5a"], 7));
const SOUP = add(gradient(["#8a1e08", "#b8360e", "#e05a1a", "#f8862e", "#ffb45a"], 6));
const CREAM = add(["#f4e4d0", "#fff8ee"]);
const HERB = add(["#2a6a1a", "#5aa83a"]);
const BOWL = add(gradient(["#8a8e96", "#c4c8d0", "#eef2f6", "#ffffff"], 5));
const LADLE = add(["#5a626c", "#9aa2ac", "#dce2e8"]);
const STEAM = add(gradient(["#6a5e56", "#a49890", "#dcd4cc", "#ffffff"], 4));

export const meta = {
  slug: "soup-ladle-bowls",
  name: "Soup Ladle Service",
  category: "food",
  note: "A steel ladle dips into a steaming red pot of tomato soup and swings over to fill a row of white bowls one after another.",
  tags: ["soup", "dinner", "kitchen", "cozy", "food", "loader"],
  cols: 84, rows: 36, fps: 24,
  palette: palette(P),
};

const TRIP = 4, PER = 3 * TRIP + 1.6;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const pcx = 18, pry = 4, prx = 15, pTop = 15, pBot = 30, counterY = 31;
  const bowls = [42, 58, 74];
  const bowlTop = 26;
  return (t) => {
    const p = ((t % PER) + PER) % PER;
    const trip = Math.min(2, Math.floor(p / TRIP)), q = p - trip * TRIP;
    const done = p >= 3 * TRIP;
    const slide = done ? smooth((p - 3 * TRIP) / 1.6) : 0;
    // ladle path: dip (0-0.8), lift (0.8-1.4), swing (1.4-2.2), pour (2.2-3.2), return (3.2-4)
    const bx = bowls[trip];
    let lx, ly, tilt = 0;
    if (done) { lx = pcx + 4; ly = pTop - 6; }
    else if (q < 0.8) { lx = pcx + 4; ly = lerp(pTop - 6, pTop + 1, smooth(q / 0.8)); }
    else if (q < 1.4) { lx = pcx + 4; ly = lerp(pTop + 1, pTop - 8, smooth((q - 0.8) / 0.6)); }
    else if (q < 2.2) { const f = smooth((q - 1.4) / 0.8); lx = lerp(pcx + 4, bx - 2, f); ly = pTop - 8 + Math.sin(f * Math.PI) * -2 + f * 2; }
    else if (q < 3.2) { lx = bx - 2; ly = pTop - 6; tilt = smooth(clamp((q - 2.2) / 0.3)) * (1 - smooth(clamp((q - 2.95) / 0.25))); }
    else { const f = smooth((q - 3.2) / 0.8); lx = lerp(bx - 2, pcx + 4, f); ly = pTop - 6; }
    const fillOf = (i) => (i < trip ? 1 : i > trip ? 0 : clamp((q - 2.3) / 0.8));
    // wall and counter
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < counterY) {
        const grout = y % 3 === 2 || (x + (Math.floor(y / 3) % 2) * 3) % 6 === 0;
        const v = clamp(0.45 + fbm(x * 0.05, y * 0.12, 2) * 0.3 + Math.exp(-Math.hypot((x - 40) / 30, (y - 10) / 12)) * 0.25 - (grout ? 0.35 : 0));
        g.set(x, y, grout ? "▒" : "█", KEYS[WALL + Math.min(4, Math.floor(v * 5))]);
      } else g.set(x, y, y === counterY ? "▀" : "█", KEYS[COUNTER + (y === counterY ? 2 : 1)]);
    }
    // steam from the pot
    for (let k = 0; k < 16; k++) {
      const a = (t * 0.32 + k / 16) % 1;
      const x = pcx - 10 + (k * 7) % 21 + Math.sin(a * 5 + k) * 2.5 + a * 3, y = pTop - 3 - a * 13;
      if (y >= 0) g.set(x, y, a < 0.3 ? "▓" : a < 0.6 ? "▒" : "░", KEYS[STEAM + (a < 0.3 ? 3 : a < 0.6 ? 2 : 1)]);
    }
    // enamel pot
    for (let y = pTop; y < pBot; y++) for (let x = pcx - prx; x <= pcx + prx; x++) {
      const u = (x - pcx) / prx;
      let v = clamp(Math.sqrt(1 - u * u) * 0.55 + 0.25 - u * 0.25);
      if (Math.abs(u + 0.5) < 0.06) v = 1;
      g.set(x, y, "█", KEYS[POT + Math.min(6, Math.floor(v * 7))]);
    }
    for (let y = pTop - pry; y <= pTop + pry; y++) for (let x = pcx - prx; x <= pcx + prx; x++) {
      const e = ((x - pcx) / prx) ** 2 + ((y - pTop) / pry) ** 2;
      if (e > 1) continue;
      if (e > 0.75) { g.set(x, y, "█", KEYS[POT + (y < pTop ? 3 : 5)]); continue; }
      const sw = fbm(x * 0.2 + t * 0.3, y * 0.5, 2);
      const herb = noise2(x * 0.9 + t * 0.4, y * 1.3, 8) > 0.8;
      g.set(x, y, "█", KEYS[herb ? HERB + ((x + y) % 2) : SOUP + Math.min(5, Math.floor(clamp(0.3 + sw * 0.6) * 6))]);
    }
    for (const s of [-1, 1]) g.text(s < 0 ? pcx - prx - 3 : pcx + prx + 1, pTop + 2, "███", KEYS[POT + 1]);
    // bowls, filling in turn, then the row slides away and fresh bowls arrive
    bowls.forEach((bx0, i) => {
      const bxx = Math.round(bx0 + slide * 50);
      const f = done ? 1 : fillOf(i);
      for (let y = bowlTop - 2; y <= bowlTop + 4; y++) for (let x = bxx - 7; x <= bxx + 7; x++) {
        const nx = (x - bxx) / 7;
        if (Math.abs(nx) > 1) continue;
        if (y <= bowlTop + 1) {
          const e = nx * nx + ((y - bowlTop + 0.5) / 2) ** 2;
          if (e > 1) continue;
          if (e > 0.7) g.set(x, y, "█", KEYS[BOWL + (y < bowlTop ? 2 : 3)]);
          else g.set(x, y, "█", KEYS[f > 0.05 ? SOUP + Math.min(5, Math.floor((0.35 + f * 0.4 + (nx < 0 ? 0.15 : 0)) * 6)) : BOWL + 0]);
        } else {
          const w = 7 - (y - bowlTop - 1) * 1.1;
          if (Math.abs(x - bxx) > w) continue;
          g.set(x, y, "█", KEYS[BOWL + Math.min(4, Math.floor(clamp(0.6 - nx * 0.35) * 5))]);
        }
      }
      if (f >= 1) { g.set(bxx - 1, bowlTop - 1, "█", KEYS[CREAM + 1]); g.set(bxx, bowlTop - 1, "█", KEYS[CREAM]); g.set(bxx + 2, bowlTop, "█", KEYS[HERB + 1]); }
    });
    if (slide > 0) bowls.forEach((bx0) => {
      const bxx = Math.round(bx0 + slide * 50 - 50);
      for (let y = bowlTop - 1; y <= bowlTop + 4; y++) for (let x = bxx - 7; x <= bxx + 7; x++) {
        const nx = (x - bxx) / 7;
        if (y <= bowlTop + 1) { if (nx * nx + ((y - bowlTop + 0.5) / 2) ** 2 <= 1) g.set(x, y, "█", KEYS[BOWL + 1]); }
        else if (Math.abs(x - bxx) <= 7 - (y - bowlTop - 1) * 1.1) g.set(x, y, "█", KEYS[BOWL + 2]);
      }
    });
    // pour stream
    if (tilt > 0.6) for (let y = Math.round(ly) + 3; y < bowlTop; y++) g.set(Math.round(lx) + 4, y, "█", KEYS[SOUP + 3 + ((y + Math.floor(t * 16)) % 3 === 0 ? 1 : 0)]);
    // ladle: bowl and long handle
    const lxR = Math.round(lx), lyR = Math.round(ly);
    for (let y = lyR - 1; y <= lyR + 2; y++) for (let x = lxR - 5; x <= lxR + 5; x++) {
      const dy = y - lyR - (tilt > 0.5 && x > lxR ? 1 : 0);
      if (Math.abs(x - lxR) + Math.max(0, dy) * 2.2 > 5.5 || dy < -1) continue;
      g.set(x, y + (tilt > 0.5 && x > lxR ? 1 : 0), "█", KEYS[dy === -1 ? (q > 0.8 && q < 2.4 && !done ? SOUP + 4 : LADLE + 2) : LADLE + (x < lxR ? 2 : 1)]);
    }
    g.line(lxR - 5, lyR - 1, lxR - 12, lyR - 13, "█", KEYS[LADLE + 1]);
    g.line(lxR - 4, lyR - 1, lxR - 11, lyR - 13, "█", KEYS[LADLE + 2]);
    return g.frame();
  };
}
