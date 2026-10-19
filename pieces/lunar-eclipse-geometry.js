/* lunar-eclipse-geometry: the Moon orbiting Earth and passing through its umbra and penumbra, with the view from Earth inset. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, fract, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sp", gradient(["#0c1022", "#121a34", "#1a2446", "#243058"], 4));
add("sun", gradient(["#ff7a1a", "#ffa62a", "#ffd23a", "#fff2a0"], 4));
add("pen", gradient(["#06080e", "#0a0e18", "#0e1422"], 3));
add("umb", ["#000000", "#030308"]);
add("edge", ["#ff9a5a", "#8a9ac0"]);
add("earth", gradient(["#0e2a5a", "#1a4a8a", "#2e74b8", "#3a8a4a", "#7ab070"], 5));
add("night", ["#0a1424", "#121e34"]);
add("moon", gradient(["#4a4a52", "#8a8a92", "#c8c6c0", "#f4f0e6"], 4));
add("blood", ["#5a1408", "#8a2410", "#b8401c"]);
add("orbit", ["#3a4060", "#7a84b0"]);
add("star", ["#8a90b0"]);
add("ui", ["#ffffff", "#8b949e", "#ffb070", "#7ee787"]);

export const meta = {
  slug: "lunar-eclipse-geometry",
  name: "Lunar Eclipse Geometry",
  category: "science",
  note: "The Moon circles Earth and, at full moon, slides through the penumbra into the dark umbra and turns red, with an inset showing what we see from the ground.",
  tags: ["eclipse", "moon", "astronomy", "earth-science", "education", "science"],
  cols: 104, rows: 30, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const EX = 40, EY = 14, ER = 6, MR = 2.2, RX = 40, RY = 11, PER = 24;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.08, y * 0.2, 3, 21);
  const r = rng(8);
  const stars = Array.from({ length: 60 }, () => [Math.floor(r() * cols), Math.floor(r() * rows)]);
  // shadow half-widths (rows) at a given distance behind Earth
  const umbW = (x) => ER - (x - EX) * 0.04, penW = (x) => ER + (x - EX) * 0.06;
  const shadeAt = (x, y) => {
    if (x <= EX) return 0;
    const d = Math.abs(y - EY);
    return d < umbW(x) ? 2 : d < penW(x) ? 1 : 0;
  };
  return (t) => {
    g.clear();
    const u = fract(t / PER);
    const th = -(TAU * u - 0.75 * Math.sin(TAU * u));    // slow near full moon so the eclipse lingers
    const mx = EX + RX * Math.cos(th), my = EY + RY * Math.sin(th);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols], s = shadeAt(x + 0.5, y + 0.5);
      if (s === 2) g.set(x, y, "▓", K("umb", v > 0.5 ? 1 : 0));
      else if (s === 1) g.set(x, y, "▒", K("pen", Math.min(2, Math.floor(v * 3))));
      else g.set(x, y, v > 0.6 ? "▒" : "░", K("sp", Math.min(3, Math.floor(v * 4))));
    }
    for (const [sx, sy] of stars) if (g.get(sx, sy) === "░") g.set(sx, sy, "·", K("star"));
    // sun on the left edge
    for (let y = 0; y < rows; y++) for (let x = 0; x < 8; x++) {
      const d = Math.hypot(x + 20, (y - EY) * 2) - 24;
      if (d < 0) g.set(x, y, "█", K("sun", clamp(Math.floor(-d / 1.5), 0, 3)));
    }
    // shadow cone edges, traced back toward the sun
    for (let x = 6; x < cols; x++) {
      const back = x < EX;
      if (back && x % 2) continue;
      for (const sg of [-1, 1]) {
        g.set(x, Math.round(EY + sg * umbW(x)), back ? "·" : "─", K("edge", 0));
        g.set(x, Math.round(EY + sg * penW(x)), back ? "·" : "─", K("edge", 1));
      }
    }
    // orbit
    for (let k = 0; k < 160; k++) {
      const a = (k / 160) * TAU;
      const x = Math.round(EX + RX * Math.cos(a)), y = Math.round(EY + RY * Math.sin(a));
      if (x > 8) g.set(x, y, "•", K("orbit", 1));
    }
    // earth: day side faces the sun
    for (let y = EY - ER - 1; y <= EY + ER + 1; y++) for (let x = EX - 2 * ER - 1; x <= EX + 2 * ER + 1; x++) {
      const nx = (x + 0.5 - EX) / (2 * ER), ny = (y + 0.5 - EY) / ER, q = nx * nx + ny * ny;
      if (q > 1) continue;
      const land = fbm(nx * 3 + t * 0.15, ny * 3, 3, 4) > 0.55;
      if (nx < 0.1) g.set(x, y, "█", K("earth", land ? 3 + (q < 0.5 ? 1 : 0) : clamp(Math.floor((1 - q) * 3), 0, 2)));
      else g.set(x, y, "▓", K("night", land ? 1 : 0));
    }
    // moon
    const s = shadeAt(mx, my), deep = Math.abs(my - EY) < umbW(mx) - MR;
    for (let y = Math.floor(my - MR - 1); y <= my + MR + 1; y++) for (let x = Math.floor(mx - 2 * MR - 1); x <= mx + 2 * MR + 1; x++) {
      const nx = (x + 0.5 - mx) / (2 * MR), ny = (y + 0.5 - my) / MR;
      if (nx * nx + ny * ny > 1) continue;
      const cs = shadeAt(x + 0.5, y + 0.5);
      const lit = nx < 0.25;
      if (cs === 2) g.set(x, y, "█", K("blood", deep ? 2 : 1));
      else if (cs === 1) g.set(x, y, "█", K("moon", 1));
      else g.set(x, y, "█", K("moon", lit ? 3 : 1));
    }
    // inset: the Moon as seen from Earth
    const BX = 86, BY = 1, BW = 17, BH = 11;
    g.fill(BX + 1, BY + 1, BW - 2, BH - 2, " ");
    g.box(BX, BY, BW, BH, "round", K("ui", 1));
    g.text(BX + 1, BY + 1, "SEEN FROM EARTH", K("ui", 1));
    const c = Math.cos(th), sn = Math.sin(th);
    const icx = BX + BW / 2, icy = BY + 6;
    const offY = my - EY;
    for (let y = icy - 4; y <= icy + 3; y++) for (let x = BX + 2; x < BX + BW - 2; x++) {
      const nx = (x + 0.5 - icx) / 6.5, ny = (y + 0.5 - icy) / 3.25, q = nx * nx + ny * ny;
      if (q > 1) continue;
      const nz = Math.sqrt(1 - q);
      const waxing = sn > 0;
      const litP = nz * c + nx * Math.sqrt(Math.max(0, 1 - c * c)) * (waxing ? 1 : -1) > 0;
      // the shadow disc, offset by how far the moon is from the shadow axis
      const scale = 3.25 / MR;
      let sh = 0;
      if (mx > EX + 10) {
        const dy = (y + 0.5 - icy) + offY * scale;
        const dyr = Math.abs(dy) / scale, dxr = Math.abs((x + 0.5 - icx) / 2) / scale;
        const dd = Math.hypot(dxr, dyr);
        sh = dd < umbW(mx) ? 2 : dd < penW(mx) ? 1 : 0;
      }
      if (!litP) g.set(x, y, "░", K("night", 1));
      else if (sh === 2) g.set(x, y, "█", K("blood", deep ? 2 : 1));
      else g.set(x, y, "█", K("moon", sh === 1 ? 2 : 3));
    }
    // status
    const umbFrac = s === 2;
    const status = deep ? "TOTAL LUNAR ECLIPSE: sunlight bent through Earth's air turns the Moon red"
      : umbFrac ? "PARTIAL ECLIPSE: part of the Moon is inside the umbra"
      : s === 1 ? "PENUMBRAL ECLIPSE: the Moon dims slightly"
      : c > 0.9 ? "FULL MOON" : c < -0.9 ? "NEW MOON: between Earth and Sun, no eclipse of the Moon possible"
      : sn > 0 ? "WAXING MOON: no eclipse, the Moon is not behind Earth" : "WANING MOON: no eclipse, the Moon is not behind Earth";
    g.text(1, rows - 1, status.padEnd(80), K("ui", deep ? 2 : 0));
    g.text(1, 0, "SUN", K("ui", 0));
    g.text(EX - 2, EY + ER + 1, "EARTH", K("ui", 0));
    g.text(54, EY, "UMBRA", K("edge", 0));
    g.text(54, EY - 9, "PENUMBRA", K("edge", 1));
    g.text(EX - 6, 1, "MOON'S ORBIT", K("orbit", 1));
    g.text(87, 13, "not to scale", K("ui", 1));
    return g.frame();
  };
}
