/* lcd-handheld-game: a pocket LCD game where a figure with a bucket shuffles between three spots to catch falling raindrops. */
import { Grid, palette, rng, bigText } from "../lib/kit.js";

export const meta = {
  slug: "lcd-handheld-game",
  name: "Pocket LCD Rain Catch",
  category: "retro",
  note: "A pocket LCD game where a little figure with a bucket hops between three spots to catch raindrops falling in fixed steps, faint unlit segments showing behind, until three misses end the round.",
  tags: ["retro", "handheld", "lcd", "game", "arcade", "nostalgia"],
  cols: 72, rows: 36, fps: 20,
  palette: palette(["#a3b090", "#93a080", "#1e2618", "#5a6450", "#2a2a30", "#3a3a42", "#4a4a54", "#c8c8d0", "#8a8a96", "#c83a2a", "#ffcf6a", "#e6e6ee", "#101014", "#6a6a76"]),
};

const TICK = 0.32, TICKS = 130;
const COLX = [6, 17, 28];
const DROP_Y = [2, 5, 8, 11];

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  // simulate the whole round once
  const R = rng(17);
  const states = [];
  let drops = [], fig = 1, score = 0, miss = 0, over = 0, splash = -1, caught = -1, lastMove = 0;
  for (let k = 0; k < TICKS; k++) {
    splash = -1; caught = -1; lastMove = 0;
    if (over > 0) { over--; if (over === 0) { score = 0; miss = 0; drops = []; } }
    else {
      drops.forEach((d) => d.s++);
      for (const d of drops.filter((d) => d.s === 4)) { if (d.c === fig) { score++; caught = d.c; } else { miss++; splash = d.c; } }
      drops = drops.filter((d) => d.s < 4);
      if (miss >= 3) { over = 8; drops = []; }
      else {
        const busy = new Set(drops.filter((d) => d.s === 0).map((d) => d.c));
        if (R() < 0.5 + Math.min(0.3, score * 0.01)) { const c = Math.floor(R() * 3); if (!busy.has(c)) drops.push({ c, s: 0 }); }
        const target = drops.length ? drops.reduce((a, b) => (b.s > a.s ? b : a)).c : fig;
        if (target !== fig && R() > 0.12) { lastMove = target > fig ? 1 : -1; fig += lastMove; }
      }
    }
    states.push({ drops: drops.map((d) => ({ ...d })), fig, score, miss, over, splash, caught, move: lastMove });
  }
  const PERIOD = TICKS * TICK;
  const SX = 12, SY = 6, SW = 48, SH = 19;
  const sprite = (x, y, rows, co) => rows.forEach((r, i) => { for (let j = 0; j < r.length; j++) if (r[j] !== " ") g.set(SX + x + j, SY + y + i, r[j], co); });
  const DROP = ["▟▙", "▜▛"];
  const FIG = [" ▙▄▄▄▟ ", "  ▄█▄  ", " ▗███▖ ", "  █ █  "];
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const st = states[Math.min(TICKS - 1, Math.floor(lt / TICK))];
    // device body
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const cx = Math.min(x, W - 1 - x), cy = Math.min(y, H - 1 - y);
      if (cx + cy < 3) continue;
      g.set(x, y, (x * 5 + y * 3) % 19 === 0 ? "▓" : "█", cx < 2 || cy < 1 ? "6" : "4");
    }
    // face plate around the screen
    g.fill(SX - 3, SY - 3, SW + 6, SH + 6, "█", "8");
    g.fill(SX - 1, SY - 1, SW + 2, SH + 2, "█", "5");
    g.text(SX - 2, SY - 3, " RAIN CATCH ", "c");
    g.text(SX + SW - 12, SY - 3, " TIME  GAME ", "c");
    // LCD background
    g.fill(SX, SY, SW, SH, "█", "0");
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if ((x + y) % 7 === 0) g.set(SX + x, SY + y, "▓", "0");
    // printed cloud and ground
    sprite(4, 0, ["  ▄▄██▄▄    ▄▄███▄▄       ▄▄██▄▄▄  ", "▄████████▄▄███████████▄▄▄▄███████▄"], "3");
    sprite(1, 17, ["▀".repeat(46)], "3");
    // ghost segments: every possible drop and figure position
    for (const cx of COLX) for (const dy of DROP_Y) sprite(cx + 2, dy, DROP, "1");
    for (const cx of COLX) sprite(cx, 12, FIG, "1");
    for (const cx of COLX) sprite(cx + 1, 16, ["▖▗▘▝"], "1");
    // lit segments
    if (!st.over || Math.floor(lt * 4) % 2) {
      for (const d of st.drops) sprite(COLX[d.c] + 2, DROP_Y[d.s], DROP, "2");
      sprite(COLX[st.fig], 12, FIG, "2");
      if (st.splash >= 0) sprite(COLX[st.splash] + 1, 16, ["▖▗▘▝"], "2");
    }
    // score and misses
    bigText(g, SX + 35, SY + 3, String(st.score % 1000).padStart(3, " "), "2");
    for (let i = 0; i < 3; i++) sprite(2 + i * 3, 3, ["▟▙"], i < st.miss ? "2" : "1");
    sprite(1, 4, ["MISS"], st.miss ? "2" : "1");
    if (st.over) sprite(16, 9, ["GAME OVER"], "2");
    // buttons and speaker
    const BY = SY + SH + 5;
    const left = st.move === -1 && (lt % TICK) < 0.15, right = st.move === 1 && (lt % TICK) < 0.15;
    g.text(6, BY, " ▄██▄ ", left ? "9" : "c"); g.text(6, BY + 1, "▐████▌", left ? "9" : "c"); g.text(6, BY + 2, " ▀██▀ ", left ? "9" : "c");
    g.text(W - 12, BY, " ▄██▄ ", right ? "9" : "c"); g.text(W - 12, BY + 1, "▐████▌", right ? "9" : "c"); g.text(W - 12, BY + 2, " ▀██▀ ", right ? "9" : "c");
    g.text(8, BY + 3, "◀", "7"); g.text(W - 10, BY + 3, "▶", "7");
    g.text(26, BY, "▄▄  ▄▄  ▄▄", "d"); g.text(26, BY + 1, "GAME A  B  TIME", "7");
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) g.set(30 + i * 2, BY + 3 + r, "•", "c");
    return g.frame();
  };
}
