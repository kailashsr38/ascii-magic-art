/* lighthouse-storm: a lighthouse on the rocks in a storm, its beam sweeping as waves crash below. */
import { Grid, palette, gradient, KEYS, fbm, noise2, rng, clamp, TAU } from "../lib/kit.js";

const P = [];
const grp = (hexes) => {
  const o = P.length, n = hexes.length;
  P.push(...hexes);
  return (v) => KEYS[o + (v <= 0 ? 0 : v >= 1 ? n - 1 : Math.floor(v * n))];
};
const SKY = grp(gradient(["#06080e", "#121a26", "#24303e", "#3e4c5c", "#6a7a8a"], 10));
const BEAM = grp(gradient(["#6a6a50", "#c8c080", "#fff2b0", "#fffbe8"], 6));
const SEA = grp(gradient(["#04101a", "#0e2432", "#1c4252", "#36687a"], 8));
const FOAM = grp(gradient(["#7a9aa8", "#c8dce4", "#ffffff"], 3));
const ROCK = grp(gradient(["#121216", "#26262e", "#3e3e48", "#62626e"], 6));
const RED = grp(["#7a1414", "#c42a24"]);
const WHITE = grp(["#9aa0a8", "#e8ecf0"]);
const DARK = grp(["#14181e", "#2a3038"]);
const BOLT = grp(["#c8d8ff", "#ffffff"]);
const RAIN = grp(["#5a6a7a", "#8a9aaa"]);

export const meta = {
  slug: "lighthouse-storm",
  name: "Lighthouse Storm",
  category: "landscapes",
  note: "A lighthouse stands on the rocks through a storm, its beam sweeping the rain as waves crash below.",
  tags: ["lighthouse", "storm", "ocean", "rain", "lightning", "wallpaper"],
  cols: 96, rows: 36, fps: 24,
  palette: palette(P),
};

