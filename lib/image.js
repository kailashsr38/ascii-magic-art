/*
 * image.js: turn a picture made by scripts/from-image.py into a moving piece.
 * The picture is a grid of palette keys (colour) and levels 0-7 (how much of
 * the cell is inked). Levels are drawn with the lower block characters
 * ▁▂▃▄▅▆▇█, whose ink grows in eighths, so every look (dots, ASCII, numbers...)
 * can read each cell's brightness back out of it.
 *
 * Motions, all optional and all deterministic in t:
 *   glint:   a soft diagonal band of light that sweeps across every few seconds
 *   twinkle: bright cells that flare for a moment (0..1, how many)
 *   water:   0..1, the row where water starts; below it the levels ripple
 *   waterLeft: 0..1, water only right of this column (a coast on the left)
 *   breathe: the whole picture slowly brightens and dims (0..1, how much)
 *   drift:   0..1, the sky above this row slides sideways, like moving cloud
 *   palms:   palm silhouettes on the left and right edges, swaying in the wind
 *   birds:   n birds crossing the sky in a loose flock, flapping
 *   shooting: an occasional shooting star across the upper sky
 */
const LEVELS = "▁▂▃▄▅▆▇█";

const hash = (x, y, n) => {
  let h = (x * 374761393 + y * 668265263 + n * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Build create() for a picture. data: { color: [rows], level: [rows] }. */
export function imagePiece(meta, data, motion = {}) {
  return function create() {
    const W = meta.cols, H = meta.rows;
    const C = data.color.map((r) => [...r]);
    const L = data.level.map((r) => [...r].map((c) => c.charCodeAt(0) - 48));
    const glint = motion.glint ? { every: 7, width: 9, ...motion.glint } : null;
    const water = motion.water ? Math.round(motion.water * H) : H + 1;
    const wl = Math.round((motion.waterLeft || 0) * W);
    const drift = motion.drift ? Math.round(motion.drift * H) : 0;
    const twinkle = motion.twinkle || 0, breathe = motion.breathe || 0;
    // scenery keys: the darkest palette colour for silhouettes, the brightest for light
    const pal = meta.palette, keys = Object.keys(pal);
    const lumOf = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const DARK = keys.reduce((a, k) => (lumOf(pal[k]) < lumOf(pal[a]) ? k : a), keys[0]);
    const LIGHT = keys.reduce((a, k) => (lumOf(pal[k]) > lumOf(pal[a]) ? k : a), keys[0]);
    // palms: [base x, height, lean, fronds length] as shares of the frame
    const palms = motion.palms ? [[0.03, 0.72, 0.08, 0.17], [0.13, 0.5, 0.045, 0.12], [0.97, 0.75, -0.085, 0.18], [0.875, 0.48, -0.05, 0.12]] : [];
    const flock = Array.from({ length: motion.birds || 0 }, (_, i) => ({ dx: (i * 7) % 23 + i * 2, dy: ((i * 5) % 9) - 4, ph: i * 1.3, sp: 0.9 + (i % 3) * 0.08 }));
    return (t) => {
      const text = [], color = [];
      const flicker = Math.floor(t * 4);
      const glintPos = glint ? (((t % glint.every) / glint.every) * 1.6 - 0.3) * (W + H * 2) : -1e9;
      const swell = breathe ? Math.sin(t * 0.9) * breathe * 1.2 : 0;
      for (let y = 0; y < H; y++) {
        let tr = "", cr = "";
        const shift = y < drift ? Math.floor(t * 1.5 * (1 - y / drift) + 0.5) : 0;
        for (let x = 0; x < W; x++) {
          let sx = x, sy = y;
          if (shift) sx = (((x - shift) % W) + W) % W;
          const wet = y >= water && x >= wl;
          if (wet) { // reflections waver sideways and in brightness
            sx = Math.min(W - 1, Math.max(0, x + Math.round(Math.sin(y * 0.9 + t * 2.2) * 1.2)));
          }
          const k = C[sy][sx];
          let lv = L[sy][sx];
          if (k === " " || lv < 0) { tr += " "; cr += " "; continue; }
          if (lv === 0) { tr += LEVELS[0]; cr += k; continue; } // black stays black
          let v = lv + swell;
          if (wet) v += Math.sin(x * 0.45 + t * 3.1 + y * 0.7) * 1.4;
          if (glint) { const d = Math.abs(x + y * 2 - glintPos); if (d < glint.width) v += (1 - d / glint.width) * 2.5; }
          if (twinkle && lv >= 5 && hash(x, y, flicker) < twinkle * 0.06) v += 3;
          lv = Math.max(0, Math.min(7, Math.round(v)));
          tr += LEVELS[lv]; cr += k;
        }
        text.push(tr); color.push(cr);
      }
      if (!palms.length && !flock.length && !motion.shooting) return { text: text.join("\n"), color: color.join("\n") };
      // scenery drawn on top, cell by cell
      const T = text.map((r) => [...r]), Co = color.map((r) => [...r]);
      const dot = (x, y, k, lv) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; T[y][x] = LEVELS[lv]; Co[y][x] = k; };
      const blob = (x, y, r, k, lv) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + 0.5) dot(x + xx, y + yy, k, lv); };
      for (const [bx, ht, lean, fl] of palms) {
        const sway = Math.sin(t * 0.6 + bx * 9) * 0.01 * W, x0 = bx * W, y0 = H + 2, x1 = x0 + lean * W + sway, y1 = H - ht * H;
        const cx = x0 + lean * W * 0.15, cy = (y0 + y1) / 2;
        // trunk: thick at the base, thinner up top, with a ring every few cells
        for (let i = 0; i <= 90; i++) { const u = i / 90, x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1;
          blob(x, y, u < 0.35 ? 2 : u < 0.8 ? 1.5 : 1, DARK, 0); }
        // fronds: a fan that arches out and droops, with leaflets hanging off both sides
        const L0 = fl * W;
        for (let f = 0; f < 11; f++) {
          const side = f < 5.5 ? -1 : 1, spread = (f / 10) * Math.PI;             // 0..pi across the fan
          const ang = Math.PI + spread + Math.sin(t * 0.9 + f * 1.7 + bx * 7) * 0.05; // pointing left .. right through up
          const L = L0 * (0.75 + 0.3 * Math.sin(f * 2.3 + 1)), lift = Math.sin(spread) * 0.55;
          for (let i = 0; i <= 50; i++) {
            const u = i / 50, x = x1 + Math.cos(ang) * L * u, y = y1 - lift * L * u * 0.7 + (u * u) * L * 0.62;
            blob(x, y, u < 0.5 ? 1 : 0, DARK, 0);
            if (i % 3 === 0 && u > 0.12) { const n = Math.max(1, Math.round(3.4 * (1 - u))); for (let k = 1; k <= n; k++) { dot(x - k * 0.5 * side * 0.3, y + k, DARK, 0); dot(x + Math.cos(ang) * 0.5, y + k * 0.8, DARK, 0); } }
          }
        }
        blob(x1, y1 + 1, 2, DARK, 0);
        blob(x1 - 1.5, y1 + 3, 1, DARK, 0); blob(x1 + 1.5, y1 + 3, 1, DARK, 0); // coconuts
      }
      if (flock.length) {
        const per = 22, bt = (t % per) / per, fx = W + 20 - bt * (W + 60), fy = H * 0.22 + Math.sin(bt * 5) * 5;
        for (const b of flock) {
          const x = fx + b.dx * b.sp, y = fy + b.dy + Math.sin(t * 1.5 + b.ph) * 1.5, up = Math.sin(t * 8 + b.ph) > 0;
          dot(x, y, DARK, 0); dot(x - 1, y + (up ? -1 : 0), DARK, 0); dot(x + 1, y + (up ? -1 : 0), DARK, 0);
          if (!up) { dot(x - 2, y + 1, DARK, 0); dot(x + 2, y + 1, DARK, 0); }
        }
      }
      if (motion.shooting) {
        const per = 9, st = (t % per) / per;
        if (st < 0.09) { const k = st / 0.09, sx = W * (0.25 + 0.4 * Math.floor(t / per) % 2 * 0.5), sy = H * 0.12;
          for (let i = 0; i < 14; i++) { const u = k - i * 0.012; if (u < 0) break; dot(sx + u * W * 0.5, sy + u * H * 0.18, LIGHT, i < 3 ? 7 : Math.max(3, 6 - (i >> 2))); } }
      }
      return { text: T.map((r) => r.join("")).join("\n"), color: Co.map((r) => r.join("")).join("\n") };
    };
  };
}
