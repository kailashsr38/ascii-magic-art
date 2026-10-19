/* chiptune-tracker: a four channel music tracker playing a song, pattern rows scrolling past the play line with meters and scopes. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "chiptune-tracker",
  name: "Chiptune Tracker",
  category: "retro",
  note: "A four channel music tracker plays a chiptune, note rows scrolling up past the play line while the meters jump, the channel scopes wiggle and the pattern counter steps.",
  tags: ["retro", "music", "tracker", "chiptune", "demoscene", "dashboard"],
  cols: 100, rows: 32, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#484f58", "#30363d", "#79c0ff", "#d2a8ff", "#ffa657", "#7ee787", "#f2cc60", "#ff7b72", "#56d4dd", "#1f6feb", "#0d1f3a", "#161b22"]),
};

const NN = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
const SAMPLES = ["kick", "snare", "closed hat", "bass saw", "chord arp", "lead pulse", "pad", "noise sweep"];
const ROOTS = [9, 5, 0, 7], MINOR = [true, false, false, false];
const PENTA = [0, 3, 5, 7, 10];
const RPS = 6.5, ROWS = 64, PATS = 4;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  // song data: [pattern][row][channel] = {n, i, e} or null
  const song = [];
  for (let p = 0; p < PATS; p++) {
    const R = rng(31 + p * 5);
    const pat = [];
    for (let r = 0; r < ROWS; r++) {
      const ch = [null, null, null, null];
      const bar = Math.floor(r / 16), root = ROOTS[bar];
      if (r % 8 === 0) ch[0] = { n: 36, i: 1, e: "..." };
      else if (r % 8 === 4) ch[0] = { n: 38, i: 2, e: "..." };
      else if (r % 2 === 1 && p > 0) ch[0] = { n: 54, i: 3, e: "C" + (r % 4 === 1 ? "20" : "10") };
      if (r % 2 === 0) ch[1] = { n: 24 + root + (r % 4 === 2 ? 12 : 0), i: 4, e: r % 16 === 14 ? "E91" : "..." };
      if (r % 4 === 0) ch[2] = { n: 48 + root, i: 5, e: MINOR[bar] ? "037" : "047" };
      if (p > 1 || r >= 32) {
        if (R() < 0.42 && r % 2 === 0) ch[3] = { n: 60 + PENTA[Math.floor(R() * 5)] + (R() < 0.25 ? 12 : 0), i: 6, e: R() < 0.3 ? "4" + "48"[Math.floor(R() * 2)] + "3" : "..." };
      }
      if (r === 63 && p === 3) ch[3] = { n: 72, i: 8, e: "F06" };
      pat.push(ch);
    }
    song.push(pat);
  }
  const ORDER = [0, 1, 2, 3];
  const PERIOD = (ROWS * PATS) / RPS;
  const noteStr = (c) => (c ? NN[c.n % 12] + Math.floor(c.n / 12) : "---");
  const lastHit = (pi, r, k) => {
    for (let a = 0; a < 16; a++) {
      let rr = r - a, pp = pi;
      while (rr < 0) { rr += ROWS; pp = (pp + PATS - 1) % PATS; }
      if (song[ORDER[pp]][rr][k]) return [a, song[ORDER[pp]][rr][k]];
    }
    return [99, null];
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const abs = lt * RPS;
    const row = Math.floor(abs) % ROWS, pos = Math.floor(abs / ROWS) % PATS;
    const frac = abs % 1;
    // title bar
    g.fill(0, 0, W, 1, "▀", "c");
    g.text(1, 0, "TRACKER", "8");
    g.text(10, 0, "NIGHT DRIVE.MOD", "0");
    g.text(30, 0, "BPM 125  SPD 6  POS " + String(pos).padStart(2, "0") + "/" + String(PATS - 1).padStart(2, "0") + "  PAT " + String(ORDER[pos]).padStart(2, "0") + "  ROW " + String(row).padStart(2, "0"), "1");
    const secs = Math.floor(lt);
    g.text(W - 8, 0, String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0"), "7");
    // samples list
    g.box(0, 1, 26, 10, "light", "3");
    g.text(2, 1, " Samples ", "1");
    const hits = [0, 1, 2, 3].map((k) => lastHit(pos, row, k));
    SAMPLES.forEach((s, i) => {
      const active = hits.some(([a, c]) => c && c.i === i + 1 && a < 2);
      g.text(2, 2 + i, String(i + 1).padStart(2, "0") + " " + s, active ? "8" : "1");
    });
    // meters and scopes per channel
    const CH_CO = ["9", "4", "5", "7"];
    for (let k = 0; k < 4; k++) {
      const x0 = 27 + k * 18;
      g.box(x0, 1, 17, 10, "light", "3");
      g.text(x0 + 2, 1, " CH" + (k + 1) + " ", CH_CO[k]);
      const [age, c] = hits[k];
      const lvl = Math.max(0, 1 - (age + frac) * 0.14);
      // vertical meter
      for (let y = 0; y < 8; y++) {
        const on = (7 - y) / 8 < lvl;
        g.text(x0 + 1, 2 + y, on ? "██" : "░░", on ? (y < 2 ? "9" : y < 4 ? "8" : "7") : "3");
      }
      // scope
      for (let x = 0; x < 12; x++) {
        let v = 0;
        if (c) {
          const ph = (x / 12) * (2 + (c.n % 12) / 4) + t * 3;
          v = k === 0 ? Math.sin(ph * 6.28) * (age < 1 ? 1 : 0.4) : k === 1 ? ((ph % 1) * 2 - 1) : k === 2 ? (ph % 1 < 0.5 ? 1 : -1) : Math.sin(ph * 6.28) * 0.9;
          v *= lvl;
        }
        const y = Math.round(5.5 - v * 3.2);
        g.set(x0 + 4 + x, Math.max(2, Math.min(9, y)), "•", CH_CO[k]);
      }
    }
    // pattern view
    const PY = 12, PH = H - PY - 1, mid = PY + Math.floor(PH / 2);
    g.box(0, PY - 1, W, PH + 2, "double", "3");
    for (let y = PY; y < PY + PH; y++) {
      const r = row + (y - mid);
      let pp = pos, rr = r;
      if (rr < 0) { rr += ROWS; pp = (pos + PATS - 1) % PATS; }
      if (rr >= ROWS) { rr -= ROWS; pp = (pos + 1) % PATS; }
      const cur = y === mid;
      if (cur) g.fill(1, y, W - 2, 1, "▒", "c");
      g.text(2, y, String(rr).padStart(2, "0"), cur ? "8" : rr % 16 === 0 ? "6" : rr % 4 === 0 ? "1" : "2");
      for (let k = 0; k < 4; k++) {
        const x = 6 + k * 23;
        g.set(x - 1, y, "│", "3");
        const c = song[ORDER[pp]][rr][k];
        const dim = pp !== pos;
        g.text(x + 1, y, noteStr(c), c ? (cur ? "0" : dim ? "1" : "0") : "2");
        g.text(x + 5, y, c ? String(c.i).padStart(2, "0") : "..", c ? "a" : "2");
        g.text(x + 8, y, c ? "v" + (k === 3 ? "48" : "64") : "...", c ? "7" : "2");
        g.text(x + 13, y, c ? c.e : "...", c && c.e !== "..." ? "5" : "2");
      }
    }
    g.set(1, mid, "►", "8"); g.set(W - 2, mid, "◄", "8");
    return g.frame();
  };
}
