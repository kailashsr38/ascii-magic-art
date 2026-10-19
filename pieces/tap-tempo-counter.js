/* tap-tempo-counter: a tap tempo tool, a pad flashing under each tap while the BPM readout settles and the interval history fills in. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "tap-tempo-counter",
  name: "Tap Tempo Counter",
  category: "music",
  note: "A tap tempo tool where each tap flashes the pad with a ripple while the BPM readout settles, the intervals chart fills and the beat lights lock in.",
  tags: ["tempo", "bpm", "tap", "tool", "app", "dashboard"],
  cols: 74, rows: 26, fps: 30,
  palette: palette(["#e6edf3", "#8b949e", "#484f58", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#30363d", "#f2cc60", "#ffffff", "#161b22"]),
};

const D = {
  "0": "███│█ █│█ █│█ █│███", "1": " █ │██ │ █ │ █ │███", "2": "███│  █│███│█  │███", "3": "███│  █│███│  █│███",
  "4": "█ █│█ █│███│  █│  █", "5": "███│█  │███│  █│███", "6": "███│█  │███│█ █│███", "7": "███│  █│  █│  █│  █",
  "8": "███│█ █│███│█ █│███", "9": "███│█ █│███│  █│███", "-": "   │   │███│   │   ", ".": "   │   │   │   │ █ ", " ": "   │   │   │   │   ",
};
const TAPF = ["█████  ███  ████ ", "  █   █   █ █   █", "  █   █████ ████ ", "  █   █   █ █    ", "  █   █   █ █    "];

function big(g, x, y, s, co) {
  let cx = x;
  for (const c of s) {
    const rowsG = (D[c] || D[" "]).split("│");
    const w = c === "." ? 1 : 3;
    rowsG.forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === "█" && (c !== "." || i === 1)) { g.set(cx + (c === "." ? 0 : i * 2), y + j, "█", co); if (c !== ".") g.set(cx + i * 2 + 1, y + j, "█", co); } });
    cx += c === "." ? 2 : w * 2 + 1;
  }
}

const SESS = [96, 128, 74, 140];
const NT = 10, IDLE = 3;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const R = rng(12);
  const sessions = [];
  let t0 = 0.6;
  for (const bpm of SESS) {
    const taps = [];
    let tt = t0;
    for (let i = 0; i < NT; i++) { taps.push(tt); tt += (60 / bpm) * (1 + (R() - 0.5) * (i < 3 ? 0.16 : 0.06)); }
    const end = taps[NT - 1] + IDLE;
    sessions.push({ bpm, taps, start: t0 - 0.6, end });
    t0 = end + 0.6;
  }
  const LOOP = t0 - 0.6;
  return (T) => {
    g.clear();
    const t = T % LOOP;
    const s = sessions.find((q) => t >= q.start && t < q.end + 0.6) || sessions[0];
    const done = s.taps.filter((x) => x <= t);
    const n = done.length;
    const iv = []; for (let i = 1; i < n; i++) iv.push(done[i] - done[i - 1]);
    const mean = iv.length ? iv.reduce((a, b) => a + b, 0) / iv.length : 0;
    const bpm = mean ? 60 / mean : 0;
    const dev = iv.length > 1 ? Math.sqrt(iv.reduce((a, b) => a + (60 / b - bpm) ** 2, 0) / iv.length) : 0;
    const last = n ? t - done[n - 1] : 9;
    const locked = n === NT && last > 0.4;
    // window
    g.box(0, 0, cols, rows, "round", "2");
    g.text(2, 0, " Tap Tempo ", "0");
    g.text(cols - 15, 0, locked ? " ● LOCKED " : " ○ LISTENING ", locked ? "3" : "1");
    // pad
    const flash = last < 0.12;
    g.fill(2, 2, 26, 13, " ", "8");
    g.box(2, 2, 26, 13, flash ? "heavy" : "round", flash ? "5" : "2");
    for (let y = 3; y < 14; y++) for (let x = 3; x < 27; x++) g.set(x, y, flash ? "▓" : "░", flash ? "5" : "8");
    if (last < 0.6) {
      const rr = last * 22;
      for (let a = 0; a < 6.283; a += 0.08) {
        const x = Math.round(15 + Math.cos(a) * rr), y = Math.round(8.5 + Math.sin(a) * rr * 0.5);
        if (x > 2 && x < 27 && y > 2 && y < 14) g.set(x, y, "·", "9");
      }
    }
    TAPF.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === "█") g.set(6 + i, 6 + j, "█", flash ? "a" : "0"); });
    g.text(4, 13, "space or click", "1");
    // readout
    g.text(32, 2, "BPM", "1");
    big(g, 32, 4, n >= 2 ? bpm.toFixed(1).padStart(5, " ") : "---.-", locked ? "3" : "0");
    g.text(32, 10, "spread", "1");
    g.text(40, 10, n >= 3 ? ("± " + dev.toFixed(1)).padStart(7) : "     --", "4");
    g.text(50, 10, "taps", "1");
    g.text(55, 10, String(n).padStart(2, "0") + "/" + NT, "0");
    g.text(32, 12, "target", "1");
    g.text(40, 12, locked ? `~${Math.round(bpm)}`.padStart(7) : "      ?", "7");
    for (let i = 0; i < 12; i++) g.set(50 + i * 2, 12, i < Math.min(12, Math.round(12 - Math.min(12, dev))) && n >= 3 ? "■" : "□", n >= 3 && i < 12 - dev ? "3" : "2");
    // beat lights
    g.hline(1, cols - 2, 15, "─", "8");
    g.text(2, 16, "beats", "1");
    for (let i = 0; i < NT; i++) {
      const on = i < n, cur = i === n - 1 && last < 0.25;
      g.set(9 + i * 3, 16, on ? "●" : "○", cur ? "a" : on ? (i % 4 === 0 ? "5" : "3") : "2");
    }
    // pulse after lock: the light keeps time
    if (locked) {
      const k = Math.floor((t - done[n - 1]) / mean);
      const ph = ((t - done[n - 1]) / mean) % 1;
      g.text(42, 16, "metronome", "1");
      for (let i = 0; i < 4; i++) g.set(53 + i * 2, 16, ph < 0.25 && k % 4 === i ? "●" : "·", k % 4 === i && ph < 0.25 ? (i === 0 ? "5" : "3") : "2");
    }
    // interval chart
    g.text(2, 18, "intervals ms", "1");
    g.box(1, 19, cols - 2, 6, "light", "8");
    for (let i = 0; i < iv.length; i++) {
      const ms = iv[i] * 1000;
      const h = Math.max(1, Math.min(3, Math.round((ms / 900) * 3)));
      const x = 3 + i * 7;
      for (let q = 0; q < h; q++) g.text(x, 23 - q, "████", Math.abs(60 / iv[i] - bpm) < 3 ? "4" : "6");
      g.text(x, 20, String(Math.round(ms)).padStart(4, " "), "0");
    }
    g.text(cols - 13, 18, `avg ${mean ? String(Math.round(mean * 1000)).padStart(4) : "  --"}ms`, "1");
    return g.frame();
  };
}
