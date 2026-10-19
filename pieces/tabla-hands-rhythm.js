/* tabla-hands-rhythm: two hands play a sixteen beat teental theka on a tabla pair, each stroke rippling the drum heads while the bols light up above. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const ROOM = gradient(["#12070a", "#24100e", "#3a1a12", "#4e2416"], 6);          // 0..5
const COPPER = gradient(["#3a1608", "#7a3414", "#b45a24", "#e08a44", "#ffc07a"], 8); // 6..13
const WOOD = gradient(["#24120a", "#4a2414", "#6e3a1e", "#93552c"], 6);          // 14..19
const HEAD = gradient(["#8a7a5a", "#c8b48a", "#e8d8b0", "#f6ead0"], 5);          // 20..24
const RUG = gradient(["#4a0a14", "#7a1420", "#a8202c"], 4);                       // 25..28
const NAMED = {
  syahi: "#14100e", syahiL: "#3a3430", strap: "#d8c49a", strapD: "#9a845a", block: "#5a2e14",
  skin: "#b0703e", skinL: "#d08e58", skinD: "#7a4424", sleeve: "#f2ece0", sleeveD: "#bcb4a6",
  gold: "#ffd04a", goldD: "#a08030", dim: "#8a6a5a", bright: "#fff4d0", ring: "#3a5aa0", ringL: "#6a8ad0",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[29 + i]));

export const meta = {
  slug: "tabla-hands-rhythm",
  name: "Tabla Teental Hands",
  category: "india",
  note: "Two hands play a sixteen beat teental theka on a tabla pair, each stroke rippling the drum heads while the bols light up in a strip above.",
  tags: ["tabla", "music", "india", "rhythm", "drums", "loader"],
  cols: 90, rows: 34, fps: 24,
  palette: palette([...ROOM, ...COPPER, ...WOOD, ...HEAD, ...RUG, ...Object.values(NAMED)]),
};

const BOLS = ["dha", "dhin", "dhin", "dha", "dha", "dhin", "dhin", "dha", "dha", "tin", "tin", "ta", "ta", "dhin", "dhin", "dha"];
const USE = { dha: [1, 1], dhin: [1, 1], tin: [0, 1], ta: [0, 1], na: [0, 1], ge: [1, 0] };
const B = 0.36;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const BAY = { cx: 26, cy: 17, rx: 15, ry: 4, sx: -2, sy: -0.6, sr: 0.42 };
  const DAY = { cx: 63, cy: 15, rx: 10, ry: 3.2, sx: 0, sy: 0, sr: 0.45 };
  // static layer: room, rug, drum bodies
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y >= 25) {
      const band = (y - 25) % 4 === 0;
      const m = (x + (y % 2) * 3) % 6 === 0;
      bg.push(band ? ["▀", K.goldD] : m ? ["◆", K.gold] : [((x + y) % 2) ? "▓" : "█", KEYS[25 + ((x >> 2) + y) % 4]]);
      continue;
    }
    const n = fbm(x * 0.06, y * 0.12, 3, 4);
    const v = clamp(0.25 + y / 50 + (n - 0.5) * 0.5);
    bg.push([n > 0.58 ? "▓" : "█", KEYS[Math.min(5, Math.floor(v * 6))]]);
  }
  const put = (x, y, ch, co) => { if (x >= 0 && y >= 0 && x < cols && y < rows) bg[x + y * cols] = [ch, co]; };
  // cushion rings under each drum
  for (const d of [BAY, DAY]) for (let x = d.cx - d.rx - 3; x <= d.cx + d.rx + 3; x++) { put(x, 28, "█", K.ring); put(x, 29, "▀", K.ringL); }
  // bayan: copper bowl that bulges then tucks in
  for (let y = BAY.cy; y <= 28; y++) {
    const f = (y - BAY.cy) / (28 - BAY.cy);
    const w = BAY.rx * (1 + 0.18 * Math.sin(f * Math.PI * 0.9)) * (f > 0.8 ? 1 - (f - 0.8) * 1.4 : 1);
    for (let x = Math.round(BAY.cx - w); x <= Math.round(BAY.cx + w); x++) {
      const u = (x - BAY.cx) / w;
      const lum = clamp(0.25 + 0.75 * Math.sqrt(Math.max(0, 1 - u * u)) - u * 0.35 - f * 0.25);
      put(x, y, lum > 0.85 ? "█" : "▓", KEYS[6 + Math.min(7, Math.floor(lum * 8))]);
    }
  }
  // dayan: wooden barrel with leather straps and tuning blocks
  for (let y = DAY.cy; y <= 28; y++) {
    const f = (y - DAY.cy) / (28 - DAY.cy);
    const w = DAY.rx * (1 + 0.12 * Math.sin(f * Math.PI));
    for (let x = Math.round(DAY.cx - w); x <= Math.round(DAY.cx + w); x++) {
      const u = (x - DAY.cx) / w;
      const lum = clamp(0.3 + 0.7 * Math.sqrt(Math.max(0, 1 - u * u)) - u * 0.3);
      const strap = ((x - DAY.cx + 40) % 3) === 0;
      const blk = y >= 22 && y <= 24 && ((x - DAY.cx + 40) % 5) < 3;
      if (blk) put(x, y, y === 22 ? "▄" : "█", y === 24 ? K.block : K.block);
      else if (strap) put(x, y, "│", lum > 0.6 ? K.strap : K.strapD);
      else put(x, y, "█", KEYS[14 + Math.min(5, Math.floor(lum * 6))]);
    }
  }

  function head(d, ripples) {
    for (let y = Math.floor(d.cy - d.ry - 1); y <= Math.ceil(d.cy + d.ry); y++) for (let x = d.cx - d.rx - 1; x <= d.cx + d.rx + 1; x++) {
      const nx = (x - d.cx) / d.rx, ny = (y - d.cy) / d.ry;
      const r = Math.hypot(nx, ny);
      if (r > 1.05) continue;
      if (r > 0.88) { g.set(x, y, "█", y < d.cy ? K.block : WOODK(1)); continue; }
      const sr = Math.hypot((x - d.cx - d.sx) / d.rx, (y - d.cy - d.sy) / d.ry);
      let ch = "█", co = KEYS[20 + Math.min(4, Math.floor(clamp(0.9 - nx * 0.3 - ny * 0.2) * 5))];
      if (sr < d.sr) { ch = "█"; co = sr < d.sr - 0.12 ? K.syahi : K.syahiL; }
      else if (r > 0.78) { ch = "▓"; co = KEYS[21]; }
      for (const rr of ripples) if (Math.abs(r - rr) < 0.08) { ch = sr < d.sr ? "▓" : "▒"; co = sr < d.sr ? K.syahiL : KEYS[20]; }
      g.set(x, y, ch, co);
    }
  }
  function WOODK(i) { return KEYS[14 + i]; }
  function hand(px, py, side) {
    // forearm in a white sleeve, coming in from the side
    const ex = side < 0 ? -3 : cols + 2, ey = 6;
    for (let k = 0; k < 5; k++) g.line(px + 4 + k - 2, py - 3, ex, ey + k - 2, "█", k === 0 || k === 4 ? K.sleeveD : K.sleeve);
    g.text(px, py - 3, "▄▄▄▄▄▄▄▄▄", K.skinD);
    g.text(px, py - 2, "█████████", K.skin);
    g.text(px, py - 1, "█████████", K.skinL);
    g.text(px, py - 1, "▐", K.skinD);
    g.text(px + 1, py, "█▌█▌█▌█", K.skinL);
  }
  return (t) => {
    g.clear();
    for (let i = 0; i < N; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    const beat = Math.floor(t / B), s = t - beat * B, cur = ((beat % 16) + 16) % 16;
    // last strike per hand and recent ripples
    const last = [99, 99], rip = [[], []];
    for (let k = 0; k < 6; k++) {
      const bi = (((beat - k) % 16) + 16) % 16, ago = s + k * B;
      const u = USE[BOLS[bi]];
      for (let h = 0; h < 2; h++) if (u[h]) {
        if (last[h] === 99) last[h] = ago;
        if (ago < 0.5) rip[h].push(ago * 2.2);
      }
    }
    head(BAY, rip[0]);
    head(DAY, rip[1]);
    const lift = (a) => (a < 0.06 ? 0 : Math.min(4, (a - 0.06) * 26));
    hand(BAY.cx - 3, Math.round(BAY.cy - 1 - lift(last[0])), -1);
    hand(DAY.cx - 4, Math.round(DAY.cy - 1 - lift(last[1])), 1);
    // bol strip on its own dark band
    g.fill(0, 0, cols, 4, "█", KEYS[0]);
    g.hline(0, cols - 1, 4, "▀", K.goldD);
    const x0 = 3;
    for (let i = 0; i < 16; i++) {
      const x = x0 + i * 5 + Math.floor(i / 4) * 2;
      const on = i === cur;
      const w = BOLS[i];
      g.text(x, 1, w, on ? K.bright : K.dim);
      if (on) g.text(x, 2, "▀▀▀▀".slice(0, w.length), K.gold);
      if (i % 4 === 0) g.set(x, 3, i === 0 ? "X" : i === 8 ? "0" : String(i / 4 + 1), i === 0 ? K.gold : K.dim);
      if (i % 4 === 3 && i < 15) g.set(x + 5, 1, "│", K.goldD);
    }
    // the spoken bol drifting up from the drum it was played on
    for (let k = 0; k < 3; k++) {
      const ago = s + k * B;
      const bi = (((beat - k) % 16) + 16) % 16;
      const w = BOLS[bi], u = USE[w];
      const y = Math.round(10 - ago * 7);
      if (y < 6) continue;
      const x = u[0] && u[1] ? 44 : u[1] ? 72 : 20;
      g.text(x - (w.length >> 1), y, w.toUpperCase(), k === 0 ? K.bright : K.gold);
    }
    return g.frame();
  };
}
