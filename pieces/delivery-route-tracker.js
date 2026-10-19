/* delivery-route-tracker: a food delivery app with a courier moving along a street map route and an ETA counting down. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "delivery-route-tracker",
  name: "Delivery Route Tracker",
  category: "screens",
  note: "A delivery tracking screen where the route draws across a street grid, the courier moves along it and the order steps tick to delivered.",
  tags: ["delivery", "map", "tracking", "route", "app", "mobile"],
  cols: 90, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#21262d", "#2d4a2f"]),
};

// route waypoints on the map grid
const WP = [[6, 4], [6, 10], [20, 10], [20, 16], [38, 16], [38, 22], [52, 22]];
const PERIOD = 18, DRIVE0 = 2.5, DRIVE1 = 14.5;
const STAGES = ["Order placed", "Preparing", "Picked up", "On the way", "Delivered"];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  // path cells
  const path = [];
  for (let i = 0; i < WP.length - 1; i++) {
    const [x0, y0] = WP[i], [x1, y1] = WP[i + 1];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k < n; k++) path.push([x0 + Math.sign(x1 - x0) * k, y0 + Math.sign(y1 - y0) * k, x1 !== x0]);
  }
  path.push([...WP[WP.length - 1], true]);
  const MW = 60, MH = H - 2;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // map: blocks and streets
    for (let y = 1; y < MH; y++) for (let x = 1; x < MW; x++) {
      const sx = (x - 2) % 14 === 0 || x === 6 || x === 52, sy = (y - 4) % 6 === 0;
      if (sx && sy) g.set(x, y, "┼", "7");
      else if (sx) g.set(x, y, "│", "8");
      else if (sy) g.set(x, y, "─", "8");
      else {
        const park = x > 26 && x < 36 && y > 4 && y < 10;
        const water = x > 40 && y < 8 && x + y * 2 < 60;
        g.set(x, y, park ? "▒" : water ? "≈" : "·", park ? "b" : water ? "3" : "a");
      }
    }
    g.text(28, 6, "Elm Park", "2");
    g.text(16, 3, "Harbour St", "1"); g.text(22, 15, "Mill Rd", "1"); g.text(40, 21, "Quay Ln", "1");
    // route
    const p = Math.max(0, Math.min(1, (lt - DRIVE0) / (DRIVE1 - DRIVE0)));
    const pe = p * p * (3 - 2 * p);
    const at = Math.floor(pe * (path.length - 1));
    path.forEach(([x, y, hz], i) => g.set(x, y, i < at ? (hz ? "━" : "┃") : hz ? "╍" : "╏", i < at ? "8" : "3"));
    // origin and destination pins
    g.text(WP[0][0] - 1, WP[0][1] - 1, "▄█▄", "4"); g.text(WP[0][0] - 4, WP[0][1] - 2, "Noodle Bar", "4");
    const [dx, dy] = WP[WP.length - 1];
    g.text(dx - 1, dy - 1, "▄█▄", "2"); g.text(dx - 2, dy + 1, "Home", "2");
    const [cx, cy] = path[at];
    const pulse = Math.floor(lt * 3) % 2;
    g.set(cx, cy, "●", "0");
    if (pulse) { g.set(cx - 1, cy, "(", "3"); g.set(cx + 1, cy, ")", "3"); }
    // side panel
    const px = MW + 1;
    g.box(0, 0, W, H, "round", "7");
    g.vline(MW, 1, H - 2, "│", "7");
    g.text(2, 0, " Track order ", "0");
    const delivered = lt >= DRIVE1 + 0.3;
    const eta = Math.max(0, Math.ceil(14 * (1 - pe)));
    g.text(px + 2, 2, delivered ? "Delivered" : "Arriving in", "1");
    g.text(px + 2, 3, delivered ? "Enjoy your meal" : `${eta} min`, delivered ? "2" : "0");
    if (!delivered) g.text(px + 12, 3, "· 19:" + String(42 - eta).padStart(2, "0"), "1");
    const stage = lt < 0.8 ? 0 : lt < DRIVE0 - 0.5 ? 1 : lt < DRIVE0 + 0.8 ? 2 : delivered ? 4 : 3;
    STAGES.forEach((s, i) => {
      const y = 6 + i * 2, done = i < stage, curS = i === stage;
      g.text(px + 2, y, done ? "✓" : curS ? "●" : "○", done ? "2" : curS ? "3" : "7");
      g.text(px + 4, y, s, curS ? "0" : done ? "1" : "7");
      if (i < 4) g.set(px + 2, y + 1, "│", done ? "2" : "8");
    });
    g.hline(MW + 1, W - 2, 16, "─", "8");
    g.text(px + 2, 17, "Courier", "1");
    g.text(px + 2, 18, "Samir · e-bike", "0");
    g.text(px + 2, 19, "4.9 rating", "9");
    g.text(px + 2, 21, "Order #4471", "1");
    g.text(px + 2, 22, "2x Dan dan noodles", "0");
    g.text(px + 2, 23, "1x Cucumber salad", "0");
    g.text(px + 2, 25, "[ Call ]  [ Message ]", "3");
    return g.frame();
  };
}
