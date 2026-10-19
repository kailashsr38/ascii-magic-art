/* moon-tides: the Moon's pull stretching Earth's oceans into two bulges, and a coastal town riding through two high tides a day. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sp", gradient(["#04050c", "#080a18", "#0c1024", "#10162e"], 4));
add("sea", gradient(["#0c3266", "#1650a0", "#2a74cc", "#5aa6ec", "#a6d8ff"], 6));
add("land", gradient(["#2a4a1e", "#46742e", "#6e9a44", "#a8a070"], 4));
add("moon", gradient(["#5a5a62", "#9a9aa2", "#d8d6d0", "#f6f2e8"], 4));
add("pull", ["#5a5070", "#b8a8e8"]);
add("town", ["#ff5a5a", "#ffd166"]);
add("star", ["#7a80a0"]);
add("ui", ["#ffffff", "#8b949e", "#30363d", "#79c0ff", "#7ee787"]);

export const meta = {
  slug: "moon-tides",
  name: "Moon And Tides",
  category: "science",
  note: "The Moon's gravity stretches Earth's oceans into two bulges while Earth spins beneath them, and a tide chart traces the two high tides a coastal town gets each day.",
  tags: ["tides", "moon", "gravity", "earth-science", "education", "science"],
  cols: 100, rows: 32, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const EX = 30, EY = 15, R = 6.5, DAY = 8, MONTH = 27.32 * DAY;
// one lunar day is 24 h 50 min, so the town meets the bulges a little later each day
const HOURS = 24.84;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.08, y * 0.2, 3, 41);
  const r = rng(2);
  const stars = Array.from({ length: 70 }, () => [Math.floor(r() * 58), Math.floor(r() * rows)]);
  const GX = 62, GY = 3, GW = 36, GH = 15;
  const tide = (tt) => Math.cos(2 * ((tt / DAY) * TAU + 0.3 - (tt / MONTH) * TAU));
  return (t) => {
    g.clear();
    const spin = (t / DAY) * TAU, mA = (t / MONTH) * TAU;
    const mx = EX + 26 * Math.cos(mA), my = EY - 12.5 * Math.sin(mA);
    const mAng = Math.atan2(-(my - EY) * 2, mx - EX);
    for (let y = 0; y < rows; y++) for (let x = 0; x < 60; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.62 ? "▒" : "░", K("sp", Math.min(3, Math.floor(v * 4))));
    }
    for (const [sx, sy] of stars) g.set(sx, sy, "·", K("star"));
    // gravity line toward the moon
    const n = 40;
    for (let k = 0; k < n; k++) {
      const f = k / n;
      if ((k + Math.floor(t * 6)) % 3) continue;
      const x = EX + (mx - EX) * f, y = EY + (my - EY) * f;
      if (Math.hypot((x - EX) / 2, y - EY) > R + 3.5) g.set(x, y, "·", K("pull", 1));
    }
    // ocean envelope stretched along the Earth-Moon line, and the solid Earth spinning inside it
    for (let y = EY - R - 4; y <= EY + R + 4; y++) for (let x = EX - 2 * R - 9; x <= EX + 2 * R + 9; x++) {
      const dx = (x + 0.5 - EX) / 2, dy = -(y + 0.5 - EY), d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const water = R + 2.2 + 1.2 * Math.cos(2 * (ang - mAng));
      if (d > water) continue;
      if (d < R) {
        const lon = ang - spin;
        const lv = fbm(Math.cos(lon) * 2 + d * 0.25, Math.sin(lon) * 2 + d * 0.25, 3, 5);
        g.set(x, y, lv > 0.52 ? "█" : "▓", lv > 0.52 ? K("land", clamp(Math.floor((lv - 0.52) * 14), 0, 3)) : K("sea", 1));
      } else {
        const depth = (d - R) / (water - R);
        g.set(x, y, depth > 0.7 ? "▒" : "▓", K("sea", clamp(Math.floor(5 - depth * 3), 2, 5)));
      }
    }
    // the town on the coast, carried round by Earth's spin
    const tAng = spin + 0.3;
    const tx = EX + Math.cos(tAng) * (R + 0.2) * 2, ty = EY - Math.sin(tAng) * (R + 0.2);
    g.set(tx, ty, "●", K("town", 0));
    // moon
    for (let y = Math.floor(my - 2.5); y <= my + 2.5; y++) for (let x = Math.floor(mx - 5); x <= mx + 5; x++) {
      const nx = (x + 0.5 - mx) / 5, ny = (y + 0.5 - my) / 2.5, q = nx * nx + ny * ny;
      if (q > 1) continue;
      g.set(x, y, "█", K("moon", clamp(Math.floor((1 - q) * 4 + fbm(x * 0.6, y, 2, 3) - 0.3), 0, 3)));
    }
    if (my - 4 >= 0) g.text(Math.round(mx) - 2, Math.round(my) - 4 < 0 ? 0 : Math.round(my) - 4, "MOON", K("ui", 0));
    else g.text(Math.round(mx) - 2, Math.round(my) + 3, "MOON", K("ui", 0));
    // bulge labels at the two high-water points and the low-water sides
    const lab = (ang, dist, s, co) => {
      const x = Math.round(EX + Math.cos(ang) * dist * 2 - s.length / 2), y = Math.round(EY - Math.sin(ang) * dist);
      g.text(clamp(x, 0, 59 - s.length), clamp(y, 0, rows - 1), s, co);
    };
    lab(mAng + Math.PI, R + 5.5, "HIGH", K("ui", 3));
    lab(mAng + 0.5, R + 4, "HIGH", K("ui", 3));
    lab(mAng + Math.PI / 2, R + 3, "LOW", K("ui", 1));
    lab(mAng - Math.PI / 2, R + 3, "LOW", K("ui", 1));
    // tide chart
    g.fill(GX + 1, GY + 1, GW - 2, GH - 2, " ");
    g.box(GX, GY, GW, GH, "round", K("ui", 2));
    g.text(GX + 2, GY, " water level at ● ", K("ui", 0));
    g.set(GX + 18, GY, "●", K("town", 0));
    g.text(GX + 1, GY + 2, "high", K("ui", 3));
    g.text(GX + 1, GY + GH - 3, "low ", K("ui", 1));
    const PW = GW - 8, span = DAY * 2;
    for (let i = 0; i < PW; i++) {
      const tt = t - span + (i / (PW - 1)) * span;
      const h = tide(tt), y = Math.round(GY + 2 + (1 - (h + 1) / 2) * (GH - 5));
      for (let yy = y + 1; yy < GY + GH - 2; yy++) g.set(GX + 6 + i, yy, "▓", K("sea", 1));
      g.set(GX + 6 + i, y, i === PW - 1 ? "●" : "█", i === PW - 1 ? K("town", 0) : K("sea", 4));
    }
    g.text(GX + 6, GY + GH - 2, "-48 h", K("ui", 1));
    g.text(GX + 18, GY + GH - 2, "-24 h", K("ui", 1));
    g.text(GX + GW - 6, GY + GH - 2, "now", K("ui", 1));
    // notes
    const h = tide(t);
    g.text(62, 20, h > 0.6 ? "HIGH TIDE at the town  " : h < -0.6 ? "LOW TIDE at the town   " : h > 0 ? "tide going " + (tide(t + 0.1) > h ? "up  " : "down") + " at town" : "tide going " + (tide(t + 0.1) > h ? "up  " : "down") + " at town", K("town", 1));
    g.text(62, 22, "Two bulges: one faces the Moon,", K("ui", 0));
    g.text(62, 23, "one is on the far side where the", K("ui", 0));
    g.text(62, 24, "Moon pulls Earth more than water.", K("ui", 0));
    g.text(62, 26, "Earth spins through both bulges,", K("ui", 0));
    g.text(62, 27, `so most coasts get 2 high tides`, K("ui", 0));
    g.text(62, 28, `every ${HOURS} hours.`, K("ui", 0));
    g.text(62, 30, "bulges exaggerated, not to scale", K("ui", 1));
    g.text(1, 0, "TIDES", K("ui", 0));
    g.text(1, 1, "view from above the North Pole", K("ui", 1));
    return g.frame();
  };
}
