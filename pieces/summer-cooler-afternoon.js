/* summer-cooler-afternoon: a hot afternoon indoors, a ceiling fan whirls, a desert cooler blows the curtains about and the wall calendar flips day after day. */
import { Grid, palette, gradient, KEYS, fbm, clamp, rng, fract, TAU, bigText } from "../lib/kit.js";

const WALLU = gradient(["#c8b47a", "#e0cc8e", "#f2e0a4", "#fff0c0"], 6);   // 0..5
const WALLL = gradient(["#2a8a84", "#3aa8a0", "#5ac4b8"], 4);              // 6..9
const FLOOR = gradient(["#5a1a10", "#7a2818", "#9a3a22", "#b84e2e"], 5);   // 10..14
const SUN = gradient(["#ffe8a0", "#fff4c8", "#ffffff"], 3);                // 15..17
const NAMED = {
  ceil: "#f4ecd8", ceilD: "#c8bca0", blade: "#4a3a2c", bladeL: "#7a644e", hub: "#2a2018", blur: "#a89878",
  frame: "#1e5a3a", frameL: "#2e7a50", curtA: "#e0306a", curtB: "#ff6a9a", curtD: "#a01a4a",
  calW: "#fafaf4", calR: "#d81e2a", calK: "#1a1a24", calG: "#3a8a3a", calB: "#4a8ad8", calY: "#ffcc3a", nail: "#3a3a3a",
  cool: "#e8e4d4", coolD: "#a8a494", coolS: "#7a766a", grill: "#2a2a30", pad: "#b8904a", padD: "#7a5a2a",
  wind: "#ffffff", windD: "#e4f4ff", therm: "#e02020", thermT: "#f4f4f4", wheel: "#1a1a1a", paper: "#f4f0e0", paperD: "#b0a890",
};
const NK = Object.keys(NAMED);
const K = {}; NK.forEach((n, i) => (K[n] = KEYS[18 + i]));

export const meta = {
  slug: "summer-cooler-afternoon",
  name: "Hot Afternoon Cooler",
  category: "india",
  note: "A hot afternoon indoors: the ceiling fan whirls, the desert cooler blows the curtains about and the wall calendar flips from one scorching day to the next.",
  tags: ["summer", "india", "home", "fan", "heat", "wallpaper"],
  cols: 100, rows: 36, fps: 24,
  palette: palette([...WALLU, ...WALLL, ...FLOOR, ...SUN, ...Object.values(NAMED)]),
};

