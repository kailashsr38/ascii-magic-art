/* simple-circuit-current: a battery, switch, resistor and bulb, with electrons drifting round when the switch closes and Ohm's law read out. */
import { Grid, palette, gradient, KEYS, fbm, clamp, fract } from "../lib/kit.js";

const all = [], G = {};
const add = (n, c) => { G[n] = all.length; all.push(...c); };
add("bg", gradient(["#06100c", "#0a1812", "#0e2018", "#12281e"], 4));
add("wire", ["#a8642a", "#e09a4a"]);
add("el", ["#4ab0ff", "#c8e8ff"]);
add("cur", ["#ffd166"]);
add("bat", ["#3a3a44", "#ff5a4a", "#5a8aff", "#c8c8d0"]);
add("bulb", ["#3a3a30", "#8a8460", "#fff2a0", "#ffd23a", "#ff9a2a"]);
add("res", ["#c8a07a"]);
add("ui", ["#ffffff", "#8b949e", "#30363d", "#7ee787", "#ff7b72"]);

export const meta = {
  slug: "simple-circuit-current",
  name: "Simple Circuit Current",
  category: "science",
  note: "A switch closes and electrons drift from the negative terminal round through a resistor and a bulb, which lights, while meters show 6 volts, 12 ohms and half an amp.",
  tags: ["electricity", "circuit", "ohms-law", "physics", "education", "science"],
  cols: 96, rows: 30, fps: 24,
  palette: palette(all),
};

