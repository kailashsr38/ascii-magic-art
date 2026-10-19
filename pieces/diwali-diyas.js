/* diwali-diyas: a row of clay oil lamps flickering on a ledge above a turning rangoli, under a marigold garland. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract, TAU } from "../lib/kit.js";

const SKY = gradient(["#0a0518", "#1e0b33", "#3f1238", "#6e1f30", "#b4472a", "#f29a3c"], 12);   // 0..11
const FLOOR = gradient(["#1a0806", "#3a120a", "#5e1f10", "#8a3416", "#c25a24"], 6);              // 12..17
const NAMED = {
  bowlD: "#5a1e0a", bowl: "#a8441a", bowlL: "#e07a34", bowlH: "#ffb066",
  flD: "#e0461a", fl: "#ff8c1a", flY: "#ffd23a", flW: "#fff6c8",
  mari: "#ff8a00", mariY: "#ffc61a", leaf: "#2f9a3a", leafD: "#1c5e24",
  magenta: "#e0218a", pink: "#ff6fb5", red: "#e0302a", orange: "#ff8c1a", yellow: "#ffd23a",
  green: "#2fc24a", blue: "#2a7fff", teal: "#1fc2b4", white: "#fff4e0", purple: "#9a3ad8",
  blueD: "#163a7a", magD: "#6a1044", stone: "#4a2a20", stoneL: "#7a4a34",
};
const NK = Object.keys(NAMED);
const pal = palette([...SKY, ...FLOOR, ...Object.values(NAMED)]);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[18 + i]));

export const meta = {
  slug: "diwali-diyas",
  name: "Diwali Diyas",
  category: "occasions",
  note: "A row of clay oil lamps flickering on a ledge above a slowly turning rangoli, under a marigold garland.",
  tags: ["diwali", "festival", "lamps", "rangoli", "hero", "wallpaper"],
  cols: 96, rows: 38, fps: 20,
  palette: pal,
};

const SH = " ░▒▓█";
const RCOL = ["magenta", "orange", "yellow", "green", "blue", "pink", "teal", "red"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const LEDGE = 17;
  const ledgeDiyas = [6, 18, 30, 42, 54, 66, 78, 90].map((x, i) => ({ x, by: LEDGE - 1, s: i * 1.7 + 0.3 }));
  const floorDiyas = [{ x: 7, by: 28, s: 9.1 }, { x: 89, by: 28, s: 4.4 }, { x: 15, by: 35, s: 2.2 }, { x: 81, by: 35, s: 6.6 }];
  const diyas = [...ledgeDiyas, ...floorDiyas];
  const cx = 48, cy = 27.5, R = 27;
  const flick = (t, s) => 0.75 + 0.25 * Math.sin(t * 11 + s * 3) * Math.sin(t * 6.7 + s);

  function drawDiya(d, t) {
    const { x, by, s } = d;
    const f = flick(t, s);
    const tip = Math.sin(t * 9 + s * 2);
    // flame
    g.set(x + (tip > 0.6 ? 1 : tip < -0.6 ? -1 : 0), by - 4, f > 0.8 ? "'" : "`", K.flY);
    g.set(x, by - 3, f > 0.7 ? "▲" : "◆", f > 0.85 ? K.flW : K.flY);
    g.set(x - 1, by - 2, "▄", K.fl); g.set(x, by - 2, "█", f > 0.8 ? K.flW : K.flY); g.set(x + 1, by - 2, "▄", K.fl);
    // bowl with a spout to the right
    for (let i = -4; i <= 4; i++) g.set(x + i, by - 1, i === -4 || i === 4 ? "▄" : "▓", Math.abs(i) < 2 ? K.bowlH : K.bowlL);
    g.set(x + 5, by - 1, "▄", K.bowl);
    for (let i = -3; i <= 3; i++) g.set(x + i, by, i % 2 ? "▓" : "█", i % 2 ? K.bowlD : K.bowl);
    g.set(x - 4, by, "▀", K.bowl); g.set(x + 4, by, "▀", K.bowl);
  }

  return (t) => {
    g.clear();
    const flames = diyas.map((d) => [d.x, d.by - 3, flick(t, d.s)]);
    // night sky warmed by lamp glow
    for (let y = 0; y < LEDGE; y++) for (let x = 0; x < cols; x++) {
      let glow = 0;
      for (const [fx, fy, f] of flames) {
        const dx = (x - fx) * 0.5, dy = y - fy;
        const d2 = dx * dx + dy * dy;
        if (d2 < 100) glow += Math.exp(-Math.sqrt(d2) / 3.2) * f;
      }
      const n = fbm(x * 0.05 + t * 0.03, y * 0.12, 3);
      const v = clamp(0.12 + (y / LEDGE) * 0.2 + (n - 0.5) * 0.3 + glow * 0.75);
      g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[Math.min(11, Math.floor(v * 12))]);
    }
    // stone ledge
    for (let x = 0; x < cols; x++) {
      g.set(x, LEDGE, "▀", K.stoneL);
      g.set(x, LEDGE + 1, x % 8 === 0 ? "│" : "▓", K.stone);
    }
    // floor with rangoli
    const rot = t * 0.18, rot2 = -t * 0.12, rot3 = t * 0.06;
    for (let y = LEDGE + 2; y < rows; y++) for (let x = 0; x < cols; x++) {
      const dx = x - cx, dy = (y - cy) * 2.75;
      const r = Math.hypot(dx, dy) / R, th = Math.atan2(dy, dx);
      if (r > 1.02) {
        let glow = 0;
        for (const [fx, fy, f] of flames) {
          const ex = (x - fx) * 0.5, ey = y - fy;
          const d2 = ex * ex + ey * ey;
          if (d2 < 64) glow += Math.exp(-Math.sqrt(d2) / 2.6) * f;
        }
        const n = fbm(x * 0.2, y * 0.4, 2);
        const v = clamp(0.25 + (n - 0.5) * 0.5 + glow * 0.6);
        g.set(x, y, SH[1 + Math.min(3, Math.floor(v * 4))], KEYS[12 + Math.min(5, Math.floor(v * 6))]);
        continue;
      }
      let ch = "▓", co = K.yellow;
      if (r < 0.1) { ch = "●"; co = K.flW; }
      else if (r < 0.3) {
        const petal = r < 0.3 * (0.45 + 0.55 * Math.abs(Math.cos(4 * th + rot)));
        ch = petal ? "▓" : "▒"; co = petal ? K.magenta : K.orange;
      } else if (r < 0.35) {
        ch = Math.floor((th + rot2) * 7) % 2 ? "•" : "●"; co = K.white;
      } else if (r < 0.63) {
        const rho = (r - 0.35) / 0.28;
        const a = (th / TAU) * 12 + rot2 * 2;
        const idx = ((Math.floor(a) % 12) + 12) % 12;
        const w = Math.abs(fract(a) - 0.5) * 2;           // 0 at petal middle
        const petal = w < (1 - rho) * 0.95 + 0.05;
        ch = petal ? (w < 0.3 ? "█" : "▓") : "▒";
        co = petal ? K[RCOL[idx % RCOL.length]] : K.blueD;
      } else if (r < 0.7) {
        ch = "◆"; co = Math.floor((th / TAU) * 40 + t * 2) % 2 ? K.yellow : K.white;
      } else {
        const a = (th / TAU) * 16 + rot3 * 3;
        const bump = 1 - Math.abs(fract(a) - 0.5) * 2;
        const edge = 0.7 + 0.3 * (0.35 + 0.65 * bump);
        if (r > edge) {
          ch = "░"; co = KEYS[13];
        } else {
          const band = (r - 0.7) / (edge - 0.7);
          ch = band > 0.8 ? "▒" : "▓";
          co = band > 0.8 ? K.white : Math.floor(a) % 2 ? K.pink : K.purple;
        }
      }
      g.set(x, y, ch, co);
    }
    // marigold garland in scallops across the top
    for (let x = 0; x < cols; x++) {
      const u = fract(x / 16);
      const yy = Math.round(0.4 + 3.2 * (1 - ((u - 0.5) * 2) ** 2));
      const fl = Math.sin(x * 1.7 + t * 2) > 0;
      g.set(x, yy, "●", fl ? K.mari : K.mariY);
      g.set(x, yy - 1, "▄", (x % 3) ? K.mari : K.mariY);
      if (x % 16 === 0) {
        g.set(x, 1, "●", K.mariY); g.set(x, 2, "│", K.leafD); g.set(x, 3, "◆", K.leaf); g.set(x, 4, "▼", K.leaf);
      }
    }
    for (const d of diyas) drawDiya(d, t);
    return g.frame();
  };
}
