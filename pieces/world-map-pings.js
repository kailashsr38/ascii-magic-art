/* world-map-pings: a dotted world map with request pings flaring up and arcs linking cities. */
import { Grid, palette, rng, clamp, fbm } from "../lib/kit.js";

export const meta = {
  slug: "world-map-pings",
  name: "World Map Pings",
  category: "live-data",
  note: "A dotted world map where live request pings flare up in cities and arcs carry traffic between them.",
  tags: ["map", "world", "global", "traffic", "dashboard", "hero"],
  cols: 100, rows: 32, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#1c2b3a", "#35607f", "#5389b0", "#7ee787", "#79c0ff", "#ffa657", "#f778ba", "#ffffff", "#56d4dd", "#30363d"]),
};

const LAND = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 64], [-62, 58], [-55, 48], [-70, 43], [-76, 35], [-81, 25], [-97, 27], [-97, 19], [-88, 15], [-79, 8], [-86, 12], [-106, 22], [-117, 32], [-124, 40], [-125, 49], [-136, 58], [-152, 60], [-166, 60]],
  [[-55, 60], [-43, 60], [-21, 70], [-18, 80], [-60, 83], [-73, 77], [-57, 68]],
  [[-79, 8], [-60, 11], [-50, 0], [-35, -6], [-40, -22], [-48, -27], [-57, -37], [-66, -55], [-73, -50], [-72, -30], [-70, -18], [-81, -5]],
  [[-10, 36], [-9, 43], [-2, 44], [-4, 48], [1, 50], [5, 53], [8, 57], [5, 62], [15, 69], [28, 71], [40, 67], [33, 60], [40, 55], [30, 46], [27, 41], [21, 40], [16, 38], [10, 44], [3, 43]],
  [[-17, 21], [-10, 30], [-6, 36], [10, 37], [32, 31], [35, 28], [43, 12], [51, 12], [40, -5], [40, -15], [33, -27], [20, -35], [17, -28], [12, -15], [13, -5], [9, 4], [-8, 4], [-17, 14]],
  [[27, 41], [30, 46], [40, 55], [33, 60], [40, 67], [70, 73], [110, 77], [140, 72], [180, 69], [172, 60], [156, 57], [141, 52], [131, 43], [122, 40], [121, 30], [109, 20], [106, 10], [100, 13], [98, 8], [92, 22], [80, 15], [77, 8], [72, 20], [65, 25], [57, 25], [52, 15], [43, 12], [35, 28], [36, 36]],
  [[114, -22], [130, -12], [137, -12], [142, -11], [146, -19], [153, -25], [150, -37], [140, -38], [132, -32], [115, -34]],
];
const ISLANDS = [[-3, 54, 3, 4.5], [138, 37, 3, 6], [114, 0, 4, 4], [102, -1, 4, 4], [120, -5, 7, 2.5], [172, -41, 3, 5], [47, -19, 2, 5], [-80, 22, 4, 1.5], [128, 8, 2, 4], [142, -6, 5, 2.5], [-19, 65, 3, 1.5]];
const CITIES = [
  ["NYC", -74, 41], ["SFO", -122, 38], ["CHI", -88, 42], ["GRU", -46, -23], ["BOG", -74, 5], ["LHR", 0, 51], ["FRA", 9, 50],
  ["MAD", -4, 40], ["LOS", 3, 6], ["JNB", 28, -26], ["DXB", 55, 25], ["BOM", 73, 19], ["SIN", 104, 1], ["HKG", 114, 22],
  ["NRT", 140, 36], ["SYD", 151, -34], ["MOW", 37, 56], ["CAI", 31, 30], ["MEX", -99, 19], ["SEL", 127, 37],
];

