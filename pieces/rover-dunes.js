/* rover-dunes: a six-wheeled rover rolling over rippled red dunes, leaving tracks and dust under a butterscotch sky. */
import { Grid, palette, gradient, KEYS, fbm, noise2, clamp } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("sky", gradient(["#5a3a2e", "#9a6248", "#c8916a", "#e2b48a", "#f0cfa6"], 8));
add("far", gradient(["#6a3a2a", "#8a4e34", "#a46242"], 3));
add("mid", gradient(["#5a2a16", "#8a4222", "#b05a2e", "#cc7440"], 4));
add("near", gradient(["#2e1208", "#5a2410", "#8a3a1a", "#b45626", "#d87a3e", "#f0a066"], 10));
add("rov", gradient(["#1a1a1e", "#4a4a52", "#8a8a94", "#c8c8d0", "#f2f2f6"], 5));
add("gold", ["#7a5a10", "#d8a830", "#ffe080"]);
add("panel", ["#0e1a3a", "#1e3a7a", "#4a7ad0"]);
add("dust", gradient(["#a06a48", "#d8a47a"], 2));
add("sun", ["#f6e6cc", "#ffffff"]);
export const meta = {
  slug: "rover-dunes",
  name: "Rover on Red Dunes",
  category: "cosmos",
  note: "A six-wheeled rover rolls across rippled red dunes, wheels turning and mast camera scanning, leaving twin tracks and a trail of dust under a butterscotch sky.",
  tags: ["mars", "rover", "desert", "space", "hero", "wallpaper"],
  cols: 100, rows: 34, fps: 20,
  palette: palette(all),
};
const K = (n, i) => KEYS[G[n] + i];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const farH = (x) => 13 - 4 * fbm(x * 0.02, 1, 3, 2) - (x > 60 && x < 78 ? 3 * clamp(1 - Math.abs(x - 69) / 9) : 0);
  const midH = (x) => 18 - 3.5 * fbm(x * 0.03, 5, 3, 7);
  const nearH = (x) => 26 - 3 * Math.sin(x * 0.045) - 1.5 * fbm(x * 0.05, 9, 3, 11);
  const RX = 40;
  return (t) => {
    g.clear();
    const sp = 4.5;   // ground speed, columns per second
    const off = t * sp;
    // sky
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = clamp(y / 16);
      g.set(x, y, v > 0.6 ? "▓" : v > 0.3 ? "▒" : "░", K("sky", Math.min(7, Math.floor(v * 8))));
    }
    // small pale sun
    for (let y = 2; y < 6; y++) for (let x = 78; x < 86; x++) {
      const d = Math.hypot((x - 82) / 2.4, (y - 3.5) / 1.2);
      if (d < 1) g.set(x, y, d < 0.5 ? "█" : "▓", K("sun", d < 0.5 ? 1 : 0));
    }
    // far mesas, mid dunes and near ground, each scrolling at its own speed
    for (let x = 0; x < cols; x++) {
      const fh = farH(x + off * 0.1);
      for (let y = Math.floor(fh); y < rows; y++) g.set(x, y, y === Math.floor(fh) ? "▄" : "█", K("far", y < fh + 2 ? 2 : y < fh + 4 ? 1 : 0));
      const mh = midH(x + off * 0.35);
      for (let y = Math.floor(mh); y < rows; y++) {
        const lit = clamp(0.5 + (midH(x + off * 0.35 + 1) - mh) * -1.2);
        g.set(x, y, y === Math.floor(mh) ? "▄" : lit > 0.55 ? "█" : "▓", K("mid", Math.min(3, Math.floor(lit * 4))));
      }
      const wx = x + off;
      const nh = nearH(wx);
      for (let y = Math.floor(nh); y < rows; y++) {
        const depth = (y - nh) / (rows - nh + 1);
        const slope = nearH(wx + 1) - nh;
        // wind ripples running across the sand
        const rip = Math.sin(wx * 0.9 + y * 2.2 + noise2(wx * 0.1, y * 0.3, 3) * 3);
        let li = Math.floor(clamp(0.55 - slope * 1.4 + depth * 0.25) * 9);
        let ch = rip > 0.55 ? "▓" : "█";
        if (rip > 0.55) li = Math.max(0, li - 2);
        g.set(x, y, ch, K("near", Math.min(9, li)));
      }
    }
    // tracks: two dotted lines behind the rover in the sand (they scroll with the ground)
    for (let x = 0; x < RX - 2; x++) {
      const wx = x + off, y = Math.floor(nearH(wx)) + 2;
      if (Math.floor(wx * 1.5) % 2 === 0) { g.set(x, y, "▒", K("near", 3)); g.set(x, y + 2, "▒", K("near", 4)); }
    }
    // rover: body rides on the ground under its wheels
    const yL = nearH(RX - 8 + off), yR = nearH(RX + 8 + off);
    const base = Math.round((yL + yR) / 2) - 1;
    const tilt = (yR - yL) / 16;
    const yAt = (dx) => Math.round(base + dx * tilt);
    // wheels with turning spokes
    const spin = "|/-\\"[Math.floor(t * 8) % 4];
    for (const dx of [-8, -1, 6]) {
      const wy = Math.round(nearH(RX + dx + off)) - 1;
      g.text(RX + dx - 1, wy, "(" + spin + ")", K("rov", 3));
      g.set(RX + dx, wy, spin, K("rov", 4));
      g.set(RX + dx - 1, wy, "(", K("rov", 1)); g.set(RX + dx + 1, wy, ")", K("rov", 1));
      // rocker-bogie legs up to the body
      g.set(RX + dx, wy - 1, "│", K("rov", 2));
    }
    for (let dx = -9; dx <= 8; dx++) g.set(RX + dx, yAt(dx) - 2, "═", K("rov", 2));
    // body box
    for (let dx = -7; dx <= 6; dx++) for (let dy = 3; dy <= 4; dy++) g.set(RX + dx, yAt(dx) - dy, dy === 4 ? "▀" : "█", K(dy === 4 ? "gold" : "rov", dy === 4 ? 1 : 3));
    // solar deck on top
    for (let dx = -9; dx <= 8; dx++) g.set(RX + dx, yAt(dx) - 5, "▄", K("panel", (dx & 1) ? 1 : 2));
    // mast with a camera head that pans
    const mx = RX + 4;
    for (let dy = 6; dy <= 9; dy++) g.set(mx, yAt(4) - dy, "│", K("rov", 3));
    const look = Math.sin(t * 0.6) > 0 ? 1 : -1;
    g.text(mx - 1, yAt(4) - 10, look > 0 ? "[▪█" : "█▪]", K("rov", 4));
    g.set(mx + look * 1, yAt(4) - 10, "▪", K("rov", 0));
    // antenna and arm
    g.set(RX - 6, yAt(-6) - 6, "╿", K("rov", 3)); g.set(RX - 6, yAt(-6) - 7, "•", K("rov", 4));
    g.set(RX + 9, yAt(8) - 3, "╲", K("rov", 2)); g.set(RX + 10, yAt(8) - 2, "▪", K("rov", 3));
    // dust kicked up from the wheels, drifting back and thinning
    for (let i = 0; i < 18; i++) {
      const age = ((t * 1.3 + i * 0.37) % 2.2);
      const x = RX - 9 - age * 7 - (i % 3);
      const y = Math.round(nearH(RX - 8 + off)) - 1 - age * 1.6 - (i % 2);
      if (age < 2.2) g.set(x, y, age < 0.7 ? "▓" : age < 1.4 ? "▒" : "░", K("dust", age < 1 ? 1 : 0));
    }
    return g.frame();
  };
}
