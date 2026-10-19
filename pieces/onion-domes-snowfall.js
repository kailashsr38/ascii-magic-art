/* onion-domes-snowfall: a cathedral of bright striped onion domes in falling snow, with people crossing the square, hand-built picture scene. */
import { fbm, noise2, clamp, lerp, rng, KEYS } from "../lib/kit.js";

const W = 192, H = 108;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const ramp = (stops, t) => {
  t = clamp(t);
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) return mix(hex(stops[i - 1][1]), hex(stops[i][1]), (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1));
  return hex(stops[stops.length - 1][1]);
};
const toHex = (c) => "#" + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("");
function buildPal(anchors) {
  const P = [];
  for (const a of anchors) {
    const n = a[a.length - 1], cs = a.slice(0, -1).map(hex);
    for (let i = 0; i < n; i++) { const t = (i / Math.max(1, n - 1)) * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(t)); P.push(cs.length === 1 ? cs[0] : mix(cs[k], cs[k + 1], t - k)); }
  }
  return P;
}
function inPoly(x, y, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const LEVELS = "▁▂▃▄▅▆▇█";
// each cell -> nearest palette key + a level char for its brightness against that key
function encoder(PAL) {
  const LUM = PAL.map((c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255);
  const cache = new Map();
  const nearest = (r, g, b) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let hit = cache.get(k);
    if (hit !== undefined) return hit;
    let best = 0, bd = 1e9;
    for (let i = 0; i < PAL.length; i++) { const p = PAL[i], d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11; if (d < bd) { bd = d; best = i; } }
    cache.set(k, best);
    return best;
  };
  return (out) => {
    const text = [], color = [];
    for (let y = 0; y < H; y++) {
      let tr = "", cr = "";
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3, r = out[i], g = out[i + 1], b = out[i + 2];
        const k = nearest(r, g, b), Y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        const lv = Y > 0.86 ? 7 : clamp(Math.round(5 + (Y - LUM[k]) * 12), 3, 6);
        tr += LEVELS[lv]; cr += KEYS[k];
      }
      text.push(tr); color.push(cr);
    }
    return { text: text.join("\n"), color: color.join("\n") };
  };
}
// a float RGB canvas with a cell-kind mask: put (opaque), add (blend)
function canvas() {
  const rgb = new Float32Array(W * H * 3), kind = new Uint8Array(W * H);
  const put = (x, y, c, k) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2]; if (k !== undefined) kind[i] = k; };
  const add = (x, y, c, a) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return; const i = (y * W + x) * 3; rgb[i] += (c[0] - rgb[i]) * a; rgb[i + 1] += (c[1] - rgb[i + 1]) * a; rgb[i + 2] += (c[2] - rgb[i + 2]) * a; };
  const rect = (x0, y0, x1, y1, c, k) => { for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) put(x, y, c, k); };
  return { rgb, kind, put, add, rect };
}
const hash = (a, b) => { let h = Math.imul(a * 374761393 + b * 668265263, 1274126177); h ^= h >>> 15; return ((Math.imul(h, 2246822519) ^ (h >>> 13)) >>> 0) / 4294967296; };
const tri = (v) => { const f = v - Math.floor(v); return f < 0.5 ? f * 2 : 2 - f * 2; };

const PAL = buildPal([
  ["#7a88ac", "#8e9abc", "#a4acc6", "#b8bccc", 6],
  ["#fff4d0", "#ffd890", 2],
  ["#e07858", "#e8866a", "#b85a44", "#8a3a2c", 4],
  ["#d8d4c8", "#b8b4a8", 2],
  ["#4aac70", "#78c888", 2],
  ["#ec6450", "#f0b050", "#f0d060", 3],
  ["#5a8ae0", "#7aa4e4", 2],
  ["#d4d8e4", "#c4c8d6", "#acb2c4", "#9098b0", 4],
  ["#1e1e26", "#34343e", "#4a4a56", 3],
  ["#7a3a5a", "#2e5a8a", "#a87838", 3],
  ["#c89a50", "#e0b468", 2],
]);