const inPoly = (x, y, p) => {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const MY0 = 1, MH = rows - 3;
  const LAT0 = 80, LAT1 = -58;
  const toCell = (lon, lat) => [((lon + 180) / 360) * cols, MY0 + ((LAT0 - lat) / (LAT0 - LAT1)) * MH];
  const land = new Uint8Array(cols * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < cols; x++) {
    const lon = ((x + 0.5) / cols) * 360 - 180, lat = LAT0 - ((y + 0.5) / MH) * (LAT0 - LAT1);
    let on = LAND.some((p) => inPoly(lon, lat, p));
    if (!on) on = ISLANDS.some(([ix, iy, rx, ry]) => ((lon - ix) / rx) ** 2 + ((lat - iy) / ry) ** 2 < 1);
    land[x + y * cols] = on ? 1 : 0;
  }
  const r = rng(9);
  // a schedule of arcs between cities, each ping lands at the destination
  const EV = [];
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(r() * CITIES.length);
    let b = Math.floor(r() * CITIES.length);
    if (b === a) b = (b + 5) % CITIES.length;
    EV.push([i * 0.5, a, b, r() < 0.3 ? "8" : r() < 0.5 ? "7" : "5"]);
  }
  const LOOP = 20;
  return (t) => {
    g.clear();
    for (let y = 0; y < MH; y++) for (let x = 0; x < cols; x++) {
      if (!land[x + y * cols]) continue;
      const shade = fbm(x * 0.15, y * 0.25, 2, 3);
      g.set(x, MY0 + y, "•", shade > 0.52 ? "4" : "3");
    }
    const lt = t % LOOP;
    let hits = 0;
    for (const [ts, a, b, co] of EV) {
      for (const off of [0, LOOP]) {
        const ag = lt + off - ts;
        if (ag < 0 || ag > 3.2) continue;
        const [x0, y0] = toCell(CITIES[a][1], CITIES[a][2]);
        const [x1, y1] = toCell(CITIES[b][1], CITIES[b][2]);
        const d = Math.hypot(x1 - x0, (y1 - y0) * 2);
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - d * 0.18;
        const flight = 1.4;
        const p = clamp(ag / flight);
        // arc with a fading tail
        for (let k = 0; k <= 40; k++) {
          const u = (k / 40) * p;
          if (p - u > 0.45 && ag < flight) continue;
          const tail = ag >= flight ? clamp(1 - (ag - flight) / 0.8) : 1;
          if (tail <= 0) break;
          const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1;
          const by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1;
          if (k % 2 === 0) g.set(bx, by, "·", tail > 0.5 ? co : "1");
        }
        if (p < 1) {
          const u = p;
          const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1;
          const by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1;
          g.set(bx, by, "●", "9");
        } else {
          hits++;
          const rr = (ag - flight) * 3.2;
          if (rr < 5) for (let q = 0; q < 24; q++) {
            const an = (q / 24) * Math.PI * 2;
            g.set(Math.round(x1 + Math.cos(an) * rr * 2 - 0.5), Math.round(y1 + Math.sin(an) * rr - 0.5), rr < 2 ? "○" : "◦", rr < 2.5 ? co : "1");
          }
          g.set(x1, y1, "●", ag - flight < 1 ? "9" : co);
        }
      }
    }
    for (const [, lon, lat] of CITIES) {
      const [x, y] = toCell(lon, lat);
      if (g.get(x, y) !== "●") g.set(x, y, "▪", "a");
    }
    const total = 1204381 + Math.floor(t * 37);
    g.text(1, 0, "edge requests", "0");
    g.text(15, 0, "20 regions", "1");
    g.text(cols - 30, 0, "req/s", "1");
    g.text(cols - 24, 0, String(3400 + hits * 211).padStart(5), "5");
    g.text(cols - 17, 0, "total", "1");
    g.text(cols - 11, 0, total.toLocaleString("en-US"), "0");
    const ly = rows - 1;
    g.text(1, ly, "●", "5"); g.text(3, ly, "api", "1");
    g.text(9, ly, "●", "7"); g.text(11, ly, "assets", "1");
    g.text(20, ly, "●", "8"); g.text(22, ly, "sync", "1");
    g.text(cols - 26, ly, "p50 42 ms   p99 188 ms", "1");
    return g.frame();
  };
}
