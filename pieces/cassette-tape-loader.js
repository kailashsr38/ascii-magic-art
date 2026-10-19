/* cassette-tape-loader: a home computer loading a game from cassette, border stripes racing while the loading screen paints in. */
import { Grid, palette, noise2, clamp } from "../lib/kit.js";

const C = ["#000000", "#d70000", "#00d7d7", "#0000d7", "#d7d700", "#ffffff", "#d700d7", "#00d700", "#ff4040", "#40ffff",
  "#0a1a4a", "#14306e", "#2a5aa8", "#6a9ad8", "#f0a040", "#ffd080", "#5a3a20", "#2a6a2a", "#4aa04a", "#a0e070", "#ffffff", "#b0b0c0"];

export const meta = {
  slug: "cassette-tape-loader",
  name: "Cassette Tape Loading",
  category: "retro",
  note: "An 8-bit computer loading from cassette, the border flashing pilot tone and data stripes while the loading screen picture paints in band by band.",
  tags: ["retro", "loading", "cassette", "8-bit", "loader", "nostalgia"],
  cols: 84, rows: 32, fps: 25,
  palette: palette(C),
};

const PERIOD = 20;
const hash = (n) => { let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const BX = 8, BY = 3, IW = W - 16, IH = H - 6;
  // the loading screen picture, painted once: sunset sky, mountains, lake, a castle
  const pic = [];
  for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
    const u = x / IW, v = y / IH;
    let ch = "█", co = "a";
    const ridge = 0.5 + 0.12 * Math.sin(u * 9) + 0.08 * Math.sin(u * 23 + 1) - 0.18 * Math.exp(-((u - 0.3) ** 2) * 60);
    const sun = Math.hypot((u - 0.72) * 2, v - 0.32);
    if (v < ridge) {
      const k = v / ridge;
      co = k < 0.3 ? "a" : k < 0.55 ? "b" : k < 0.75 ? "c" : k < 0.9 ? "e" : "f";
      ch = (x + y) % 2 && k > 0.5 && k < 0.6 ? "▓" : "█";
      if (sun < 0.12) { co = sun < 0.08 ? "k" : "f"; ch = "█"; }
    } else if (v < 0.72) {
      const k = noise2(x * 0.3, y * 0.5, 4);
      co = k > 0.55 ? "h" : "g"; ch = k > 0.7 ? "▓" : "█";
    } else {
      const k = (v - 0.72) / 0.28;
      co = k < 0.4 ? "c" : "b"; ch = (x * 3 + y * 7) % 11 === 0 ? "▒" : "█";
      if (Math.abs(u - 0.72) < 0.05 - k * 0.02 && y % 2 === 0) co = "f";
    }
    // castle silhouette on the left hill
    const cx = Math.floor(IW * 0.3);
    const top = Math.floor(IH * 0.38);
    if (x > cx - 6 && x < cx + 6 && y >= top && y < Math.floor(IH * 0.6)) { co = "0"; ch = "█"; }
    if ((x === cx - 6 || x === cx + 5 || x === cx) && y >= top - 3 && y < top) { co = "0"; ch = "█"; }
    if (x === cx && y === top + 3) { co = "4"; ch = "▪"; }
    pic.push([ch, co]);
  }
  // band order of the reveal: thirds, then rows by 8 within each third, like real screen memory
  const order = [];
  const third = Math.ceil(IH / 3);
  for (let b = 0; b < 3; b++) for (let k = 0; k < 4; k++) for (let r = k; r < third; r += 4) { const y = b * third + r; if (y < IH) order.push(y); }
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const P1 = 2.4, HDR = 3.2, P2 = 4.8, DATA = 17.2;
    let phase = lt < P1 ? "pilot" : lt < HDR ? "data" : lt < P2 ? "pilot" : lt < DATA ? "data" : "done";
    // border stripes
    const frame = Math.floor(t * 25);
    for (let y = 0; y < H; y++) {
      let co;
      if (phase === "pilot") co = Math.floor((y + t * 55) / 3) % 2 ? "1" : "2";
      else if (phase === "data") co = hash(y * 131 + frame * 977) > 0.5 ? "3" : "4";
      else co = "5";
      for (let x = 0; x < W; x++) {
        if (x >= BX && x < BX + IW && y >= BY && y < BY + IH) continue;
        g.set(x, y, "█", co);
      }
    }
    // inner screen
    if (lt < HDR) {
      g.text(BX + 1, BY + 1, "LOAD \"\"", "5");
      if (lt > 1.0) g.text(BX + 1, BY + IH - 2, "Press PLAY on tape", "5");
    } else {
      if (lt < P2 + 0.4) g.text(BX + 1, BY + 1, "Program: SKY RAIDER", "5");
      const k = clamp((lt - P2) / (DATA - P2 - 0.6));
      const kp = clamp(k / 0.75), ka = clamp((k - 0.75) / 0.25);
      const n = Math.floor(kp * order.length);
      const attrRows = Math.floor(ka * IH);
      const DARK = "0abg3";
      for (let i = 0; i < n; i++) {
        const y = order[i];
        for (let x = 0; x < IW; x++) {
          const [ch, co] = pic[y * IW + x];
          if (y < attrRows) g.set(BX + x, BY + y, ch, co);
          else if (DARK.includes(co)) g.set(BX + x, BY + y, (x + y) % 3 === 0 ? "░" : " ", "l");
          else g.set(BX + x, BY + y, ch, "5");
        }
      }
      if (lt > DATA) {
        // title text over the finished picture
        const title = " SKY RAIDER ";
        g.text(BX + Math.floor((IW - title.length) / 2), BY + 2, title, "4");
        const sub = " (c) 1985  PRESS ANY KEY ";
        if (Math.floor(lt * 2) % 2 === 0) g.text(BX + Math.floor((IW - sub.length) / 2), BY + IH - 2, sub, "5");
      }
    }
    return g.frame();
  };
}