const SH = "░▒▓█";
const sh = (v) => SH[v <= 0 ? 0 : v >= 1 ? 3 : Math.floor(v * 4)];
const HZ = 22, LX = 70, LY = 6;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(41);
  const rockTop = Float32Array.from({ length: cols }, (_, x) => {
    const d = Math.abs(x - LX - 2);
    return d < 18 ? 25 + d * d * 0.03 + (noise2(x * 0.4, 0, 3) - 0.5) * 3 : 99;
  });
  const bolt = [];
  { let x = 24, y = 0; while (y < HZ) { bolt.push([Math.round(x), y]); x += (r() - 0.5) * 3; y += 1; } }
  const drops = Array.from({ length: 180 }, () => [r() * cols, r() * rows, 26 + r() * 14, r() < 0.3 ? 1 : 0]);
  const spray = Array.from({ length: 60 }, () => [(r() - 0.5) * 2, 6 + r() * 10, r() * 0.6]);

  return (t) => {
    g.clear();
    const ang = t * 1.2;
    const dirX = Math.cos(ang), toward = Math.sin(ang);
    const flashT = t % 7, flash = flashT < 0.12 || (flashT > 0.22 && flashT < 0.3) ? 1 : 0;
    const len = 80 * Math.abs(dirX);
    // churning storm sky, lit by the beam
    for (let y = 0; y < HZ; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.05 - t * 0.35, y * 0.18 + t * 0.05, 4, 2);
      let v = clamp(0.05 + (n - 0.3) * 1.4 + y / HZ * 0.2 + flash * 0.4);
      const dx = x - LX, dy = y - LY;
      let b = 0;
      if (Math.sign(dx) === Math.sign(dirX) && Math.abs(dx) < len) {
        const spread = 0.6 + Math.abs(dx) * 0.13;
        b = Math.exp(-((dy / spread) ** 2)) * (1 - Math.abs(dx) / (len + 1)) * (0.45 + 0.55 * Math.abs(dirX));
      }
      const glare = Math.exp(-Math.hypot(dx / 2, dy) / 3) * Math.max(0, toward) * 1.2;
      b = Math.max(b, glare);
      if (b > 0.18) g.set(x, y, sh(0.3 + b), BEAM(clamp(b * 0.8 + n * 0.3)));
      else g.set(x, y, sh(0.4 + v * 0.6), SKY(v));
    }
    if (flash) for (const [x, y] of bolt) { g.set(x, y, "█", BOLT(1)); g.set(x + 1, y, "▓", BOLT(0)); }
    // heaving sea with whitecaps
    for (let y = HZ; y < rows; y++) {
      const d = (y - HZ) / (rows - HZ);
      for (let x = 0; x < cols; x++) {
        const w = fbm(x * 0.07 + t * 0.4, y * 0.45 - t * 0.3, 4, 7);
        const sw = Math.sin(x * 0.18 - t * 2.2 + y * 0.9);
        if (w > 0.6 && sw > 0.2) { g.set(x, y, w > 0.68 ? "█" : "▓", FOAM(clamp((w - 0.6) * 10))); continue; }
        const lit = Math.max(0, -dirX) * Math.exp(-Math.abs(x - LX + 20) / 25) * 0.25;
        g.set(x, y, sh(0.5 + w * 0.5), SEA(clamp(0.2 + d * 0.3 + (w - 0.5) * 0.9 + flash * 0.3 + lit)));
      }
    }
    // rocks
    for (let x = 0; x < cols; x++) for (let y = Math.ceil(rockTop[x]); y < rows; y++) {
      const n = noise2(x * 0.35, y * 0.6, 12);
      g.set(x, y, n > 0.55 ? "▓" : "█", ROCK(clamp(n * 0.8 + (y === Math.ceil(rockTop[x]) ? 0.3 : 0) + flash * 0.3)));
    }
    // the tower, striped and tapering
    for (let y = LY + 3; y < 26; y++) {
      const hw = 2 + (y - LY) * 0.09;
      for (let x = Math.round(LX - hw); x <= Math.round(LX + hw); x++) {
        const band = Math.floor((y - LY - 3) / 3) % 2;
        const side = x > LX ? 1 : 0;
        g.set(x, y, "█", band ? RED(side) : WHITE(side));
      }
    }
    g.text(LX - 3, LY + 2, "╤═════╤", DARK(1));
    g.text(LX - 2, LY - 1, "▄███▄", DARK(0));
    g.set(LX, LY - 2, "▲", DARK(1));
    const lamp = 0.6 + 0.4 * Math.max(Math.abs(dirX), toward);
    g.text(LX - 2, LY, "│", DARK(1)); g.text(LX + 2, LY, "│", DARK(1));
    g.text(LX - 2, LY + 1, "│", DARK(1)); g.text(LX + 2, LY + 1, "│", DARK(1));
    for (let x = LX - 1; x <= LX + 1; x++) { g.set(x, LY, "█", BEAM(lamp)); g.set(x, LY + 1, "█", BEAM(lamp * 0.85)); }
    g.set(LX + 1, 23, "▀", BEAM(0.5)); g.set(LX - 1, 18, "▄", DARK(0));
    // waves bursting against the rocks
    for (let k = 0; k < 2; k++) {
      const cyc = (t * 0.45 + k * 0.5) % 1;
      const bx = k ? LX + 17 : LX - 15;
      for (const [vx, vy, d] of spray) {
        const a = cyc * 2.2 - d;
        if (a < 0 || a > 1.6) continue;
        const x = bx + vx * a * 6 * (k ? 1 : -1) + vx * 2, y = 26 - vy * a + 8 * a * a;
        if (y > 27) continue;
        g.set(x, y, a < 0.8 ? "█" : "▓", FOAM(clamp(1.2 - a)));
      }
    }
    // rain
    for (const [x0, y0, sp, b] of drops) {
      const y = ((y0 + t * sp) % (rows + 2)) - 1;
      const x = (((x0 - y * 0.45 - t * 6) % cols) + cols) % cols;
      g.set(x, y, "/", RAIN(b));
    }
    return g.frame();
  };
}
