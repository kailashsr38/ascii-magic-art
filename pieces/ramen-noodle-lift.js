/* ramen-noodle-lift: a steaming bowl of ramen, chopsticks lifting a tangle of noodles out of the broth. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp, smooth } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const WALL = add(gradient(["#120806", "#26140e", "#3e2418", "#5a3422"], 6));
const WOOD = add(gradient(["#2e170a", "#5a3216", "#8a5426", "#b8783a"], 6));
const BOWL = add(gradient(["#1a0505", "#4a0d0c", "#8a1a15", "#c8342a", "#ee6a50"], 8));
const BROTH = add(gradient(["#6a300c", "#a85a18", "#d88e30", "#f2bc5e", "#fff0b8"], 8));
const NOODLE = add(["#b88a30", "#e8c25c", "#fff0a8"]);
const EGG = add(["#e6dfd2", "#ffffff", "#f07e14", "#ffb43a"]);
const PORK = add(["#6a3220", "#b06448", "#e49c84", "#f6cdb8"]);
const NORI = add(["#0c160e", "#1c2e1e"]);
const ONION = add(["#2e7a24", "#86dc52"]);
const NARUTO = add(["#fff6f0", "#ff4f86"]);
const STICK = add(["#5a2e12", "#a8682c", "#e8b070"]);
const STEAM = add(gradient(["#5e504a", "#9c8e86", "#dcd4cc", "#ffffff"], 6));

export const meta = {
  slug: "ramen-noodle-lift",
  name: "Ramen Noodle Lift",
  category: "food",
  note: "A deep red bowl of ramen with egg, pork and nori, chopsticks lifting a tangle of noodles out of the steaming broth.",
  tags: ["ramen", "noodles", "food", "steam", "cozy", "hero"],
  cols: 84, rows: 36, fps: 24,
  palette: palette(P),
};

const SH = "░▒▓█";

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const cx = 40, rimY = 16, rx = 31, ry = 6, tableY = 29;
  const dens = new Float32Array(cols * rows);
  const onions = [];
  for (let i = 0; i < 26; i++) onions.push([cx - 24 + ((i * 37) % 48), rimY - 4 + ((i * 13) % 9)]);
  return (t) => {
    // back wall and counter
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (y < tableY) {
        const glow = Math.exp(-Math.hypot((x - cx) / 34, (y - 10) / 14));
        const v = clamp(0.1 + glow * 0.6 + fbm(x * 0.08, y * 0.16, 3) * 0.25);
        g.set(x, y, v > 0.5 ? "▒" : "░", KEYS[WALL + Math.min(5, Math.floor(v * 6))]);
      } else {
        const grain = fbm(x * 0.04, y * 1.3, 3) + Math.sin(x * 0.2 + y) * 0.04;
        const v = clamp(0.2 + grain * 0.6 + (y - tableY) * 0.04);
        g.set(x, y, y === tableY ? "▄" : v > 0.5 ? "▓" : "█", KEYS[WOOD + Math.min(5, Math.floor(v * 6))]);
      }
    }
    // steam rising behind the bowl
    dens.fill(0);
    for (let y = 0; y < rimY; y++) {
      const hgt = (rimY - y) / rimY;
      for (let k = 0; k < 4; k++) {
        const ph = y * 0.33 + t * 1.5 + k * 1.9;
        const xc = cx - 15 + k * 10 + Math.sin(ph) * (1 + hgt * 4) + (noise2(y * 0.12 + t * 0.5, k * 3, 4) - 0.5) * 8 * hgt;
        const w = 1.5 + hgt * 3;
        for (let x = Math.max(0, Math.floor(xc - w * 2.5)); x <= Math.min(cols - 1, xc + w * 2.5); x++) {
          const puff = 0.5 + 0.5 * noise2(x * 0.25, y * 0.5 + t * 2.2, k + 9);
          dens[x + y * cols] += Math.exp(-(((x - xc) / w) ** 2)) * puff * Math.pow(1 - hgt, 0.8);
        }
      }
    }
    for (let i = 0; i < cols * rimY; i++) if (dens[i] > 0.16) {
      const v = clamp(dens[i]);
      g.set(i % cols, (i / cols) | 0, v > 0.65 ? "▓" : v > 0.38 ? "▒" : "░", KEYS[STEAM + Math.min(5, Math.floor(v * 6))]);
    }
    // nori sheet standing up at the back
    for (let y = rimY - 11; y <= rimY - 2; y++) for (let x = cx + 11; x <= cx + 19; x++) {
      const tilt = Math.floor((rimY - y) * 0.3);
      g.set(x + tilt, y, (x + y) % 3 ? "█" : "▓", KEYS[NORI + ((x + y) % 4 === 0 ? 1 : 0)]);
    }
    // bowl body: a deep round bowl lit from the left
    for (let y = rimY; y <= tableY + 3; y++) {
      const fy = (y - rimY) / (tableY + 4 - rimY);
      const w = rx * Math.sqrt(Math.max(0, 1 - fy * fy * 0.92));
      for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
        const u = (x - cx) / w;
        if (Math.abs(u) > 1) continue;
        let lit = Math.sqrt(Math.max(0, 1 - u * u)) * 0.6 + 0.2 - u * 0.25 - fy * 0.25;
        if (Math.abs(u + 0.45) < 0.06) lit += 0.3;
        const band = y === rimY + ry + 2 || y === rimY + ry + 3;
        const ch = band ? ((x + (y === rimY + ry + 2 ? 0 : 2)) % 4 < 2 ? "▀" : "▄") : "█";
        g.set(x, y, ch, KEYS[BOWL + Math.min(7, Math.max(0, Math.floor(clamp(band ? lit + 0.35 : lit) * 8)))]);
      }
    }
    if (tableY + 4 < rows) for (let x = cx - 12; x <= cx + 12; x++) g.set(x, tableY + 4, "▀", KEYS[BOWL + 1]);
    // the opening: rim ring and broth with drifting oil spots
    for (let y = rimY - ry; y <= rimY + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) {
      const e = ((x - cx) / rx) ** 2 + ((y - rimY) / ry) ** 2;
      if (e > 1) continue;
      if (e > 0.78) { g.set(x, y, "█", KEYS[BOWL + (y < rimY ? 3 : 6)]); continue; }
      const oil = noise2(x * 0.3 + t * 0.4, y * 0.7 - t * 0.2, 3);
      let v = 0.35 + fbm(x * 0.1 - t * 0.15, y * 0.3, 2) * 0.35 - (y - rimY) * 0.03;
      if (oil > 0.78) v = 0.95;
      g.set(x, y, "█", KEYS[BROTH + Math.min(7, Math.floor(clamp(v) * 8))]);
    }
    // noodle nest in the broth
    for (let y = rimY - 3; y <= rimY + 3; y++) for (let x = cx - 9; x <= cx + 7; x++) {
      const e = ((x - cx + 1) / 9) ** 2 + ((y - rimY) / 3.4) ** 2;
      if (e > 1) continue;
      const s = Math.sin(x * 0.9 + Math.sin(y * 2.1) * 2 + t * 0.6);
      g.set(x, y, s > -0.3 ? "█" : "▓", KEYS[s > 0.5 ? NOODLE + 2 : s > -0.3 ? NOODLE + 1 : NOODLE]);
    }
    // egg halves
    for (const [ex, ey] of [[cx - 19, rimY - 1], [cx - 13, rimY + 2]]) {
      for (let y = ey - 2; y <= ey + 2; y++) for (let x = ex - 5; x <= ex + 5; x++) {
        const d = Math.hypot((x - ex) / 5, (y - ey) / 2.2);
        if (d > 1) continue;
        g.set(x, y, "█", KEYS[d < 0.45 ? EGG + (d < 0.25 ? 3 : 2) : EGG + (x < ex ? 1 : 0)]);
      }
    }
    // pork slices
    for (const [px, py] of [[cx + 9, rimY + 1], [cx + 17, rimY - 1]]) {
      for (let y = py - 2; y <= py + 2; y++) for (let x = px - 5; x <= px + 5; x++) {
        const d = Math.hypot((x - px) / 5, (y - py) / 2.3);
        if (d > 1) continue;
        const sw = Math.sin(Math.atan2(y - py, (x - px) / 2) * 1 + d * 9);
        g.set(x, y, "█", KEYS[PORK + (d > 0.82 ? 0 : sw > 0.5 ? 3 : x < px ? 2 : 1)]);
      }
    }
    // fish cake with its pink swirl
    for (let y = rimY + 2; y <= rimY + 4; y++) for (let x = cx - 5; x <= cx + 1; x++) {
      const d = Math.hypot((x - cx + 2) / 3.2, (y - rimY - 3) / 1.4);
      if (d > 1) continue;
      g.set(x, y, "█", KEYS[NARUTO + (Math.abs(d - 0.5) < 0.2 ? 1 : 0)]);
    }
    for (const [ox, oy] of onions) {
      const e = ((ox - cx) / rx) ** 2 + ((oy - rimY) / ry) ** 2;
      if (e < 0.7) g.set(ox, oy, "█", KEYS[ONION + ((ox + oy) % 2)]);
    }
    // chopsticks lift the noodles, hold, and lower them back
    const p = (t % 6) / 6;
    const h = smooth(clamp(p / 0.35)) * (1 - smooth(clamp((p - 0.7) / 0.3)));
    const bob = Math.sin(t * 5) * 0.4 * h;
    const tipY = Math.round(rimY - 2 - h * 11 + bob), tipX = cx + 1;
    // hanging noodles, swaying, fanning into the nest
    for (let k = 0; k < 7; k++) {
      const x0 = tipX - 2 + k * 0.75;
      const span = rimY - tipY;
      for (let y = tipY + 1; y <= rimY; y++) {
        const f = (y - tipY) / Math.max(1, span);
        const x = x0 + Math.sin(y * 0.8 + k * 1.7 + t * 3) * 0.6 * f + (k - 3) * f * 1.1 + Math.sin(t * 1.7) * f * 0.8;
        g.set(Math.round(x), y, k % 3 === 0 ? "▓" : "█", KEYS[NOODLE + (k % 2 ? 1 : 2)]);
      }
    }
    // drips falling from the lifted noodles
    if (h > 0.6) for (let d = 0; d < 3; d++) {
      const a = (t * 1.3 + d * 0.33) % 1;
      const y = Math.round(tipY + 2 + a * (rimY - tipY - 2));
      g.set(tipX - 3 + d * 3, y, "•", KEYS[BROTH + 5]);
    }
    for (const [sx, sy, dx] of [[cx + 32, -3, 0], [cx + 36, -1, 3]]) {
      g.line(sx, sy, tipX + dx, tipY + (dx ? 1 : 0), "█", KEYS[STICK + 1]);
      g.line(sx + 1, sy, tipX + dx + 1, tipY + (dx ? 1 : 0), "▓", KEYS[STICK + 2]);
    }
    return g.frame();
  };
}
