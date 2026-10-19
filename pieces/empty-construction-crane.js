/* empty-construction-crane: a tower crane trolleys bricks from a pile onto a growing wall, an under construction state. */
import { Grid, palette, clamp } from "../lib/kit.js";

const pal = palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#f2cc60", "#d29922", "#9e6a03", "#c2553a", "#8f3a26", "#6e7681"]);
// 0 text, 1 muted, 2 dim, 3 border, 4 green, 5 blue, 6 orange, 7 red, 8 purple, 9 yellow, a amber, b dark amber, c brick, d dark brick, e steel

export const meta = {
  slug: "empty-construction-crane",
  name: "Construction Crane Panel",
  category: "empty-states",
  note: "A tower crane trolleys bricks one at a time from a pile onto a growing wall, an under construction state.",
  tags: ["empty-state", "construction", "coming-soon", "wip", "website"],
  cols: 60, rows: 20, fps: 24,
  palette: pal,
};

const fit = (s, w) => (s.length <= w ? s : s.slice(0, Math.max(0, w - 2)) + "..");
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const P = 7, PICK = 22, DROP = 40, GROUND = 13, TOPY = 5;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const S = (x, y, c, co) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) g.set(x, y, c, co); };
  const T = (x, y, s, co) => { for (let i = 0; i < s.length; i++) S(x + i, y, s[i], co); };
  const mid = (y, s, co) => { s = fit(s, W - 4); g.text(Math.floor((W - s.length) / 2), y, s, co); };
  const brick = (x, y) => T(x, y, "▓▓▓▓", "c");
  return (t) => {
    g.clear();
    g.box(0, 0, W, H, "round", "3");
    const cyc = Math.floor(t / P), lt = t - cyc * P;
    const laid = cyc % 5;
    const stackTop = GROUND - 1 - laid;
    // phases: lower, lift, travel, lower, lift, return
    let x, y, carry;
    if (lt < 1) { x = PICK; y = TOPY + ease(lt) * (GROUND - 2 - TOPY); carry = false; }
    else if (lt < 2) { x = PICK; y = GROUND - 2 - ease(lt - 1) * (GROUND - 2 - TOPY); carry = true; }
    else if (lt < 3.6) { x = PICK + ease((lt - 2) / 1.6) * (DROP - PICK); y = TOPY; carry = true; }
    else if (lt < 4.6) { x = DROP; y = TOPY + ease(lt - 3.6) * (stackTop - 1 - TOPY); carry = true; }
    else if (lt < 5.4) { x = DROP; y = stackTop - 1 - ease((lt - 4.6) / 0.8) * (stackTop - 1 - TOPY); carry = false; }
    else { x = DROP - ease((lt - 5.4) / 1.6) * (DROP - PICK); y = TOPY; carry = false; }
    const placed = laid + (lt >= 4.6 ? 1 : 0);
    // ground, pile and wall
    for (let i = 2; i < W - 2; i++) S(i, GROUND, "▀", Math.floor(i / 3) % 2 ? "b" : "3");
    brick(PICK - 7, GROUND - 1); brick(PICK + 3, GROUND - 1); brick(PICK - 5, GROUND - 2);
    if (lt < 1) brick(PICK - 2, GROUND - 1);
    for (let k = 0; k < Math.min(5, placed); k++) brick(DROP - 2, GROUND - 1 - k);
    // mast and jib
    const MX = 12;
    for (let yy = 3; yy < GROUND; yy++) { S(MX - 1, yy, "│", "a"); S(MX + 1, yy, "│", "a"); S(MX, yy, yy % 2 ? "╳" : "─", "b"); }
    S(MX, 1, "▲", "a");
    for (let i = 4; i <= 48; i++) S(i, 2, "═", "a");
    for (let i = MX + 2; i <= 48; i++) S(i, 3, i % 2 ? "╲" : "╱", "b");
    T(4, 3, "████", "e"); T(4, 4, "████", "e");
    T(MX - 2, 3, "▐█▌", "9"); T(MX - 1, 4, "▀", "9");
    // trolley, cable, hook and load
    const tx = Math.round(x), hy = Math.round(y);
    T(tx - 1, 3, "▄█▄", "1");
    for (let yy = 4; yy < hy; yy++) S(tx, yy, "│", "2");
    S(tx, hy, "┘", "1");
    if (carry) brick(tx - 2, hy + 1);
    mid(15, "Under construction", "0");
    mid(16, "This section is being built. Check back soon.", "1");
    mid(18, "Follow updates →", "5");
    return g.frame();
  };
}