const K = (n, i = 0) => KEYS[G[n] + i];
const L = 8, R = 78, T = 4, B = 24, PER = 9;

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const tex = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) tex[x + y * cols] = fbm(x * 0.1, y * 0.25, 3, 23);
  // loop path clockwise from the battery's + terminal (top of the left side)
  const path = [];
  for (let y = 11; y > T; y--) path.push([L, y]);
  for (let x = L; x < R; x++) path.push([x, T]);
  for (let y = T; y < B; y++) path.push([R, y]);
  for (let x = R; x > L; x--) path.push([x, B]);
  for (let y = B; y > 17; y--) path.push([L, y]);
  const N = path.length;
  return (t) => {
    g.clear();
    const ph = t % PER, closed = ph < 6;
    const glow = closed ? clamp(ph * 4) : clamp(1 - (ph - 6) * 3);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = tex[x + y * cols];
      g.set(x, y, (x + y * 3) % 7 === 0 ? "+" : v > 0.6 ? "▒" : "░", K("bg", Math.min(3, Math.floor(v * 4))));
    }
    // wires
    for (const [x, y] of path) g.set(x, y, x === L || x === R ? "┃" : "━", K("wire", 1));
    g.set(L, T, "┏", K("wire", 1)); g.set(R, T, "┓", K("wire", 1)); g.set(L, B, "┗", K("wire", 1)); g.set(R, B, "┛", K("wire", 1));
    // battery on the left side: long plate positive, short plate negative, two cells
    for (let y = 12; y <= 16; y++) g.set(L, y, " ");
    g.text(L - 3, 12, "━━━━━━━", K("bat", 1));
    g.text(L - 1, 13, "━━━", K("bat", 2));
    g.text(L - 3, 15, "━━━━━━━", K("bat", 1));
    g.text(L - 1, 16, "━━━", K("bat", 2));
    g.text(L + 5, 12, "+", K("bat", 1)); g.text(L + 5, 16, "-", K("bat", 2));
    g.text(L - 7, 14, "6 V", K("ui", 0));
    // switch on the top wire
    const SW = 26;
    for (let x = SW; x <= SW + 6; x++) g.set(x, T, " ");
    g.set(SW, T, "●", K("ui", 0)); g.set(SW + 6, T, "●", K("ui", 0));
    if (closed) g.text(SW + 1, T, "━━━━━", K("wire", 1));
    else { g.set(SW + 1, T - 1, "▁", K("ui", 0)); g.set(SW + 2, T - 1, "╱", K("ui", 0)); g.set(SW + 3, T - 2, "╱", K("ui", 0)); g.set(SW + 4, T - 3, "╱", K("ui", 0)); }
    g.text(SW - 1, T + 1, closed ? "SWITCH ON" : "SWITCH OFF", K("ui", closed ? 3 : 4));
    // resistor on the bottom wire
    g.text(36, B, "┤╱╲╱╲╱╲╱╲╱╲├", K("res"));
    g.text(37, B + 1, "resistor", K("ui", 1));
    // bulb on the right side
    const by = 14;
    for (let y = by - 2; y <= by + 2; y++) g.set(R, y, " ");
    g.text(R - 3, by - 3, " ▄▄▄▄ ", K("bulb", glow > 0.3 ? 2 : 1));
    g.text(R - 3, by - 2, "█    █", K("bulb", glow > 0.3 ? 2 : 1));
    g.text(R - 3, by - 1, "█ ╱╲ █", K("bulb", glow > 0.3 ? 2 : 1));
    g.text(R - 3, by, "█╱  ╲█", K("bulb", glow > 0.3 ? 2 : 1));
    g.text(R - 3, by + 1, " ▀██▀ ", K("bulb", glow > 0.3 ? 2 : 1));
    g.text(R - 2, by + 2, "▐██▌", K("bat", 3));
    g.text(R - 2, by - 1, " ╱╲", K("bulb", glow > 0.5 ? 4 : 1));
    g.text(R - 2, by, "╱  ╲", K("bulb", glow > 0.5 ? 4 : 1));
    if (glow > 0.3) {
      const rays = [[-6, -2, "─"], [6, -2, "─"], [-5, -5, "╲"], [5, -5, "╱"], [0, -6, "│"], [-5, 1, "╱"], [5, 1, "╲"]];
      for (const [dx, dy, ch] of rays) g.set(R + dx + (dx > 0 ? 1 : 0), by + dy + 1, ch, K("bulb", 3));
    }
    g.text(R + 6, by + 4, "bulb", K("ui", 1));
    // electrons drift from - round to + (anticlockwise), current arrows clockwise
    const drift = closed ? ph * 6 : 6 * 6;
    for (let k = 0; k < N; k += 4) {
      const i = Math.floor(((N - 1 - k - drift) % N + N) % N);
      const [x, y] = path[i];
      if (g.get(x, y) === "━" || g.get(x, y) === "┃") g.set(x, y, "●", K("el", (k >> 2) % 3 ? 0 : 1));
    }
    if (closed) for (let k = 0; k < 6; k++) {
      const i = Math.floor(fract(k / 6 + ph * 0.05) * N), [x, y] = path[i];
      const [nx, ny] = path[(i + 1) % N];
      const ch = nx > x ? "→" : nx < x ? "←" : ny > y ? "↓" : "↑";
      const ox = x === L ? -2 : x === R ? 2 : 0, oy = y === T ? -1 : y === B ? 1 : 0;
      if (!(y === B && x > 34 && x < 49)) g.set(x + ox, y + oy, ch, K("cur"));
    }
    // meter panel inside the loop
    const MX = 22, MY = 9, MW = 30, MH = 9;
    g.fill(MX + 1, MY + 1, MW - 2, MH - 2, " ");
    g.box(MX, MY, MW, MH, "round", K("ui", 1));
    const I = closed ? 0.5 : 0;
    g.text(MX + 2, MY + 1, "voltage     6.0 V", K("ui", 0));
    g.text(MX + 2, MY + 2, "resistance   12 ohm", K("ui", 0));
    g.text(MX + 2, MY + 3, `current     ${I.toFixed(2)} A`, K("ui", closed ? 3 : 4));
    g.text(MX + 2, MY + 5, "I = V / R = 6 / 12", K("ui", 1));
    g.text(MX + 2, MY + 6, closed ? "circuit complete" : "circuit broken: no flow", K("ui", closed ? 3 : 4));
    // legend
    g.text(1, 27, "● electrons drift from - to +", K("el", 1));
    g.text(33, 27, "→ conventional current flows from + to -", K("cur"));
    g.text(1, 28, "total resistance includes the bulb; electron drift is really under a millimetre per second", K("ui", 1));
    g.text(1, 0, "A SIMPLE SERIES CIRCUIT", K("ui", 0));
    return g.frame();
  };
}