export const meta = {
  slug: "onion-domes-snowfall", name: "Onion Domes Snowfall", category: "cities",
  note: "A brick cathedral crowned with swirling striped onion domes stands in falling snow while bundled-up people cross the white square below.",
  tags: ["cathedral", "domes", "snow", "winter", "city", "halftone", "christmas", "hero"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots",
  dots: { tone: { gamma: 0.62, floor: 0.03, sat: 0.82 } },
  palette: Object.fromEntries(PAL.map((c, i) => [KEYS[i], toHex(c)])),
};

const SKY = 1, BUILD = 2, GROUNDK = 3;
const GY = 90;

export default function create() {
  const C = canvas(), { put, rect, kind, rgb } = C;
  const SNOW = hex("#d4d8e4"), SNOW2 = hex("#c4c8d6");
  // 1. overcast winter sky
  for (let y = 0; y < GY; y++) for (let x = 0; x < W; x++) put(x, y, ramp([[0, "#7a88ac"], [0.5, "#8e9abc"], [0.85, "#a4acc6"], [1, "#b8bccc"]], y / GY), SKY);
  // 2. a crenellated brick wall behind, both sides, hazy with snow
  for (let x = 0; x < W; x++) {
    const top = 74 - ((x % 8) < 4 ? 2 : 0);
    for (let y = top; y < GY; y++) put(x, y, mix(hex("#e8866a"), hex("#a4acc6"), 0.45), BUILD);
    put(x, top, mix(SNOW2, hex("#a4acc6"), 0.3), BUILD);
  }
  // a far wall tower on the left with a green tent roof
  rect(10, 46, 24, GY, mix(hex("#e07858"), hex("#a4acc6"), 0.4), BUILD);
  for (let y = 30; y < 46; y++) { const hw = ((y - 30) / 16) * 8; for (let x = Math.round(17 - hw); x <= 17 + hw; x++) put(x, y, mix(hex("#4aac70"), hex("#a4acc6"), 0.4), BUILD); }
  for (let y = 24; y < 30; y++) put(17, y, hex("#9098b0"), BUILD);
  rect(15, 52, 19, 58, hex("#9098b0"), BUILD);
  // 3. the cathedral body: brick with white arcades and snow on every ledge
  const body = (x0, x1, top, b) => {
    for (let y = top; y < b; y++) for (let x = x0; x <= x1; x++) {
      let c = (x + Math.floor(y / 2)) % 9 === 0 ? hex("#b85a44") : hex("#e07858");
      if (x > x1 - 3) c = hex("#b85a44");
      if ((y - top) % 8 === 2) c = hex("#d8d4c8");
      put(x, y, c, BUILD);
    }
    for (let x = x0 + 3; x < x1 - 3; x += 6) for (let y = top + 4; y < Math.min(b, top + 7); y++) put(x, y, hex("#34343e"), BUILD);
    for (let x = x0; x <= x1; x++) { put(x, top, SNOW, BUILD); put(x, top + 1, SNOW2, BUILD); }
  };
  body(36, 156, 70, GY);
  // arcaded gallery and the porch steps
  for (let x = 40; x < 152; x += 7) for (let y = 78; y < 88; y++) if (y > 81 || Math.hypot(x + 2 - (x + 2), y - 81) < 3) { put(x + 1, y, hex("#1e1e26"), BUILD); put(x + 2, y, hex("#1e1e26"), BUILD); put(x + 3, y, hex("#34343e"), BUILD); }
  // 4. drums and onion domes
  const dome = (cx, baseY, r, drumH, cA, cB, pattern, gold) => {
    const dw = Math.max(2, r * 0.62);
    // drum: a cylinder with small windows and a snowy ledge
    for (let y = baseY - drumH; y < baseY; y++) for (let x = Math.round(cx - dw); x <= cx + dw; x++) {
      let c = x > cx + dw * 0.5 ? hex("#b85a44") : hex("#e8866a");
      if ((y - (baseY - drumH)) % 7 === 3 && Math.abs(x - cx) < dw - 1 && (x & 1)) c = hex("#34343e");
      if (y === baseY - drumH) c = hex("#d8d4c8");
      put(x, y, c, BUILD);
    }
    for (let x = Math.round(cx - dw - 1); x <= cx + dw + 1; x++) put(x, baseY, SNOW, BUILD);
    // the bulb: wider than its drum, swelling then drawing to a point
    const hgt = r * 2.5, b0 = baseY - drumH;
    for (let y = Math.floor(b0 - hgt); y < b0; y++) {
      const v = (b0 - y) / hgt;
      let w = v < 0.62 ? r * Math.sqrt(clamp(1 - ((v - 0.3) / 0.36) ** 2)) : r * 0.62 * Math.pow((1 - v) / 0.38, 1.6) * 0.95;
      if (v < 0.06) w = Math.max(w, dw);
      for (let x = Math.round(cx - w); x <= cx + w; x++) {
        const u = (x - cx) / (w || 1);
        let k;
        if (pattern === 0) k = Math.floor((u * 1.6 + v * 3.2) * 2.2); // swirl
        else if (pattern === 1) k = Math.floor((u * 1.6 - v * 3.2) * 2.2); // swirl the other way
        else if (pattern === 2) k = Math.floor(u * 3 + 10) + Math.floor(v * 7); // checks
        else k = Math.floor(Math.abs(((u * 2 + v * 6) % 2)) * 1.2); // zigzag bands
        let c = (k & 1) ? hex(cA) : hex(cB);
        if (u > 0.7) c = mix(c, hex("#34343e"), 0.15); // shade the right edge
        if (v > 0.5 && v < 0.6 && u < 0) c = mix(c, SNOW, 0.5); // snow on the shoulder
        put(x, y, c, BUILD);
      }
    }
    // finial and cross
    const tip = Math.floor(b0 - hgt);
    for (let y = tip - 5; y < tip; y++) put(cx, y, hex(gold ? "#e0b468" : "#c89a50"), BUILD);
    put(cx - 1, tip - 4, hex("#c89a50"), BUILD); put(cx + 1, tip - 4, hex("#c89a50"), BUILD);
  };
  // the central tent spire on its tall tower
  rect(88, 36, 104, 70, hex("#e8866a"), BUILD); rect(101, 36, 104, 70, hex("#e07858"), BUILD);
  for (let y = 40; y < 68; y += 6) for (let x = 90; x < 102; x += 4) { put(x, y, hex("#d8d4c8")); put(x, y + 1, hex("#34343e")); put(x, y + 2, hex("#34343e")); }
  for (let y = 12; y < 36; y++) { const hw = ((y - 12) / 24) * 9; for (let x = Math.round(96 - hw); x <= 96 + hw; x++) { let c = (Math.floor((x - 96) / 2 + y / 3) & 1) ? hex("#4aac70") : hex("#d8d4c8"); if (x > 96 + hw * 0.5) c = mix(c, hex("#34343e"), 0.3); put(x, y, c, BUILD); } }
  dome(96, 12, 3.5, 2, "#f0d060", "#f0b050", 0, true);
  dome(62, 64, 9, 10, "#4aac70", "#d8d4c8", 0, false);
  dome(130, 64, 9, 10, "#ec6450", "#d8d4c8", 1, false);
  dome(78, 54, 9, 8, "#5a8ae0", "#d8d4c8", 2, false);
  dome(114, 54, 9, 8, "#f0d060", "#4aac70", 3, false);
  dome(46, 70, 6, 6, "#f0b050", "#4aac70", 1, false);
  dome(146, 70, 6, 6, "#78c888", "#ec6450", 0, false);
  // 5. the snowy square, and the lamp post in front
  for (let y = GY; y < H; y++) for (let x = 0; x < W; x++) {
    let c = mix(SNOW2, hex("#acb2c4"), clamp((y - GY) / 30 + (noise2(x / 9, y / 3, 4) - 0.5) * 0.5));
    if (y === GY) c = hex("#9098b0");
    put(x, y, c, GROUNDK);
  }
  const LX = 172, LY = 54;
  for (let y = LY + 4; y < 104; y++) { put(LX, y, hex("#1e1e26")); put(LX + 1, y, hex("#34343e")); }
  for (let y = 100; y < 104; y++) for (let x = LX - 2; x <= LX + 3; x++) put(x, y, hex("#1e1e26"));
  for (let y = 0; y < H; y++) for (let x = LX - 22; x < LX + 24; x++) { const d = Math.hypot(x - LX - 0.5, y - LY); if (d < 22) C.add(x, y, hex("#e0b468"), clamp(1 - d / 22) ** 2 * 0.5); }
  rect(LX - 2, LY - 3, LX + 3, LY - 3, hex("#1e1e26")); rect(LX - 1, LY - 4, LX + 2, LY - 4, hex("#1e1e26"));
  rect(LX - 2, LY - 2, LX + 3, LY + 2, hex("#ffd890")); rect(LX - 1, LY - 1, LX + 2, LY + 1, hex("#fff4d0"));
  rect(LX - 2, LY + 3, LX + 3, LY + 3, hex("#1e1e26"));
  for (let x = LX - 3; x <= LX + 4; x++) put(x, LY - 5, SNOW);

  const base = rgb.slice(), out = rgb, enc = encoder(PAL);
  const DK = hex("#1e1e26"), DK2 = hex("#34343e"), SCARF = [hex("#ec6450"), hex("#7a3a5a"), hex("#2e5a8a"), hex("#a87838"), hex("#4aac70")];
  const people = Array.from({ length: 8 }, (_, i) => ({ sp: (1.6 + hash(i, 2) * 1.4) * (i % 2 ? -1 : 1), ph: hash(i, 3) * 300, y: 96 + (i * 5) % 11, h: 12 + (i % 3), sc: i % 5 }));
  const flakes = Array.from({ length: 260 }, (_, i) => ({ x: hash(i, 11) * W, y: hash(i, 12) * H, sp: 4 + hash(i, 13) * 6, dr: hash(i, 14) * 6, near: hash(i, 15) > 0.82 }));

  return (t) => {
    out.set(base);
    // people crossing the square in long coats, scarves and hats
    for (const p of people) {
      const span = W + 30, q = (((t * p.sp + p.ph) % span) + span) % span, x = Math.round(q - 15), y = p.y, step = Math.floor(t * 3 + p.ph) & 1;
      const sc = (y - 90) / 18, h = Math.round(p.h * (0.75 + sc * 0.4));
      for (let k = 2; k < h - 3; k++) { const wdt = k < 6 ? 2 : 1; for (let dx = -wdt + 1; dx <= wdt; dx++) put(x + dx, y - k, k > h - 7 ? DK2 : DK); }
      put(x, y - h + 4, SCARF[p.sc]); put(x + 1, y - h + 4, SCARF[p.sc]);
      put(x, y - h + 3, hex("#c89a50")); put(x + 1, y - h + 3, hex("#c89a50"));
      put(x, y - h + 2, SCARF[(p.sc + 2) % 5]); put(x + 1, y - h + 2, SCARF[(p.sc + 2) % 5]); put(x, y - h + 1, SCARF[(p.sc + 2) % 5]);
      put(x - (step ? 1 : 0), y - 1, DK); put(x + 1 + (step ? 1 : 0), y - 1, DK); put(x, y, DK2); put(x + 1, y, DK2);
    }
    // snow falling, drifting a little on the wind
    for (const f of flakes) {
      const y = (f.y + t * f.sp) % (H + 4) - 2, x = (((f.x + Math.sin(t * 0.7 + f.dr) * 2 + t * 1.2) % W) + W) % W;
      put(x, y, f.near ? SNOW : SNOW2);
      if (f.near) put(x + 1, y, SNOW2);
    }
    return enc(out);
  };
}
