/* cassette-tape-reels: a mixtape cassette playing in a deck, reels spinning as tape winds from one side to the other. */
import { Grid, palette, gradient, KEYS, fbm, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const DECK = add(gradient(["#0c0d10", "#191b20", "#262930", "#363a44"], 4));
const SHELL = add(gradient(["#121216", "#1e1e24", "#2c2c34", "#3e3e48"], 4));
const LABEL = add(["#f2e8d0", "#e0d2b2", "#ff6a3a", "#ffb03a", "#e8384a", "#2a2a3a", "#3a5aa8"]);
const TAPE = add(gradient(["#2a1408", "#4a2412", "#6a361c", "#8a4a26"], 4));
const WIN = add(["#0a0c10", "#161a22", "#24303c"]);
const HUB = add(["#f4f4f0", "#b8b8b4", "#6a6a6a"]);
const UI = add(["#e6edf3", "#8b949e", "#ff3a3a", "#5aff7a", "#ffd84a", "#484f58"]);

export const meta = {
  slug: "cassette-tape-reels",
  name: "Cassette Tape Reels",
  category: "music",
  note: "A handwritten mixtape plays in a deck, its reels turning as the tape winds across, then rewinding fast to the start.",
  tags: ["cassette", "mixtape", "retro", "tape", "loader", "hero"],
  cols: 92, rows: 32, fps: 30,
  palette: palette(P),
};

const CX = [31, 60], CY = 13.5, RMIN = 3.6, RMAX = 7.4, PLAY = 26, REW = 4;
const AREA = RMIN * RMIN + RMAX * RMAX;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const X0 = 6, X1 = 85, Y0 = 1, Y1 = 27;
  const base = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let ch = "▒", co = KEYS[DECK + Math.min(3, Math.floor(clamp(0.4 + (fbm(x * 0.03, y * 0.6, 2) - 0.5) * 0.6) * 4))];
    const inShell = x >= X0 && x <= X1 && y >= Y0 && y <= Y1 && !((x - X0 < 2 || X1 - x < 2) && (y === Y0 || y === Y1));
    if (inShell) {
      const edge = x === X0 || x === X1 || y === Y0 || y === Y1;
      const v = clamp(0.5 + (fbm(x * 0.2, y * 0.3, 2, 3) - 0.5) * 0.3 - (edge ? 0.3 : 0) + (y < 4 ? 0.15 : 0));
      ch = "█"; co = KEYS[SHELL + Math.min(3, Math.floor(v * 4))];
      // label
      if (x >= X0 + 4 && x <= X1 - 4 && y >= 3 && y <= 20) {
        co = KEYS[LABEL + (y > 17 ? 1 : 0)];
        if (y === 15 || y === 16) co = KEYS[LABEL + (y === 15 ? 2 : 3)];
        if (y === 17) co = KEYS[LABEL + 4];
      }
      // trapezoid lower section
      if (y >= 22 && (x - X0 < (y - 21) * 2 + 4 || X1 - x < (y - 21) * 2 + 4)) co = KEYS[SHELL + 1];
      if (y >= 22 && Math.abs(x - X0 - (y - 21) * 2 - 4) < 1) { ch = "▓"; co = KEYS[SHELL + 3]; }
      if (y >= 22 && Math.abs(X1 - x - (y - 21) * 2 - 4) < 1) { ch = "▓"; co = KEYS[SHELL + 3]; }
    }
    base.push([ch, co]);
  }
  const put = (b, x, y, ch, co) => { const i = x + y * cols; b[i] = [ch, co]; };
  // screws, holes
  for (const [sx, sy] of [[X0 + 2, Y0 + 1], [X1 - 2, Y0 + 1], [X0 + 2, Y1 - 1], [X1 - 2, Y1 - 1], [45, 24]]) put(base, sx, sy, "●", KEYS[HUB + 2]);
  for (const hx of [26, 34, 56, 64]) put(base, hx, 25, "■", KEYS[WIN]);
  const lbl = "late night drive mix";
  return (t) => {
    for (let i = 0; i < base.length; i++) { g.ch[i] = base[i][0]; g.co[i] = base[i][1]; }
    const cyc = t % (PLAY + REW);
    const rew = cyc >= PLAY;
    const u = rew ? 1 - (cyc - PLAY) / REW : cyc / PLAY;
    const rL = Math.sqrt(RMAX * RMAX - u * (RMAX * RMAX - RMIN * RMIN));
    const rR = Math.sqrt(AREA - rL * rL);
    // angles: tape speed over radius, integrated in closed form
    const k = (RMAX * RMAX - RMIN * RMIN) / PLAY, v = 2.2;
    let aR, aL;
    if (!rew) { aR = (2 * v / k) * (Math.sqrt(RMIN * RMIN + k * cyc) - RMIN); aL = (2 * v / k) * (RMAX - Math.sqrt(RMAX * RMAX - k * cyc)); }
    else { const s = (cyc - PLAY) * 9; aR = -s * 1.1; aL = -s * 0.9; }
    // window
    const wx0 = 20, wx1 = 71, wy0 = 8, wy1 = 19;
    for (let y = wy0; y <= wy1; y++) for (let x = wx0; x <= wx1; x++) {
      const corner = (x - wx0 < 2 || wx1 - x < 2) && (y === wy0 || y === wy1);
      if (corner) continue;
      g.set(x, y, "▒", KEYS[WIN + (y < 11 ? 1 : 0)]);
    }
    [[CX[0], rL, aL], [CX[1], rR, aR]].forEach(([cx, r, ang]) => {
      for (let y = Math.floor(CY - r - 1); y <= CY + r + 1; y++) for (let x = Math.floor(cx - r * 2 - 2); x <= cx + r * 2 + 2; x++) {
        const dx = (x - cx) / 2, dy = y - CY, d = Math.hypot(dx, dy);
        const inWin = x >= wx0 && x <= wx1 && y >= wy0 && y <= wy1;
        if (d <= r && inWin) {
          const ring = Math.sin(d * 5) > 0.3;
          g.set(x, y, ring ? "▓" : "█", KEYS[TAPE + Math.min(3, Math.floor((d / RMAX) * 3 + (ring ? 1 : 0)))]);
        }
        if (d <= 3) {
          const a = Math.atan2(dy, dx) - ang;
          const tooth = Math.cos(a * 6) > 0.35;
          if (d < 1.1) g.set(x, y, "█", KEYS[WIN]);
          else if (d < 2.1) g.set(x, y, tooth ? "█" : "▒", tooth ? KEYS[HUB] : KEYS[WIN + 1]);
          else g.set(x, y, "█", KEYS[HUB + 1]);
        }
      }
    });
    // label writing
    g.text(X0 + 6, 4, "A", KEYS[LABEL + 4]);
    g.text(X0 + 10, 4, lbl, KEYS[LABEL + 6]);
    g.text(X1 - 10, 4, "C60", KEYS[LABEL + 5]);
    g.hline(X0 + 10, X1 - 12, 6, "_", KEYS[LABEL + 1]);
    g.text(X0 + 6, 21, "SIDE A", KEYS[UI]);
    g.text(X1 - 15, 21, "NR  ·  TYPE I", KEYS[UI + 1]);
    // exposed tape along the bottom, moving
    for (let x = 22; x <= 69; x++) {
      const m = Math.floor(x + (rew ? 1 : -1) * t * (rew ? 40 : 6)) % 4;
      g.set(x, 27, m === 0 ? "▄" : "▄", m === 0 ? KEYS[TAPE + 3] : KEYS[TAPE + 1]);
    }
    // deck strip
    g.fill(0, 28, cols, 4, "▓", KEYS[DECK + 1]);
    g.hline(0, cols - 1, 28, "▀", KEYS[DECK + 3]);
    g.fill(40, 28, 12, 2, "█", KEYS[HUB + 2]);
    g.text(43, 29, "HEAD", KEYS[DECK]);
    const cnt = rew ? Math.floor(u * 640) : Math.floor(u * 640);
    g.text(3, 30, "COUNT", KEYS[UI + 1]);
    g.text(9, 30, String(cnt).padStart(4, "0"), KEYS[UI + 4]);
    const btn = (x, s, on) => g.text(x, 30, s, on ? KEYS[UI + 3] : KEYS[UI + 5]);
    btn(58, "◄◄", rew); btn(63, "►", !rew); btn(67, "►►", false); btn(72, "■", false);
    g.text(78, 30, rew ? "REWIND" : "PLAY  ", rew ? KEYS[UI + 4] : KEYS[UI + 3]);
    g.set(86, 30, "●", !rew ? KEYS[UI + 3] : KEYS[UI + 4]);
    return g.frame();
  };
}
