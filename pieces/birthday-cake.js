/* birthday-cake: a two-tier cake whose candles flicker, are blown out in a puff of smoke, then relit. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng } from "../lib/kit.js";

const ROOM = gradient(["#2a1030", "#401a44", "#5a2650", "#7a3456", "#a04a5e"], 8);       // 0..7
const WARM = gradient(["#7a3a2a", "#b0602a", "#e09040"], 3);                           // 8..10
const PINK = gradient(["#8a2a5a", "#c8467e", "#f07aa8", "#ffb0cc"], 4);                 // 11..14
const CREAM = gradient(["#c8a880", "#ecd8b8", "#fff4e4", "#ffffff"], 4);                // 15..18
const NAMED = ["#5a2a14", "#8a4a22", "#b06a32", "#ff8a1a", "#ffd23a", "#fff6c8", "#9a9aa8", "#5a5a6a",
  "#ff3a5a", "#3ab0ff", "#6ae05a", "#ffd23a", "#c86aff", "#2a1418", "#e0206a"];
// 19 wood dark, 20 wood, 21 wood lit, 22 flame, 23 flame yellow, 24 flame white, 25 smoke, 26 smoke dim,
// 27-31 bright colours (sprinkles, candles, flags), 32 wick, 33 icing text
const pal = palette([...ROOM, ...WARM, ...PINK, ...CREAM, ...NAMED]);

export const meta = {
  slug: "birthday-cake",
  name: "Birthday Cake",
  category: "occasions",
  note: "A two-tier birthday cake with dripping frosting and sprinkles; its candles flicker, blow out in a puff of smoke and relight.",
  tags: ["birthday", "cake", "candles", "party", "celebration", "cute"],
  cols: 80, rows: 36, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";
const LOOP = 10;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(21);
  const CX = 40;
  const candles = [29, 34, 40, 46, 51].map((x, i) => ({ x, c: 27 + i, ph: r() * 6 }));
  const tiers = [{ x0: 17, x1: 63, y0: 21, y1: 29 }, { x0: 25, x1: 55, y0: 14, y1: 20 }];
  tiers.forEach((tr) => { tr.drip = []; for (let x = tr.x0; x <= tr.x1; x++) tr.drip.push(r() < 0.4 ? 1 + Math.floor(r() * 3) : 0); });
  const sprinkles = Array.from({ length: 40 }, () => [r(), r(), 27 + Math.floor(r() * 5), r() < 0.5 ? "▪" : "•"]);
  return (t) => {
    g.clear();
    const lt = ((t % LOOP) + LOOP) % LOOP;
    // candle state: 1 lit, 0 out; lean while blowing
    const state = candles.map((c, i) => {
      if (lt < 5) return 1;
      if (lt < 5.6) return 1 - (lt - 5) / 0.6;
      if (lt < 7.8 + i * 0.35) return 0;
      return 1;
    });
    const blowing = lt >= 5 && lt < 5.6;
    const lightAmt = state.reduce((a, b) => a + b, 0) / candles.length;
    // warm room with soft bokeh, glow from the candles
    for (let y = 0; y < 31; y++) for (let x = 0; x < cols; x++) {
      const n = fbm(x * 0.07 + t * 0.03, y * 0.15, 3);
      const glow = Math.exp(-Math.hypot((x - CX) * 0.45, y - 9) / 6) * lightAmt;
      const v = clamp(0.2 + (n - 0.5) * 0.6 + y / 31 * 0.2);
      if (glow > 0.3) g.set(x, y, SH[1 + Math.min(3, Math.floor(glow * 3))], KEYS[8 + Math.min(2, Math.floor(glow * 2.5))]);
      else g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[Math.min(7, Math.floor(v * 8))]);
    }
    // bunting
    for (let x = 0; x < cols; x++) {
      const y = Math.round(1 + 2 * Math.sin((x / cols) * Math.PI));
      g.set(x, y, "─", KEYS[18]);
      if (x % 6 === 2) {
        const k = KEYS[27 + (x / 6 | 0) % 5];
        g.text(x - 1, y + 1, "███", k); g.set(x, y + 2, "▀", k);
        if (Math.sin(t * 2 + x) > 0.6) g.set(x, y + 1, "▓", k);
      }
    }
    // table
    for (let y = 30; y < rows; y++) for (let x = 0; x < cols; x++) {
      const grain = fbm(x * 0.05, y * 1.3, 2);
      g.set(x, y, y === 30 ? "▄" : grain > 0.55 ? "▓" : "█", KEYS[19 + (y === 30 ? 2 : grain > 0.45 ? 1 : 0)]);
    }
    // plate
    for (let x = 13; x <= 67; x++) g.set(x, 30, "▀", KEYS[x < 20 || x > 60 ? 16 : 17]);
    // tiers
    for (const tr of tiers) {
      for (let y = tr.y0; y <= tr.y1; y++) for (let x = tr.x0; x <= tr.x1; x++) {
        const u = (x - tr.x0) / (tr.x1 - tr.x0);
        const lit = clamp(0.9 - u * 0.6);
        const row = y - tr.y0;
        const d = tr.drip[x - tr.x0];
        if (row === 0) g.set(x, y, "▄", KEYS[17 + (u < 0.5 ? 1 : 0)]);
        else if (row <= 1 + d) g.set(x, y, "█", KEYS[16 + Math.floor(lit * 2)]);
        else if ((tr.y1 - y) % 3 === 0) g.set(x, y, "█", KEYS[15 + Math.floor(lit * 2)]);   // filling layer
        else g.set(x, y, "█", KEYS[11 + Math.min(3, Math.floor(lit * 4))]);
      }
      for (const [a, b, k, ch] of sprinkles) {
        const sx = Math.round(tr.x0 + 1 + a * (tr.x1 - tr.x0 - 2)), sy = tr.y0 + (b < 0.5 ? 1 : 0);
        g.set(sx, sy, ch === "▪" ? "█" : "▓", KEYS[k]);
      }
    }
    // piped message on the bottom tier
    const msg = "HAPPY  BIRTHDAY";
    const mx0 = Math.round(CX - msg.length / 2);
    for (let i = -3; i < msg.length + 3; i++) g.set(mx0 + i, 25, "█", KEYS[17]);
    for (let i = 0; i < msg.length; i++) if (msg[i] !== " ") g.set(mx0 + i, 25, msg[i], KEYS[33]);
    g.set(mx0 - 2, 25, "♥", KEYS[27]); g.set(mx0 + msg.length + 1, 25, "♥", KEYS[27]);
    // candles, flames and smoke
    candles.forEach((c, i) => {
      for (let y = 10; y < 14; y++) g.set(c.x, y, (y + i) % 2 ? "█" : "▓", KEYS[(y + i) % 2 ? c.c : 18]);
      g.set(c.x, 9, "│", KEYS[32]);
      const s = state[i];
      if (s > 0.05) {
        const f = 0.7 + 0.3 * Math.sin(t * 13 + c.ph) * Math.sin(t * 7 + c.ph * 2);
        const lean = blowing ? 1 : 0;
        if (s > 0.5) g.set(c.x + lean, 7, f > 0.75 ? "▲" : "◆", KEYS[22]);
        g.set(c.x + lean, 8, "█", KEYS[s > 0.6 && f > 0.6 ? 24 : 23]);
        if (s > 0.8 && f > 0.85) g.set(c.x + lean, 6, "'", KEYS[23]);
      } else if (lt < 7.8 + i * 0.35) {
        const a = lt - 5.6;
        for (let k = 0; k < 4; k++) {
          const yy = 8 - Math.floor(a * 3) + k;
          if (yy > 8 || yy < 0) continue;
          g.set(c.x + Math.round(Math.sin(a * 3 + k + i) * 1.2), yy, k % 2 ? "~" : "░", KEYS[k < 2 ? 25 : 26]);
        }
      }
    });
    return g.frame();
  };
}
