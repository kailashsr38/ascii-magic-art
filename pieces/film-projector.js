/* film-projector: a reel-to-reel film projector in a dark room, beam full of dust throwing a countdown leader on the screen. */
import { Grid, palette, gradient, KEYS, noise2, rng, bigText, clamp, TAU } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const ROOM = add(gradient(["#050408", "#0a0810", "#120e18", "#1a1422"], 5));
const BEAM = add(gradient(["#2a2418", "#4a3e26", "#6e5c36", "#9a844e"], 5));
const DUST = add(["#fff4c4", "#d8c890"]);
const BODY = add(gradient(["#1a1c22", "#2c3038", "#454a56", "#6a7080", "#9aa0b0"], 6));
const REEL = add(["#8a8f9a", "#c8ccd4", "#3a3e46", "#e8ecf2"]);
const FILM = add(["#3a2010", "#6a3a1a"]);
const LENS = add(["#fff8dc", "#ffe08a", "#5a5e6a"]);
const SCREEN = add(gradient(["#3a362e", "#7a7466", "#b4ac98", "#e4dcc4", "#fffaea"], 8));
const INK = add(["#1a1814", "#4a463c"]);
const RED = add(["#e84a3a"]);

export const meta = {
  slug: "film-projector",
  name: "Film Projector",
  category: "things",
  note: "A reel-to-reel film projector whirs in a dark room, reels turning and dust drifting through its beam as a countdown leader plays on the screen.",
  tags: ["film", "cinema", "projector", "retro", "movie", "loader"],
  cols: 90, rows: 32, fps: 24,
  palette: palette(P),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const LX = 33, LY = 18;            // lens
  const S0 = 64, S1 = 88, ST = 3, SB = 27; // screen
  const R = rng(31);
  const dust = Array.from({ length: 60 }, () => [R(), R(), 0.2 + R() * 0.6, R() * TAU]);
  const inBeam = (x, y) => {
    if (x <= LX || x >= S0) return false;
    const u = (x - LX) / (S0 - LX);
    const top = LY - u * (LY - ST), bot = LY + u * (SB - LY);
    return y >= top - 0.2 && y <= bot + 0.2 ? u : false;
  };
  const reel = (cx, cy, r, ang) => {
    for (let y = Math.floor(cy - r / 2) - 1; y <= cy + r / 2 + 1; y++) for (let x = Math.floor(cx - r) - 1; x <= cx + r + 1; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 2, d = Math.hypot(dx, dy);
      if (d > r) continue;
      const a = Math.atan2(dy, dx) + ang;
      const rim = d > r - 1.2;
      const hole = d > r * 0.32 && d < r * 0.8 && Math.cos(a * 3) > 0.45;
      const film = d > r * 0.8 && !rim;
      g.set(x, y, hole ? "▒" : "█", KEYS[rim ? REEL + 1 : hole ? ROOM + 1 : film ? FILM + ((Math.floor(d * 2)) % 2) : d < 1.4 ? REEL + 3 : REEL]);
    }
  };
  return (t) => {
    // room and beam
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const u = inBeam(x, y);
      if (u !== false) {
        const edge = Math.min(y - (LY - u * (LY - ST)), (LY + u * (SB - LY)) - y);
        const v = clamp(0.9 - u * 0.5 - (edge < 1 ? 0.3 : 0) + (noise2(x * 0.2 - t * 0.6, y * 0.4, 3) - 0.5) * 0.25);
        g.set(x, y, v > 0.55 ? "▒" : "░", KEYS[BEAM + Math.min(4, Math.floor(v * 5))]);
      } else {
        const v = clamp(0.3 + (y > 26 ? 0.2 : 0) + noise2(x * 0.1, y * 0.2, 1) * 0.3);
        g.set(x, y, y > 27 ? "▓" : "█", KEYS[ROOM + Math.min(4, Math.floor(v * 4))]);
      }
    }
    for (const [dx, dy, sp, ph] of dust) {
      const u = (dx + t * sp * 0.05) % 1;
      const x = LX + 2 + u * (S0 - LX - 3);
      const top = LY - u * (LY - ST), bot = LY + u * (SB - LY);
      const y = top + ((dy + Math.sin(t * sp + ph) * 0.05 + t * 0.01) % 1) * (bot - top);
      g.set(x, y, sp > 0.6 ? "•" : "·", KEYS[DUST + (sp > 0.5 ? 0 : 1)]);
    }
    // screen with countdown leader
    const n = 8 - (Math.floor(t) % 8);
    const sweep = (t % 1) * TAU;
    const scx = (S0 + S1) / 2, scy = (ST + SB) / 2;
    const flick = 0;
    for (let y = ST; y <= SB; y++) for (let x = S0; x <= S1; x++) {
      const dx = x + 0.5 - scx, dy = (y + 0.5 - scy) * 2;
      const d = Math.hypot(dx, dy);
      let k = 6 - Math.floor(d / 6) - flick;
      const a = (Math.atan2(dx, -dy) + TAU) % TAU;
      if (d < 18 && a < sweep) k -= 2;
      let ch = "█";
      if (Math.abs(d - 9) < 0.7 || Math.abs(d - 16) < 0.7) { k = 1; }
      if (Math.abs(dx) < 0.6 || Math.abs(dy) < 0.8) k = Math.min(k, 2);
      g.set(x, y, ch, KEYS[SCREEN + clamp(k, 0, 7)]);
    }
    bigText(g, Math.round(scx) - 1, Math.round(scy) - 2, String(n), KEYS[INK]);
    for (let y = ST - 1; y <= SB + 1; y++) { g.set(S0 - 1, y, "▐", KEYS[BODY + 1]); g.set(S1 + 1, y, "▌", KEYS[BODY + 1]); }
    // projector body on a stand
    for (let y = 15; y <= 22; y++) for (let x = 8; x <= 30; x++) {
      const edge = y === 15 || y === 22 || x === 8 || x === 30;
      g.set(x, y, edge ? "█" : (x + y) % 6 === 0 ? "▓" : "█", KEYS[BODY + (edge ? 3 : y < 17 ? 4 : 2)]);
    }
    for (let x = 12; x <= 26; x += 3) g.set(x, 20, "─", KEYS[BODY]);
    g.text(10, 17, "◆", KEYS[RED]);
    g.text(26, 17, "●", KEYS[LENS + 1]);
    // lens barrel
    g.text(30, 17, "▄▄▄", KEYS[BODY + 3]); g.text(30, 18, "███", KEYS[BODY + 2]); g.text(30, 19, "▀▀▀", KEYS[BODY + 3]);
    g.set(33, 18, "█", KEYS[LENS]); g.set(32, 18, "▓", KEYS[LENS + 1]);
    // stand
    g.line(19, 23, 13, 31, "█", KEYS[BODY + 2]); g.line(19, 23, 25, 31, "█", KEYS[BODY + 2]); g.line(19, 23, 19, 31, "█", KEYS[BODY + 1]);
    // reels on arms
    g.line(12, 15, 10, 8, "█", KEYS[BODY + 3]); g.line(26, 15, 28, 8, "█", KEYS[BODY + 3]);
    const ang = t * 3;
    reel(10, 7, 7, ang);
    reel(28, 7, 6, ang * 1.2);
    // film path from reels into the gate
    g.line(16, 9, 22, 15, "\\", KEYS[FILM + 1]);
    g.line(22, 10, 18, 15, "/", KEYS[FILM + 1]);
    for (let k = 0; k < 4; k++) g.set(18 + ((k + Math.floor(t * 12)) % 4), 14, "▪", KEYS[FILM]);
    return g.frame();
  };
}
