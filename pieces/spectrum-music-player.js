/* spectrum-music-player: a desktop music player with live spectrum bars, a scrubbing progress bar and a playlist. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "spectrum-music-player",
  name: "Spectrum Music Player",
  category: "screens",
  note: "A music player window with bouncing spectrum bars, a moving progress bar and a playlist that advances track by track.",
  tags: ["music", "player", "audio", "app", "equalizer", "hero"],
  cols: 78, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

const TRACKS = [
  ["Night Ferry", "Low Harbour", 214, "6"],
  ["Paper Satellites", "June Atlas", 187, "3"],
  ["Copper Rain", "The Quiet Engines", 243, "4"],
  ["Slow Signal", "Mira Vance", 201, "2"],
  ["Glasshouse", "Northbound", 176, "a"],
];
const SEG = 9;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % (SEG * TRACKS.length);
    const ti = Math.floor(lt / SEG), f = (lt % SEG) / SEG;
    const [title, artist, len, ac] = TRACKS[ti];
    const pos = len * (0.08 + f * 0.84);
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, "●", "5"); g.text(4, 0, "●", "4"); g.text(6, 0, "●", "2");
    g.text(W / 2 - 6, 0, " Now Playing ", "1");
    // album art: concentric pattern tinted per track
    const ax = 2, ay = 2, aw = 18, ah = 9;
    for (let y = 0; y < ah; y++) for (let x = 0; x < aw; x++) {
      const dx = (x - aw / 2 + 0.5) / 2, dy = y - ah / 2 + 0.5;
      const d = Math.sqrt(dx * dx + dy * dy) + ti * 0.7;
      const ch = "█▓▒░"[Math.floor(d) % 4];
      g.set(ax + x, ay + y, ch, Math.floor(d) % 4 === 0 ? ac : Math.floor(d) % 2 ? "8" : "7");
    }
    g.text(23, 2, title, "0");
    g.text(23, 3, artist, "1");
    g.text(23, 4, "Album · 2024 · FLAC 24/96", "7");
    // spectrum
    const sx = 23, sy = 10, nb = 26;
    for (let b = 0; b < nb; b++) {
      const k = b / nb;
      const beat = Math.max(0, Math.sin(t * 7.3 + ti)) ** 6;
      let v = 0.35 + 0.25 * Math.sin(t * (3.1 + b * 0.37) + b * 1.7) + 0.2 * Math.sin(t * (5.3 - k * 2) + b * 0.9);
      v = v * (1.15 - k * 0.6) + beat * (1 - k) * 0.5;
      const hgt = Math.max(1, Math.min(6, Math.round(v * 6)));
      for (let y = 0; y < hgt; y++) g.set(sx + b * 2, sy - y, y > 4 ? "▀" : "█", y > 3 ? "5" : y > 1 ? "9" : "2");
      g.set(sx + b * 2, sy + 1, "▔", "8");
    }
    // progress
    const py = 13, pw = W - 4 - 2 - 12;
    g.text(2, py, mmss(pos), "1");
    const kx = Math.round((pos / len) * (pw - 1));
    for (let i = 0; i < pw; i++) g.set(8 + i, py, i === kx ? "●" : i < kx ? "━" : "─", i === kx ? "0" : i < kx ? ac : "7");
    g.text(W - 7, py, mmss(len), "1");
    // controls
    const cy = 15, cx = Math.floor(W / 2) - 16;
    g.text(cx, cy, "↑↓", "1");
    g.text(cx + 6, cy, "◄◄", "0");
    g.box(cx + 12, cy - 1, 7, 3, "round", ac);
    g.text(cx + 14, cy, "▌▌", "0");
    g.text(cx + 23, cy, "►►", "0");
    g.text(cx + 29, cy, "×", "1");
    g.text(W - 20, cy, "vol", "1");
    for (let i = 0; i < 10; i++) g.set(W - 15 + i, cy, i < 7 ? "■" : "□", i < 7 ? "3" : "7");
    // playlist
    g.hline(1, W - 2, 17, "─", "8");
    g.text(2, 17, " Up next ", "6");
    for (let i = 0; i < 5; i++) {
      const j = (ti + i) % TRACKS.length, y = 18 + i;
      if (y >= H - 1) break;
      const on = i === 0;
      if (on) { g.fill(1, y, W - 2, 1, "░", "8"); g.set(1, y, "▌", ac); }
      g.text(3, y, on ? "►" : String(i + 1), on ? ac : "7");
      g.text(6, y, TRACKS[j][0], on ? "0" : "1");
      g.text(28, y, TRACKS[j][1], on ? "1" : "7");
      g.text(W - 7, y, mmss(TRACKS[j][2]), on ? "0" : "7");
    }
    return g.frame();
  };
}
