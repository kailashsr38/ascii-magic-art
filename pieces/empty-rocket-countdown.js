/* empty-rocket-countdown: a rocket vents steam on its pad through a countdown, then lifts off, a feature coming soon state. */
import { Grid, palette, clamp, bigText } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#f6f8fa", "#c9d1d9", "#8b949e", "#ff7b72", "#ffa657", "#f2cc60", "#fff3c4", "#6e7681"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a-c hull light to dark, d-g flame, h steel

export const meta = {
  slug: "empty-rocket-countdown",
  name: "Coming Soon Rocket",
  category: "empty-states",
  note: "A small rocket vents steam on its pad through a ten second countdown, then lifts off on a column of flame.",
  tags: ["empty-state", "coming-soon", "launch", "countdown", "website"],
  cols: 60, rows: 18, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ROCKET = ["   ▲   ", "  ▟█▙  ", "  █●█  ", "  ███  ", "  ███  ", " ▟███▙ ", " ▀ ▀ ▀ "];
const COUNT = 10, FLY = 3, REST = 1, PERIOD = COUNT + FLY + REST;
const hash = (n) => { let h = Math.imul(n ^ 0x27d4eb2f, 0x165667b1); h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); return ((h ^ (h >>> 13)) >>> 0) / 4294967296; };

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const RX = 8, PAD = 15;
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const lt = t % PERIOD;
    const fly = lt - COUNT;
    const rise = fly > 0 ? 0.5 * 5 * fly * fly : 0;
    const ry = PAD - ROCKET.length - Math.round(rise);
    // smoke at the pad after ignition, steam puffs before it
    if (fly > -0.3 && fly < FLY) {
      const f = clamp((fly + 0.3) / 1.2);
      for (let k = 0; k < 14; k++) {
        const side = k % 2 ? 1 : -1, d = (1 + (k >> 1)) * 1.4 * f;
        S(RX + 3 + side * d, PAD - 1 - (k % 3 === 0 ? 1 : 0), d > 6 ? "░" : "▒", "b");
      }
    } else if (fly <= 0) {
      for (let k = 0; k < 3; k++) {
        const a = (lt * 0.9 + k / 3) % 1;
        S(RX - 1 - a * 5, PAD - 1 - a * 1.5, a < 0.5 ? "▒" : "░", a < 0.5 ? "b" : "c");
      }
    }
    // flame under the rocket while flying
    if (fly > -0.2 && ry + ROCKET.length < H - 1) {
      const len = 2 + Math.min(4, Math.floor(rise * 0.6));
      for (let j = 0; j < len; j++) for (let i = -1; i <= 1; i++) {
        if (j > 0 && Math.abs(i) === 1 && hash(Math.floor(t * 20) * 7 + j * 3 + i) < j / len) continue;
        S(RX + 3 + i, ry + ROCKET.length + j, j < 1 ? "█" : j < len - 1 ? "▓" : "░", "gfed"[Math.min(3, j)]);
      }
    }
    // tower and pad
    for (let y = 4; y < PAD; y++) S(RX + 9, y, "╫", "h");
    if (fly < 0) S(RX + 7, 8, "═", "h"), S(RX + 8, 8, "═", "h");
    for (let i = 2; i < 22; i++) S(i, PAD, "▀", i >= RX && i <= RX + 6 ? "1" : "3");
    // rocket
    ROCKET.forEach((row, r) => { for (let i = 0; i < row.length; i++) if (row[i] !== " ") S(RX + i, ry + r, row[i], row[i] === "●" ? "5" : row[i] === "▲" ? "7" : r >= 5 ? "7" : i < 3 ? "a" : "b"); });
    // copy on the right
    const X = 26, TW = W - X - 2;
    g.text(X, 2, fit("Coming soon", TW), "0");
    g.text(X, 3, fit("Smart folders are almost ready.", TW), "1");
    const secs = fly < 0 ? Math.ceil(COUNT - lt) : 0;
    g.text(X, 7, fly < 0 ? "T minus" : "Liftoff", fly < 0 ? "1" : "6");
    bigText(g, X + 9, 5, String(secs).padStart(2, "0"), fly < 0 ? "0" : "6");
    g.text(X, 11, fit("We'll email you the day it ships.", TW), "2");
    g.box(X, 13, 13, 3, "round", "5"); g.text(X + 2, 14, "Notify me", "5");
    g.text(X + 15, 14, "Read the plan", "2");
    return g.frame();
  };
}
