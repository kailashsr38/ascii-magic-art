/* gully-cricket-match: a gully cricket over in a narrow lane, the bowler runs in, the batter lofts it over the houses and the fielder throws up his arms. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, lerp } from "../lib/kit.js";

const SKY = gradient(["#4a9ae8", "#8ac4f0", "#d8ecf4"], 4);                          // 0..3
const GROUND = gradient(["#b08a58", "#c49c64", "#d4b07a", "#e2c48e", "#ecd4a4"], 8);   // 4..11
const WALLS = ["#f0a0b8", "#f4d060", "#60c8c0", "#b8e070", "#c0a8f0", "#f4b070"];      // 12..17
const WALLD = ["#b86a80", "#b89630", "#2e8a84", "#7aa040", "#8070b0", "#b87a40"];      // 18..23
const NAMED = {
  win: "#2a2030", grill: "#5a5060", door: "#6a3a20", skin: "#7a3e1e", hair: "#1a1010",
  shirtA: "#ff4a3a", shirtB: "#2a7aff", shirtC: "#ffd040", shorts: "#2a2a3a", shortsB: "#e8e8e8",
  bat: "#f0c880", ball: "#e02020", brick: "#c0502a", brickD: "#7a2a14", chalk: "#ffffff",
  wire: "#2a2a2a", cloth1: "#ff6ab0", cloth2: "#ffe04a", cloth3: "#4ad0ff", drain: "#3a3a3a",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[24 + i]));

export const meta = {
  slug: "gully-cricket-match",
  name: "Gully Cricket Over",
  category: "india",
  note: "A gully cricket over in a narrow lane of painted houses: the bowler runs in, the batter lofts it over the rooftops and the fielder throws up his arms.",
  tags: ["cricket", "gully", "india", "street", "sport", "hero"],
  cols: 100, rows: 34, fps: 24,
  palette: palette([...SKY, ...GROUND, ...WALLS, ...WALLD, ...Object.values(NAMED)]),
};

const FY = 32;          // feet row
const WALL_BOTTOM = 24;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const bg = [];
  const r = rng(21);
  const houses = [];
  for (let x = 0; x < cols;) { const w = 14 + Math.floor(r() * 8); houses.push({ x, w, top: 2 + Math.floor(r() * 4), c: houses.length % 6 }); x += w; }
  const houseAt = (x) => houses.find((h) => x >= h.x && x < h.x + h.w);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const h = houseAt(x);
    if (y > WALL_BOTTOM) {
      const n = fbm(x * 0.1, y * 0.4, 3, 2);
      if (y === WALL_BOTTOM + 1) { bg.push(["▄", K.drain]); continue; }
      const v = clamp(0.3 + ((y - WALL_BOTTOM) / 8) * 0.5 + (n - 0.5) * 0.45);
      bg.push([n > 0.62 ? "▓" : "█", KEYS[4 + Math.min(7, Math.floor(v * 8))]]);
      continue;
    }
    if (y < h.top) { bg.push(["█", KEYS[Math.min(3, y)]]); continue; }
    const lx = x - h.x, ly = y - h.top;
    const edge = lx >= h.w - 2;
    let ch = "█", co = KEYS[(edge ? 18 : 12) + h.c];
    if (ly === 0) { ch = "▀"; co = KEYS[18 + h.c]; }
    const wy = (ly - 3) % 7, wx = (lx - 3) % 7;
    if (ly >= 3 && ly < 19 && wy >= 0 && wy < 4 && wx >= 0 && wx < 4 && lx < h.w - 3) { ch = wx % 2 ? "▓" : "█"; co = wx % 2 ? K.grill : K.win; }
    if (ly >= 17 && y <= WALL_BOTTOM && lx >= Math.floor(h.w / 2) && lx < Math.floor(h.w / 2) + 3 && h.c % 2 === 0) { ch = "█"; co = K.door; }
    const n = fbm(x * 0.3, y * 0.5, 2, 7);
    if (ch === "█" && co === KEYS[12 + h.c] && n > 0.66) ch = "▓";
    bg.push([ch, co]);
  }
  // overhead wires and a washing line
  const wires = [];
  for (let x = 0; x < cols; x++) { wires.push([x, Math.round(1.5 + Math.sin(x / cols * Math.PI) * 2.2)]); }
  const clothes = [[18, K.cloth1], [22, K.cloth2], [26, K.cloth3], [60, K.cloth2], [64, K.cloth1]];

  function limb(x0, y0, x1, y1, co, thick) {
    g.line(x0, y0, x1, y1, "█", co);
    if (thick) g.line(x0 + 1, y0, x1 + 1, y1, "█", co);
  }
  // a kid about 14 rows tall; offsets are relative to the left shoulder column
  function person(x, pose, shirt, shorts, face) {
    x = Math.round(x);
    const hy = FY - 14;
    g.text(x, hy, "▄██▄", K.hair);
    g.text(x, hy + 1, "████", K.skin);
    g.text(x, hy + 2, "▀██▀", K.skin);
    if (face < 0) g.set(x, hy + 1, "▐", K.hair); else g.set(x + 3, hy + 1, "▌", K.hair);
    limb(x, FY - 5, x + pose.f1, FY, K.skin, true);
    limb(x + 2, FY - 5, x + 2 + pose.f2, FY, K.skin, true);
    g.fill(x - 1, FY - 11, 6, 5, "█", shirt);
    g.text(x - 1, FY - 11, "▄", K.hair === shirt ? shirt : shirt);
    g.fill(x - 1, FY - 6, 6, 2, "█", shorts);
    const sl = face < 0 ? x - 1 : x + 4, sr = face < 0 ? x + 4 : x - 1;
    limb(sl, FY - 10, sl + pose.a1[0], FY - 10 + pose.a1[1], K.skin);
    limb(sr, FY - 10, sr + pose.a2[0], FY - 10 + pose.a2[1], K.skin);
  }

  const C = 6.4;
  return (t) => {
    g.clear();
    for (let i = 0; i < N; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    for (const [x, y] of wires) g.set(x, y, "─", K.wire);
    for (const [x, c] of clothes) {
      const sway = Math.round(Math.sin(t * 1.5 + x) * 0.6);
      g.set(x + sway, 4, "▀", c); g.fill(x - 1 + sway, 5, 3, 2, "█", c);
    }
    const n = Math.floor(t / C), lt = t - n * C;
    // score chalked on the wall, fixed width
    const runs = String(((n * 6 + 18) % 1000)).padStart(3, "0");
    g.text(4, 20, "RUNS " + runs + "/2", K.chalk);
    // brick wicket
    for (let k = 0; k < 3; k++) g.text(90, FY - k - 1, k % 2 ? "▄█▄" : "███", k % 2 ? K.brickD : K.brick);
    g.text(90, FY - 4, "▄▄▄", K.brick); g.text(90, FY - 5, "▄▄▄", K.brickD);
    // bowler
    let bx, bpose;
    const stride = (ph) => ({ f1: Math.round(Math.sin(ph) * 2), f2: -Math.round(Math.sin(ph) * 2) });
    if (lt < 1.5) {
      bx = lerp(12, 33, lt / 1.5);
      const s = { f1: Math.round(Math.sin(lt * 12) * 3), f2: -Math.round(Math.sin(lt * 12) * 3) };
      bpose = { ...s, a1: [-Math.round(Math.sin(lt * 12) * 3), 4], a2: [Math.round(Math.sin(lt * 12) * 3), 4] };
    } else if (lt < 2.1) {
      const p = (lt - 1.5) / 0.6;
      bx = lerp(33, 36, p);
      const a = Math.PI / 2 + p * Math.PI * 2;
      bpose = { f1: 2, f2: -2, a1: [Math.round(Math.cos(a) * 5), Math.round(Math.sin(a) * 4)], a2: [4, -1] };
    } else if (lt < 4.4) {
      bx = 36; bpose = { f1: 2, f2: -1, a1: [1, 4], a2: [-1, 4] };
    } else {
      const p = (lt - 4.4) / (C - 4.4);
      bx = lerp(36, 12, p);
      const s = stride(lt * 9);
      bpose = { ...s, a1: [1, 4], a2: [0, 4] };
    }
    person(bx, bpose, K.shirtA, K.shorts, 1);
    // batter, facing left
    const tx = 81;
    let bat;          // bat angle from the hands, 0 = pointing left, PI/2 = down
    if (lt < 1.6) bat = Math.PI * 0.6;
    else if (lt < 2.35) bat = lerp(Math.PI * 0.6, -Math.PI * 0.75, clamp((lt - 1.6) / 0.5));
    else if (lt < 2.6) bat = lerp(-Math.PI * 0.75, Math.PI * 0.35, (lt - 2.35) / 0.25);
    else if (lt < 3.0) bat = lerp(Math.PI * 0.35, -Math.PI * 0.35, (lt - 2.6) / 0.4);
    else bat = lt < 4.6 ? -Math.PI * 0.35 : lerp(-Math.PI * 0.35, Math.PI * 0.6, clamp((lt - 4.6) / 0.6));
    const hx = tx - 2, hy = FY - 8;
    person(tx, { f1: -3, f2: 2, a1: [-1, 2], a2: [-6, 2] }, K.shirtB, K.shortsB, -1);
    const ex = hx - Math.cos(bat) * 9, ey = hy + Math.sin(bat) * 4.5;
    g.line(hx, hy, ex, ey, "█", K.bat); g.line(hx, hy + 1, ex, ey + 1, "█", K.bat);
    g.set(hx, hy, "█", K.hair);
    // fielder near the wall, arms up when the ball sails over
    const up = lt > 2.9 && lt < 4.6;
    const jump = up && Math.sin((lt - 2.9) * 9) > 0 ? -1 : 0;
    const fx = 55;
    const fp = up ? { f1: -1, f2: 1, a1: [-2, -6], a2: [2, -6] } : { f1: -1, f2: 1, a1: [-1, 4], a2: [1, 4] };
        person(fx, fp, K.shirtC, K.shorts, -1);
    // the ball
    let ball = null;
    if (lt >= 1.95 && lt < 2.25) { const p = (lt - 1.95) / 0.3; ball = [lerp(41, 62, p), lerp(FY - 15, FY, p * p)]; }
    else if (lt >= 2.25 && lt < 2.5) { const p = (lt - 2.25) / 0.25; ball = [lerp(62, 72, p), lerp(FY, FY - 8, Math.sqrt(p))]; }
    else if (lt >= 2.5 && lt < 4.2) { const p = (lt - 2.5) / 1.7; ball = [lerp(72, 20, p), FY - 8 - 46 * p + 30 * p * p]; }
    else if (lt < 1.95 && lt > 1.5) ball = null;
    if (ball && ball[1] >= 0) {
      g.set(ball[0], ball[1], "●", K.ball);
      if (lt >= 2.5) g.set(ball[0] + 1, ball[1] + 1, "·", K.chalk);
    }
    if (lt > 2.5 && lt < 3.4) { if (lt < 2.95) g.text(66, FY - 14, "THWACK!", K.chalk); else g.text(68, FY - 14, "SIX!", K.chalk); }
    return g.frame();
  };
}
