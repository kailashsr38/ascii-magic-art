/* bamboo-raft-karsts: a fisherman poling a bamboo raft down a misty river between cone-shaped karst peaks at dawn, cormorants aboard, hand-built.
 * Painted once: the dawn sky, four ranks of pointed karst peaks fading from green to lilac haze, the
 * near bank with feathery bamboo, and the still river mirroring the peaks. Each frame drifts the raft
 * with its lantern, poles it along, sends a cormorant diving and surfacing, rolls the mist along the
 * water and flies birds. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, mist, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, PEAK = 2, BANK = 3, RIVER = 4;
const WL = 70;

const base = new Canvas();
base.sky([[0, "#8aa0c8"], [0.55, "#e8c0c8"], [1, "#ffe0c0"]], SKY, 0, WL + 1);
base.glow(130, 46, 5, 28, "#fff4d8", 0.6, SKY);
// the peaks: tall rounded domes with steep sides, rank behind rank, hazier with distance
for (const [far, n, h, seed] of [[0.9, 9, 26, 1], [0.7, 8, 32, 2], [0.45, 6, 38, 3], [0.2, 4, 44, 4]]) {
  const lit = mix(hex("#9ac08a"), hex("#e8dce8"), far), sh = mix(hex("#5e8466"), hex("#d0c4d8"), far);
  for (let i = 0; i < n; i++) {
    const cx = ((i + 0.5) / n) * W + Math.sin(i * 7.3 + seed) * 12, w = 9 + (i * 13 + seed * 5) % 9, hh = h * (0.75 + ((i * 7 + seed) % 5) / 10);
    for (let x = Math.floor(cx - w); x <= cx + w; x++) {
      const u = (x - cx) / w, top = WL - hh * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.2)), 0.6) * (1 + 0.08 * Math.sin(u * 3 + seed)) - fbm(x / 3, seed, 2, seed) * 2;
      for (let y = Math.floor(top); y < WL; y++) base.put(x, y, mix(lit, sh, clamp((u + 1) / 2 * 0.9 + noise2(x / 2, y / 3, seed) * 0.2)), PEAK);
    }
  }
}
// the near bank on the left, clumps of bamboo arching over it, leaves hanging in sprays
for (let x = 0; x < 64; x++) { const top = WL - 4 + x * 0.06; for (let y = Math.floor(top); y < WL + 3 - x * 0.04; y++) base.put(x, y, "#6a8a5a", BANK); }
for (const [bx, s0] of [[8, 1], [26, 1.15], [46, 0.9]]) for (let k = 0; k < 8; k++) {
  const a = (k - 3.5) * 0.16, h = (24 + ((k * 5 + bx) % 9)) * s0;
  for (let i = 0; i < h; i++) {
    const u = i / h, x = bx + a * i + (a * i * i) / (h * 1.2), y = WL - 3 - i + (Math.abs(a) * i * i) / (h * 0.9);
    base.put(x, y, mix(hex("#8ab070"), hex("#5a8a50"), u), BANK);
    if (u > 0.45 && i % 3 === 0) for (let l = 1; l < 4; l++) { base.put(x + l * Math.sign(a || 1), y + l * 0.6, "#a8cc80", BANK); base.put(x - l * Math.sign(a || 1) * 0.6, y + l * 0.8, "#7aa868", BANK); }
  }
}
// the river mirroring it all
const snap = new Canvas().copy(base);
base.rect(0, WL, W, H, (x, y) => mix(snap.get(x, 2 * WL - y - 1), hex("#8a98a8"), clamp(0.4 + (y - WL) / 70)), RIVER);

balance(base, 0.4);
const PAL = fitPalette(base, { n: 48, extras: ["#ffffff", "#f4f0ec", "#2a2622", "#c8a060", "#ffd27a", "#e8c8a0", "#4a3a30"] });

export const meta = {
  slug: "bamboo-raft-karsts",
  name: "Bamboo Raft Karsts",
  category: "landscapes",
  note: "A fisherman in a conical hat poles a bamboo raft down a misty river at dawn, his lantern lit and a cormorant diving, between rank on rank of cone-shaped karst peaks.",
  tags: ["guilin", "li-river", "karst", "bamboo-raft", "cormorant", "fisherman", "wonder", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    mist(f, t, { y0: 56, y1: 76, c: "#f4f0ec", a: 0.6, speed: 0.04, scale: 24, cut: 0.4 });
    // the raft drifting downstream, the fisherman poling, the lantern at the bow (60 s across)
    const x = lerp(W + 20, -40, ((t + 24) % 60) / 60), y = 90, pole = Math.sin(t * 0.9);
    for (let k = 1; k < 22; k++) f.add(x + 16 + k * 1.3, y + 1 + (k % 2), "#f4f0ec", (1 - k / 22) * 0.45, RIVER);
    for (let r = 0; r < 3; r++) f.rect(x - 14, y - 1 + r, x + 16, y + r, r % 2 ? "#c8a060" : "#e8c890");
    f.rect(x + 2, y - 7, x + 4, y - 1, "#2a2622"); f.rect(x + 1, y - 9, x + 5, y - 8, "#e8c8a0"); f.rect(x + 2, y - 10, x + 4, y - 9, "#e8c8a0");
    f.line(x + 4, y - 6, x + 12 + pole * 4, y + 6, "#4a3a30", 1);
    f.rect(x - 13, y - 5, x - 12, y - 1, "#4a3a30"); f.glow(x - 12, y - 6, 1, 4, "#ffd27a", 0.6); f.put(x - 12, y - 6, "#ffd27a");
    // cormorants: one perched, one diving and surfacing (9 s)
    f.rect(x - 6, y - 4, x - 4, y - 1, "#2a2622"); f.put(x - 6, y - 5, "#2a2622");
    const d = (t % 9) / 9;
    if (d < 0.5) { f.rect(x + 8, y - 4, x + 10, y - 1, "#2a2622"); f.put(x + 10, y - 5, "#2a2622"); }
    else if (d > 0.75) { const cx = x + 22 + (d - 0.75) * 30; f.rect(cx, y + 6, cx + 3, y + 7, "#2a2622"); f.put(cx + 3, y + 5, "#2a2622"); for (let k = 0; k < 6; k++) f.add(cx - 2 + k, y + 8, "#f4f0ec", 0.5, RIVER); }
    else { const s = (d - 0.5) / 0.25; for (let k = 0; k < 8; k++) f.add(x + 14 + Math.cos(k) * s * 6, y + 4 + Math.sin(k) * s * 1.5, "#ffffff", (1 - s) * 0.7, RIVER); }
    birds(f, t, { n: 5, y: 18, period: 17, c: "#4a3a30", only: SKY });
    return enc(f);
  };
}
