/* seasons-axial-tilt: Earth orbiting the Sun with its axis fixed in space, showing why the hemispheres get summer and winter. */
import { Grid, palette, gradient, KEYS, fbm, rng, clamp, TAU } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sp", gradient(["#04050c", "#080a16", "#0c0f20", "#10142a"], 4));
add("sun", gradient(["#ff7a1a", "#ffa62a", "#ffd23a", "#fff4b8"], 4));
add("sea", gradient(["#0c2a5a", "#164a8a", "#2a70b8", "#4a9ad8"], 4));
add("land", gradient(["#2a5a26", "#4a8a3a", "#8ab060", "#e8e8e0"], 4));
add("dark", ["#06101e", "#0c1a2a", "#14281a"]);
add("lat", ["#ffd166", "#ff7b72", "#79c0ff"]);
add("axis", ["#ffffff", "#c8d0e0"]);
add("orbit", ["#3a4060", "#7a80a0"]);
add("star", ["#7a80a0"]);
add("ui", ["#ffffff", "#8b949e", "#7ee787", "#79c0ff", "#ffa657"]);

export const meta = {
  slug: "seasons-axial-tilt",
  name: "Seasons From Axial Tilt",
  category: "science",
  note: "Earth circles the Sun with its axis always tilted 23.4 degrees the same way, so each hemisphere leans toward the Sun for summer and away for winter, shown in orbit and close up.",
  tags: ["seasons", "earth", "astronomy", "earth-science", "education", "science"],
  cols: 104, rows: 32, fps: 20,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const SX = 31, SY = 15, RX = 26, RY = 10, PER = 24, TILT = 23.4;
const IX = 79, IY = 13, IR = 7;   // inset sphere (rows)

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.08, y * 0.2, 3, 31);
  const r = rng(4);
  const stars = Array.from({ length: 70 }, () => [Math.floor(r() * cols), Math.floor(r() * rows)]);
  const LATS = [[66.6, "Arctic", 2], [23.4, "Cancer", 0], [0, "Equator", 1], [-23.4, "Capricorn", 0], [-66.6, "Antarctic", 2]];
  return (t) => {
    g.clear();
    const a = Math.PI - (t / PER) * TAU;            // June on the left, then Sept at the front
    const ex = SX + RX * Math.cos(a), ey = SY + RY * Math.sin(a);
    const lean = -Math.cos(a);                        // +1 north pole toward the Sun
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, v > 0.62 ? "▒" : "░", K("sp", Math.min(3, Math.floor(v * 4))));
    }
    for (const [sx, sy] of stars) g.set(sx, sy, "·", K("star"));
    // orbit and sun
    for (let k = 0; k < 140; k++) {
      const b = (k / 140) * TAU;
      if (k % 2 === 0) g.set(Math.round(SX + RX * Math.cos(b)), Math.round(SY + RY * Math.sin(b)), "·", K("orbit", 1));
    }
    for (let y = SY - 4; y <= SY + 4; y++) for (let x = SX - 9; x <= SX + 9; x++) {
      const d = Math.hypot((x - SX) / 2, y - SY);
      if (d < 3.6) g.set(x, y, "█", K("sun", clamp(Math.floor((3.6 - d) * 1.2), 0, 3)));
      else if (d < 4.6) g.set(x, y, "░", K("sun", 0));
    }
    g.text(SX - 1, SY + 5, "SUN", K("ui", 0));
    // small earth in orbit: lit side toward the sun, axis always leaning right
    const tx = SX - ex, ty = (SY - ey) * 2, tl = Math.hypot(tx, ty) || 1;
    for (let y = Math.floor(ey - 2); y <= ey + 2; y++) for (let x = Math.floor(ex - 4); x <= ex + 4; x++) {
      const nx = (x + 0.5 - ex) / 4, ny = (y + 0.5 - ey) / 2;
      if (nx * nx + ny * ny > 1) continue;
      const lit = (nx * tx + ny * 2 * ty / 2) / tl > -0.05;
      g.set(x, y, "█", lit ? K("sea", 3) : K("dark", 1));
    }
    g.set(ex + 2, ey - 3, "╱", K("axis", 0)); g.set(ex + 3, ey - 4, "N", K("axis", 0));
    g.set(ex - 2, ey + 3, "╱", K("axis", 1));
    // month labels
    g.text(1, 13, "JUN", K("ui", 4)); g.text(1, 14, "solstice", K("ui", 1));
    g.text(25, 27, "SEP equinox", K("ui", 1));
    g.text(52, 10, "DEC", K("ui", 3)); g.text(52, 11, "solstice", K("ui", 1));
    g.text(25, 3, "MAR equinox", K("ui", 1));
    // inset: close-up with sunlight from the left
    const beta = (TILT * lean * Math.PI) / 180;     // top of axis leans toward the light
    const sb = Math.sin(beta), cb = Math.cos(beta);
    g.text(62, 1, "CLOSE UP", K("ui", 0));
    g.text(62, 2, "sunlight →", K("sun", 2));
    for (let k = 0; k < 7; k++) g.text(62, 6 + k * 2, "→", K("sun", 1 + (k & 1)));
    for (let y = IY - IR; y <= IY + IR; y++) for (let x = IX - 2 * IR; x <= IX + 2 * IR; x++) {
      const nx = (x + 0.5 - IX) / (2 * IR), ny = (y + 0.5 - IY) / IR, q = nx * nx + ny * ny;
      if (q > 1) continue;
      const nz = Math.sqrt(1 - q);
      const sinLat = -nx * sb - ny * cb;
      const lat = Math.asin(clamp(sinLat, -1, 1)) * 57.3;
      const px = nx * cb - ny * sb;
      const lon = Math.atan2(px, nz) + t * 0.5;
      const light = -nx;
      const landV = fbm(lon * 1.6 + 10, lat * 0.05 + 3, 3, 7);
      const ice = Math.abs(lat) > 70;
      let ch = "█", co;
      if (light > 0.02) co = ice ? K("land", 3) : landV > 0.56 ? K("land", clamp(Math.floor(light * 3), 0, 2)) : K("sea", clamp(Math.floor(light * 4), 0, 3));
      else { ch = "▓"; co = landV > 0.56 && !ice ? K("dark", 2) : K("dark", 0); }
      for (const [L, , c] of LATS) if (Math.abs(lat - L) < 1.6) { ch = "─"; co = K("lat", c); }
      g.set(x, y, ch, co);
    }
    // axis through the poles
    for (let k = -IR - 2; k <= IR + 2; k++) {
      const x = IX - sb * k * 2, y = IY - cb * k;
      if (Math.abs(k) > IR - 0.5) g.set(Math.round(x), Math.round(y), Math.abs(beta) < 0.1 ? "│" : beta > 0 ? "╲" : "╱", K("axis", 0));
    }
    g.text(Math.round(IX - sb * (IR + 3) * 2), Math.round(IY - cb * (IR + 3)), "N", K("axis", 0));
    // latitude labels on the night limb
    for (const [L, name, c] of LATS) {
      const psi = -(L * Math.PI) / 180 - beta;
      const lx = Math.round(IX + 2 * IR * Math.cos(psi)) + 2, ly = Math.round(IY + IR * Math.sin(psi));
      if (ly >= 0 && ly < rows - 4) g.text(Math.min(lx, cols - name.length), ly, name, K("lat", c));
    }
    // explanation
    const sub = TILT * lean;
    const season = lean > 0.38 ? "NORTHERN SUMMER, SOUTHERN WINTER" : lean < -0.38 ? "NORTHERN WINTER, SOUTHERN SUMMER" : "NEAR AN EQUINOX: equal day and night";
    g.text(60, 28, season.padEnd(40), K("ui", lean > 0.38 ? 4 : lean < -0.38 ? 3 : 2));
    const lat = Math.abs(sub) < 0.05 ? "Sun overhead at the equator" : `Sun overhead at ${Math.abs(sub).toFixed(1).padStart(4)}°${sub >= 0 ? "N" : "S"}    `;
    g.text(60, 29, lat, K("ui", 0));
    g.text(60, 30, "the axis always points the same way", K("ui", 1));
    g.text(1, 0, "THE SEASONS", K("ui", 0));
    g.text(1, 1, `axial tilt ${TILT}°`, K("ui", 1));
    return g.frame();
  };
}