const FLOORY = 29, DADO = 21;
const MONTHS = [["MAY", 31], ["JUN", 30]];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const N = cols * rows;
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (y < 2) { bg.push(["█", y ? K.ceilD : K.ceil]); continue; }
    if (y >= FLOORY) {
      const tile = (x % 10 === 0) || ((y - FLOORY) % 3 === 0);
      const n = fbm(x * 0.2, y * 0.5, 2, 3);
      bg.push(tile ? ["▓", KEYS[10]] : [n > 0.6 ? "▓" : "█", KEYS[11 + Math.min(3, Math.floor(clamp(0.3 + (y - FLOORY) / 10 + (n - 0.5) * 0.5) * 4))]]);
      continue;
    }
    const n = fbm(x * 0.05, y * 0.15, 3, 8);
    if (y >= DADO) bg.push([y === DADO ? "▀" : n > 0.6 ? "▓" : "█", y === DADO ? KEYS[6] : KEYS[7 + Math.min(2, Math.floor(clamp(0.5 + (n - 0.5) * 0.8) * 3))]]);
    else bg.push([n > 0.62 ? "▓" : "█", KEYS[Math.min(5, Math.floor(clamp(0.55 + (n - 0.5) * 0.6 - y * 0.01) * 6))]]);
  }
  const put = (x, y, ch, co) => { if (x >= 0 && y >= 0 && x < cols && y < rows) bg[x + y * cols] = [ch, co]; };
  // window with a green grill, glaring outside
  const WX0 = 6, WX1 = 26, WY0 = 7, WY1 = 21;
  for (let y = WY0; y <= WY1; y++) for (let x = WX0; x <= WX1; x++) {
    const edge = x === WX0 || x === WX1 || y === WY0 || y === WY1;
    const bar = (x - WX0) % 5 === 0 || (y - WY0) % 7 === 0;
    const sky = clamp(1 - Math.hypot(x - 20, (y - 9) * 2) / 26);
    put(x, y, edge || bar ? "█" : "█", edge ? K.frame : bar ? K.frameL : KEYS[15 + Math.min(2, Math.floor(sky * 3))]);
  }
  for (let x = WX0 - 2; x <= WX1 + 2; x++) put(x, WY1 + 1, "▀", K.ceilD);
  // sun patch thrown on the floor
  for (let y = FLOORY; y < rows; y++) {
    const s = (y - FLOORY) * 2.2;
    for (let x = Math.round(WX0 + 6 + s); x <= Math.round(WX1 + 6 + s); x++) {
      const bar = (x - Math.round(WX0 + 6 + s)) % 5 === 0;
      if (!bar) put(x, y, (x + y) % 2 ? "▓" : "█", KEYS[15 + ((y - FLOORY) < 3 ? 1 : 0)]);
    }
  }
  // thermometer
  for (let y = 9; y <= 19; y++) put(64, y, "█", y >= 10 ? K.therm : K.thermT);
  put(64, 20, "●", K.therm);
  put(63, 9, "▐", K.thermT); put(65, 9, "▌", K.thermT);
  const label = "46°C";
  for (let i = 0; i < label.length; i++) put(62 + i, 22, label[i], K.calR);
  // the cooler
  const CX0 = 70, CX1 = 96, CY0 = 12, CY1 = 31;
  for (let y = CY0; y <= CY1; y++) for (let x = CX0; x <= CX1; x++) {
    let ch = "█", co = K.cool;
    if (x >= CX1 - 1) co = K.coolS;
    if (y === CY0) { ch = "▄"; co = K.coolD; }
    if (y === CY1) { ch = "▀"; co = K.coolS; }
    if (x <= CX0 + 4 && y > CY0 + 1 && y < CY1 - 1) { ch = (x + y) % 2 ? "▒" : "▓"; co = (x + y) % 3 ? K.pad : K.padD; }
    put(x, y, ch, co);
  }
  put(CX0 + 2, CY1 + 1, "●", K.wheel); put(CX1 - 2, CY1 + 1, "●", K.wheel);
  for (let x = CX0 + 8; x <= CX0 + 16; x++) put(x, CY0 + 1, "▀", K.coolD);
  // newspaper on the floor
  const P = { x: 34, y: FLOORY + 2 };

  return (t) => {
    g.clear();
    for (let i = 0; i < N; i++) { g.ch[i] = bg[i][0]; g.co[i] = bg[i][1]; }
    // cooler louvres swinging, front grill
    const sw = Math.sin(t * 1.4);
    for (let y = 15; y <= 27; y++) for (let x = 78; x <= 93; x++) {
      const row = (y - 15) % 2;
      g.set(x, y, row ? (sw > 0.3 ? "▀" : sw < -0.3 ? "▄" : "█") : "█", row ? K.coolD : K.grill);
    }
    // wind streaks blowing left out of the cooler
    const r = rng(3);
    for (let k = 0; k < 26; k++) {
      const y = 13 + Math.floor(r() * 14), sp = 14 + r() * 10, ph = r();
      const x = 77 - fract(t * sp / 60 + ph) * 60;
      const len = 2 + Math.floor(r() * 3);
      if (x > WX1 + 3) for (let i = 0; i < len; i++) {
        const xx = Math.round(x) + i;
        if (xx >= 78) continue;
        if (xx >= 46 && xx <= 60 && y >= 10 && y <= 27) continue;
        g.set(xx, y + Math.round(Math.sin(x * 0.2 + t) * 0.6), "█", i === 0 ? K.wind : K.windD);
      }
    }
    // curtains blown by the cooler
    for (const [cx, dir] of [[WX0 - 1, 1], [WX1 - 3, -1]]) {
      for (let y = WY0 - 2; y <= WY1 + 2; y++) {
        const f = (y - (WY0 - 2)) / (WY1 - WY0 + 4);
        const off = Math.round(f * f * (3 + 2 * Math.sin(t * 2.3 + y * 0.4 + cx)) * (dir < 0 ? -1 : 1) * -1);
        for (let k = 0; k < 5; k++) g.set(cx + k + off * (dir < 0 ? 1 : 1), y, "█", k === 0 || k === 4 ? K.curtD : k % 2 ? K.curtA : K.curtB);
      }
    }
    for (let x = WX0 - 3; x <= WX1 + 3; x++) g.set(x, WY0 - 3, "▄", K.nail);
    // newspaper corners lifting in the draught
    const lift = Math.sin(t * 3.1) > 0.2;
    g.text(P.x, P.y, "████████", K.paper); g.text(P.x, P.y + 1, "▓▓▓▓▓▓▓▓", K.paperD);
    g.text(P.x + 1, P.y, "▀▀▀", K.paperD); g.text(P.x + 5, P.y, "▀▀", K.paperD);
    g.set(P.x + 8, P.y - (lift ? 1 : 0), lift ? "▄" : "█", K.paper);
    // calendar: a page flips every 1.6 s
    const fp = 1.6, n = Math.floor(t / fp), a = (t - n * fp) / fp;
    let d = 18 + n, m = 0;
    while (d > MONTHS[m % 2][1]) { d -= MONTHS[m % 2][1]; m++; }
    const CX = 46, CY = 11, CW = 15, CH = 16;
    g.set(CX + 7, CY - 1, "▄", K.nail);
    g.fill(CX, CY, CW, CH, "█", K.calW);
    // picture
    for (let y = CY + 1; y < CY + 7; y++) for (let x = CX + 1; x < CX + CW - 1; x++) {
      const hill = CY + 4 + Math.round(Math.sin((x - CX) * 0.7) * 1.2);
      g.set(x, y, "█", y < hill ? K.calB : y === hill ? K.calY : K.calG);
    }
    g.text(CX + 1, CY + 8, MONTHS[m % 2][0], K.calR);
    g.text(CX + CW - 4, CY + 8, DAYS[(n + 1) % 7], n % 7 === 5 ? K.calR : K.calK);
    bigText(g, CX + 4, CY + 10, String(d).padStart(2, "0"), (n + 1) % 7 === 6 ? K.calR : K.calK);
    // the page being torn off curls up from the bottom
    if (a > 0.82) {
      const p = (a - 0.82) / 0.18;
      const top = CY + CH - 1 - Math.floor(p * (CH - 2));
      for (let y = top; y < CY + CH; y++) g.hline(CX, CX + CW - 1, y, "█", K.paper);
      g.hline(CX, CX + CW - 1, CY + CH - 1, "▀", K.paperD);
      g.hline(CX, CX + CW - 1, top, "▄", K.calW);
    }
    // ceiling fan, seen from below
    const FX = 40, FY = 6, ang = t * 6.5;
    g.vline(FX, 2, FY - 1, "█", K.hub);
    const tipAt = (q, rr) => [FX + Math.cos(q) * rr, FY + Math.sin(q) * rr * 0.2];
    for (let k = 0; k < 3; k++) {
      const q = ang + (k * TAU) / 3;
      for (const [lag, ch] of [[0.5, "░"], [0.3, "▒"]]) {
        const [x0, y0] = tipAt(q - lag, 5), [x1, y1] = tipAt(q - lag, 23);
        g.line(x0, y0, x1, y1, ch, K.blur);
      }
    }
    for (let k = 0; k < 3; k++) {
      const q = ang + (k * TAU) / 3;
      for (const [dq, co] of [[0.09, K.blade], [0, K.bladeL], [-0.06, K.blade]]) {
        const [x0, y0] = tipAt(q + dq, 4), [x1, y1] = tipAt(q + dq * 0.6, 24);
        g.line(x0, y0, x1, y1, "█", co);
      }
    }
    g.text(FX - 4, FY - 1, "▄▄▄▄▄▄▄▄▄", K.hub);
    g.text(FX - 5, FY, "███████████", K.hub);
    g.text(FX - 4, FY + 1, "▀▀▀▀▀▀▀▀▀", K.blade);
    return g.frame();
  };
}
