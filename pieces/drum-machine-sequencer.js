/* drum-machine-sequencer: a 16 step drum machine playing a pattern, the playhead sweeping the pads as each voice fires. */
import { Grid, palette, gradient, KEYS, fbm, clamp } from "../lib/kit.js";

const P = [];
const add = (c) => { const o = P.length; P.push(...c); return o; };
const BODY = add(gradient(["#15161a", "#1f2026", "#2a2c33", "#363943"], 4));
const ON = add(["#ff5a4a", "#ff9a3a", "#ffd23a", "#f0f05a", "#5aff8a", "#3ad8ff", "#7a8aff", "#ff6ad8"]);
const OFF = add(["#3a1a18", "#3a2614", "#3a3214", "#34341a", "#183a24", "#14323a", "#1e2240", "#3a1a34"]);
const UI = add(["#e6edf3", "#8b949e", "#484f58", "#ffffff", "#0a1a10", "#7ee787", "#2a4a30", "#ff3a3a", "#c8ccd4"]);

export const meta = {
  slug: "drum-machine-sequencer",
  name: "Drum Machine Sequencer",
  category: "music",
  note: "A 16 step drum machine plays its pattern, the playhead sweeping across lit pads as kick, snare, hats and claps fire, with a fill every fourth bar.",
  tags: ["drums", "sequencer", "beat", "rhythm", "groovebox", "hero"],
  cols: 96, rows: 30, fps: 30,
  palette: palette(P),
};

const TR = ["KICK", "SNARE", "CL HAT", "OP HAT", "CLAP", "LO TOM", "RIM", "SHAKER"];
const PA = [
  "x...x...x..x..x.",
  "....x.......x...",
  "x.x.x.x.x.x.x.x.",
  "..x...x...x...x.",
  "....x.......x..x",
  "...........x....",
  ".x......x.....x.",
  "xxxxxxxxxxxxxxxx",
];
const FILL = [
  "x...x...x.x.xx..",
  "....x...x.xxxxxx",
  "x.x.x.x.x.x.....",
  "..x...x.........",
  "....x...x...x.x.",
  "........xx.xx.x.",
  ".x...x.....x....",
  "xxxxxxxx........",
];
const BPM = 124, SX = 13, SW = 5;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const bg = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) bg.push(KEYS[BODY + Math.min(3, Math.floor(clamp(0.45 + (fbm(x * 0.04, y * 0.4, 2, 2) - 0.5) * 0.5) * 4))]);
  return (t) => {
    for (let i = 0; i < bg.length; i++) { g.ch[i] = "▒"; g.co[i] = bg[i]; }
    const sp = (t * BPM) / 60 * 4;
    const stepAll = Math.floor(sp), step = stepAll % 16, frac = sp - stepAll;
    const bar = Math.floor(stepAll / 16) % 4;
    const pat = bar === 3 ? FILL : PA;
    // frame
    g.box(0, 0, cols, rows, "heavy", KEYS[UI + 2]);
    // LCD
    g.fill(2, 1, 44, 5, "█", KEYS[UI + 4]);
    g.box(2, 1, 44, 5, "light", KEYS[UI + 6]);
    g.text(4, 2, `BPM ${BPM}.0`, KEYS[UI + 5]);
    g.text(17, 2, `PTN ${bar === 3 ? "A04 FILL" : "A03     "}`, KEYS[UI + 5]);
    g.text(4, 3, `BAR ${bar + 1}/4   STEP ${String(step + 1).padStart(2, "0")}/16`, KEYS[UI + 5]);
    g.text(4, 4, "SWING 54%   KIT DRY 02", KEYS[UI + 6]);
    for (let i = 0; i < 16; i++) g.set(29 + i, 4, i === step ? "█" : "▁", KEYS[UI + 5]);
    // knobs
    const knob = (x, lbl, a) => {
      g.text(x, 2, "(" + ["\\", "|", "/", "-"][Math.floor(((a % 1) + 1) % 1 * 4)] + ")", KEYS[UI + 8]);
      g.text(x - 1, 4, lbl, KEYS[UI + 1]);
    };
    knob(50, "TEMPO", 0.3); knob(59, "SWING", 0.15); knob(68, "ACCNT", 0.55); knob(77, "LEVEL", 0.35);
    g.text(86, 2, "PLAY", KEYS[UI + 1]); g.set(88, 4, "●", frac < 0.5 ? KEYS[UI + 5] : KEYS[UI + 6]);
    g.hline(1, cols - 2, 6, "─", KEYS[UI + 2]);
    // tracks
    for (let r = 0; r < TR.length; r++) {
      const y = 8 + r * 2;
      const hit = pat[r][step] === "x";
      const fl = hit && frac < 0.45;
      g.text(2, y, (fl ? "► " : "  ") + TR[r], fl ? KEYS[ON + r] : KEYS[UI + 1]);
      for (let s = 0; s < 16; s++) {
        const x = SX + s * SW;
        const on = pat[r][s] === "x";
        const cur = s === step;
        let ch = on ? "█" : "▒", co = on ? KEYS[ON + r] : KEYS[OFF + r];
        if (cur) { if (on && fl) { co = KEYS[UI + 3]; } else if (!on) { ch = "░"; co = KEYS[UI + 1]; } }
        for (let k = 0; k < 4; k++) g.set(x + k, y, ch, co);
        if (r < TR.length - 1) for (let k = 0; k < 4; k++) g.set(x + k, y + 1, cur ? "▀" : " ", cur ? KEYS[UI + 2] : undefined);
      }
    }
    for (let s = 1; s < 4; s++) g.vline(SX + s * 20 - 1, 7, 23, "┊", KEYS[UI + 2]);
    // step buttons
    g.hline(1, cols - 2, 24, "─", KEYS[UI + 2]);
    for (let s = 0; s < 16; s++) {
      const x = SX + s * SW;
      g.set(x + 1, 25, "●", s === step ? KEYS[UI + 7] : KEYS[UI + 2]);
      g.text(x, 26, "████", KEYS[[ON, ON + 1, ON + 2, UI + 8][Math.floor(s / 4)]]);
      g.text(x, 27, "▀▀▀▀", KEYS[BODY + 3]);
      g.text(x + 1, 28, String(s + 1).padStart(2, " "), KEYS[UI + 1]);
    }
    g.text(2, 26, "STEP", KEYS[UI + 1]);
    return g.frame();
  };
}
