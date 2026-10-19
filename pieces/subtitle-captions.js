/* subtitle-captions: a night rooftop scene in a video player with timed captions, speaker names and sound cues. */
import { Grid, palette, gradient, KEYS, rng } from "../lib/kit.js";

const SKY = gradient(["#121a3c", "#25306a", "#4a4288", "#80508c", "#b8687c"], 6);
export const meta = {
  slug: "subtitle-captions",
  name: "Subtitle Captions",
  category: "lettering",
  note: "A night rooftop scene plays in a video frame while timed captions appear with coloured speaker names, sound cues and a moving scrubber.",
  tags: ["subtitles", "captions", "video", "film", "dialogue", "text"],
  cols: 84, rows: 28, fps: 24,
  // 0-5 sky, 6 moon, 7 building, 8 lit window, 9 silhouette, a caption text, b speaker A, c speaker B, d sound cue, e ui muted, f ui frame, g scrub, h cloud, i plane light, j caption box
  palette: palette([...SKY, "#f2ecd0", "#0a0d18", "#e8b85a", "#020306", "#ffffff", "#7ee7d0", "#ffb36b", "#9aa3b2", "#8b949e", "#30363d", "#ff5f56", "#5a5f92", "#ff5f56", "#11131a"]),
};

const LINES = [
  [0.4, 3.2, "d", "", "[distant traffic]"],
  [3.4, 6.6, "b", "MIRA", "You can see the whole harbour from up here."],
  [6.8, 9.6, "c", "JONAH", "I used to come here when I couldn't sleep."],
  [9.8, 12.4, "b", "MIRA", "And now?"],
  [12.6, 15.8, "c", "JONAH", "Now I come here when I can't stop thinking."],
  [16.0, 18.4, "d", "", "[a ship horn sounds, low and long]"],
  [18.6, 21.8, "b", "MIRA", "That one leaves every night at eleven."],
  [22.0, 25.0, "c", "JONAH", "Then we have four minutes. Make a wish."],
];
const LOOP = 26.4;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const r = rng(5);
  const FX = 1, FY = 1, FW = cols - 2, FH = 20; // video area rows 1..20
  // static skyline: building tops and lit windows
  const tops = [];
  let x = 0;
  while (x < FW) {
    const w = 4 + Math.floor(r() * 8), h = 4 + Math.floor(r() * 9);
    tops.push([x, w, h]); x += w + (r() < 0.3 ? 1 : 0);
  }
  const lit = new Set();
  for (const [bx, w, h] of tops) for (let yy = 1; yy < h; yy += 2) for (let xx = 1; xx < w - 1; xx += 2) if (r() < 0.3) lit.add((bx + xx) + "," + yy);
  const stars = [];
  for (let i = 0; i < 26; i++) stars.push([Math.floor(r() * FW), Math.floor(r() * 7)]);
  const wrap = (s, w) => { const o = []; let l = ""; for (const wd of s.split(" ")) { if (l && (l + " " + wd).length > w) { o.push(l); l = wd; } else l = l ? l + " " + wd : wd; } if (l) o.push(l); return o; };
  return (t) => {
    g.clear();
    const lt = ((t % LOOP) + LOOP) % LOOP;
    // sky gradient
    for (let y = 0; y < FH; y++) {
      const k = Math.min(5, Math.floor((y / (FH - 6)) * 6));
      for (let xx = 0; xx < FW; xx++) g.set(FX + xx, FY + y, "█", KEYS[k]);
    }
    for (const [sx, sy] of stars) g.set(FX + sx, FY + sy, "·", "6");
    // moon
    const mx = FX + 64, my = FY + 3;
    g.text(mx, my, "▄██▄", "6"); g.text(mx - 1, my + 1, "██████", "6"); g.text(mx, my + 2, "▀██▀", "6");
    // drifting clouds
    for (let c = 0; c < 3; c++) {
      const cx = ((c * 31 + lt * (0.9 + c * 0.4)) % (FW + 20)) - 14;
      const cy = FY + 2 + c * 2;
      g.text(FX + Math.round(cx), cy, "▄▄▄▄▄▄██▄▄▄▄", "h");
    }
    // plane crossing with a red light
    const px = Math.round(FW - ((lt * 3.4) % (FW + 30)));
    if (px > 0 && px < FW) { g.set(FX + px, FY + 5, "─", "4"); g.set(FX + px + 1, FY + 5, "•", "i"); }
    // skyline
    const base = FY + FH - 3;
    for (const [bx, w, h] of tops) for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const X = FX + bx + xx;
      if (X >= FX + FW) continue;
      g.set(X, base - yy, lit.has((bx + xx) + "," + yy) ? "▪" : "█", lit.has((bx + xx) + "," + yy) ? "8" : "7");
    }
    // rooftop ledge with two silhouettes
    for (let xx = 0; xx < FW; xx++) { g.set(FX + xx, base + 1, "▀", "9"); g.set(FX + xx, base + 2, "█", "9"); }
    const sil = (sx, lean) => {
      g.set(sx + lean, base - 3, "▄", "9"); g.set(sx + lean, base - 2, "█", "9");
      g.text(sx - 1, base - 1, "███", "9"); g.text(sx - 1, base, "███", "9");
    };
    const talkA = LINES.some(([a, b, c]) => c === "b" && lt >= a && lt < b);
    const talkB = LINES.some(([a, b, c]) => c === "c" && lt >= a && lt < b);
    sil(30, talkA ? 1 : 0); sil(36, talkB ? -1 : 0);
    // captions
    const cur = LINES.find(([a, b]) => lt >= a && lt < b);
    if (cur) {
      const [, , who, name, text] = cur;
      const full = name ? name + ": " + text : text;
      const ls = wrap(full, 56);
      const cy = FY + FH - 3 - ls.length;
      ls.forEach((l, i) => {
        const x0 = Math.floor((cols - l.length) / 2);
        g.fill(x0 - 1, cy + i, l.length + 2, 1, " ", "j");
        g.text(x0, cy + i, l, who === "d" ? "d" : "a");
        if (i === 0 && name) g.text(x0, cy, name + ":", who);
      });
    }
    // frame + player bar
    g.box(0, 0, cols, FH + 2, "light", "f");
    const by = FH + 2;
    const elapsed = 41 * 60 + 12 + lt;
    const fmt = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    g.text(2, by + 1, "▶", "a");
    g.text(5, by + 1, fmt(elapsed) + " / 01:32:08", "e");
    const bw = cols - 4, k = Math.round((elapsed / 5528) * bw);
    g.text(2, by + 3, "━".repeat(k), "g"); g.set(2 + k, by + 3, "●", "a"); g.text(3 + k, by + 3, "─".repeat(bw - k - 1), "f");
    const right = "CC  EN  ·  1080p  ·  ◄◄  ►►";
    g.text(cols - 2 - right.length, by + 1, right, "e");
    g.text(cols - 2 - right.length, by + 1, "CC", "a");
    const sub = cur && cur[3] ? `speaker: ${cur[3].toLowerCase()}` : cur ? "sound description" : "";
    g.text(2, by + 5, "subtitles  ·  " + sub, "e");
    return g.frame();
  };
}
