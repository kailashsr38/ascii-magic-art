/* midi-step-sequencer: a sixteen step drum and synth sequencer with a sweeping playhead, live edits and level meters. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "midi-step-sequencer",
  name: "MIDI Step Sequencer",
  category: "retro",
  note: "A sixteen step sequencer grid where the playhead sweeps eight tracks, lit steps flash as they fire, the edit cursor adds and removes notes and the meters bounce.",
  tags: ["retro", "music", "sequencer", "drum machine", "midi", "dashboard"],
  cols: 100, rows: 30, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#484f58", "#21262d", "#ff7b72", "#ffa657", "#f2cc60", "#7ee787", "#56d4dd", "#79c0ff", "#d2a8ff", "#ff9bd2",
    "#5a2420", "#5a3a1a", "#4a4018", "#1f4a26", "#1a4448", "#1a3456", "#3e2e5a", "#5a2a48", "#ffffff"]),
};

const TRACKS = [
  ["KICK", "x...x...x...x..."], ["SNARE", "....x.......x..."], ["CL HAT", "x.x.x.x.x.x.x.xx"], ["OP HAT", "..x...x...x...x."],
  ["CLAP", "............x..."], ["BASS", "x..x..x...x.x..."], ["LEAD", "x.....x...x....."], ["PAD", "x.......x......."],
];
const EDITS = [[2, 4, 13], [3, 6, 3], [4, 0, 14], [5, 5, 15], [6, 7, 12], [7, 1, 15]];
const STEP = 60 / 118 / 4, BARS = 16;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const PERIOD = STEP * 16 * BARS;
  const NX = 10, CW = 4;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const stepAbs = Math.floor(lt / STEP), step = stepAbs % 16, bar = Math.floor(stepAbs / 16);
    const sf = (lt % STEP) / STEP;
    // pattern state with edits: added in the first half, removed in the second
    const pat = TRACKS.map(([, p]) => [...p].map((c) => c === "x"));
    let cursor = null;
    for (const [b, tr, st] of EDITS) {
      if (bar >= b && bar < b + 8) pat[tr][st] = true;
      if (bar === b - 1 && step >= 8) cursor = [tr, st, "add"];
      if (bar === b + 7 && step >= 8) cursor = [tr, st, "del"];
    }
    // transport
    g.text(0, 0, "▶ PLAY", "7");
    g.text(9, 0, "BPM 118", "0");
    g.text(18, 0, "BAR " + String(bar + 1).padStart(2, "0") + "." + (Math.floor(step / 4) + 1) + "." + ((step % 4) + 1), "6");
    g.text(32, 0, "SWING 54%", "1");
    g.text(44, 0, "PATTERN A", "1");
    g.text(56, 0, "MIDI CH 10", "1");
    g.text(70, 0, "QUANT 1/16", "1");
    g.text(84, 0, "● REC", Math.floor(t * 2) % 2 && cursor ? "4" : "2");
    // step numbers
    for (let s = 0; s < 16; s++) g.text(NX + s * CW, 2, String(s + 1).padStart(2), s === step ? "6" : s % 4 === 0 ? "0" : "2");
    // grid
    TRACKS.forEach(([name, ], tr) => {
      const y = 3 + tr * 2;
      const col = String.fromCharCode(52 + tr) ;
      const key = "456789ab"[tr], dim = "cdefghij"[tr];
      g.text(0, y, name.padEnd(8), key);
      g.text(0, y + 1, "ch" + String(tr + 1).padStart(2, "0"), "2");
      for (let s = 0; s < 16; s++) {
        const x = NX + s * CW;
        const on = pat[tr][s];
        const playing = s === step;
        const fire = on && playing && sf < 0.6;
        const ch = on ? "███" : playing ? "▒▒▒" : s % 4 === 0 ? "░░░" : "···";
        const co = fire ? "k" : on ? key : playing ? "2" : s % 4 === 0 ? "3" : "2";
        g.text(x, y, ch, co);
        g.text(x, y + 1, on ? "▀▀▀" : "   ", fire ? key : dim);
      }
      void col;
      // level meter
      let age = 99;
      for (let a = 0; a < 16; a++) { const s = (step - a + 16) % 16; if (pat[tr][s]) { age = a + sf; break; } }
      const lvl = Math.max(0, 1 - age * 0.22);
      const n = Math.round(lvl * 14);
      g.text(76, y, "█".repeat(n) + "░".repeat(14 - n), n > 11 ? "4" : key);
      g.text(91, y, "vol " + String(70 + ((tr * 13) % 30)), "1");
    });
    // edit cursor
    if (cursor) {
      const [tr, st, mode] = cursor;
      const x = NX + st * CW - 1, y = 3 + tr * 2;
      if (Math.floor(t * 4) % 2 === 0) { g.set(x, y, "[", "k"); g.set(x + 4, y, "]", "k"); }
      g.text(0, 20, (mode === "add" ? "+ add note  " : "- clear note") + "  track " + TRACKS[tr][0].padEnd(7) + " step " + String(st + 1).padStart(2), mode === "add" ? "7" : "4");
    } else g.text(0, 20, "  editing: none", "2");
    // velocity lane for the lead track
    g.box(0, 21, W, H - 21, "light", "3");
    g.text(2, 21, " VELOCITY  LEAD ", "a");
    for (let s = 0; s < 16; s++) {
      const v = pat[6][s] ? 0.45 + ((s * 37) % 50) / 100 : 0;
      const hgt = Math.round(v * 6);
      for (let k = 0; k < hgt; k++) g.text(NX + s * CW, H - 2 - k, "██", s === step ? "k" : "a");
      if (!hgt) g.text(NX + s * CW, H - 2, "▁▁", "3");
    }
    // a little keyboard on the right showing the bass note
    const notes = [0, 3, 7, 10, 0, 3, 5, 7, 3, 0, 7, 5, 0, 3, 10, 7];
    const bass = pat[5][step] ? notes[step] : -1;
    for (let k = 0; k < 12; k++) {
      const black = [1, 3, 6, 8, 10].includes(k);
      const x = 74 + k * 2;
      g.text(x, 23, black ? "▐▌" : "  ", k === bass ? "5" : "2");
      g.text(x, 24, "█▌", k === bass ? "5" : black ? "3" : "1");
      g.text(x, 25, black ? "  " : "█▌", k === bass ? "5" : "1");
    }
    g.text(74, 27, "BASS NOTE " + (bass >= 0 ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][bass] + "2 " : "-- "), "5");
    return g.frame();
  };
}
