/* kolkata-tram-morning: an old two-car tram rattling down a street of weathered colonial buildings at morning, yellow taxis and a hand-pulled rickshaw alongside, hand-built.
 * Painted once: the hazy morning sky, the row of tall old buildings in faded pastels with green shutters,
 * iron balconies and shop awnings, the tram wires strung across on their poles, the street with its
 * rails, and a tea stall on the corner. Each frame runs the tram along the rails with its trolley pole
 * on the wire, passes taxis both ways, pulls a rickshaw by, steams the tea stall's kettle and flies crows. */
import { fbm, noise2, clamp, lerp, rng } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, smoke, person, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, FACADE = 2, WIRE = 3, STREET = 4, STALL = 5;
const KERB = 74, RAIL = 92, WIREY = 30;

const base = new Canvas();
base.sky([[0, "#a8bcd0"], [1, "#ece4d4"]], SKY, 0, 40);
// the buildings: tall, faded pastel, weathered, green shutters, iron balconies, awnings over the shops
const R = rng(17), TINTS = ["#f0dcb4", "#ecc4a8", "#d0dcc0", "#dccce0", "#f0e0c8", "#e0c8b0"];
for (let x = 0; x < W; ) {
  const w = 26 + Math.floor(R() * 18), top = 10 + Math.floor(R() * 18), c = hex(TINTS[Math.floor(R() * TINTS.length)]);
  base.rect(x, top, x + w, KERB, (xx, yy) => mix(c, hex("#8a7a6a"), clamp(noise2(xx / 3, yy / 7, x) * 0.35 + (Math.sin(xx * 2.1) > 0.9 ? 0.15 : 0))), FACADE);
  base.rect(x, top, x + w, top + 2, mix(c, hex("#ffffff"), 0.3), FACADE);
  for (let y = top + 5; y < KERB - 16; y += 11) {
    for (let wx = x + 3; wx + 4 < x + w - 1; wx += 7) { base.rect(wx, y, wx + 4, y + 7, "#3a3430", FACADE); base.rect(wx - 1, y, wx, y + 7, "#6a9a72", FACADE); base.rect(wx + 4, y, wx + 5, y + 7, "#6a9a72", FACADE); }
    base.rect(x + 1, y + 7, x + w - 1, y + 8, "#4a4440", FACADE);
    for (let bx = x + 1; bx < x + w - 1; bx += 2) base.put(bx, y + 6, "#4a4440", FACADE);
  }
  base.rect(x + 1, KERB - 14, x + w - 1, KERB - 12, R() < 0.5 ? "#e88a6a" : "#5a9ac8", FACADE);
  base.rect(x + 2, KERB - 12, x + w - 2, KERB, "#4a3a30", FACADE);
  x += w + 1;
}
// the pavement and the street with its rails
base.rect(0, KERB, W, KERB + 4, "#c8bcac", STREET);
base.rect(0, KERB + 4, W, H, (x, y) => mix(hex("#a8a094"), hex("#8a8278"), clamp((y - KERB) / 40 + fbm(x / 8, y / 3, 2, 3) * 0.2)), STREET);
for (const y of [RAIL, RAIL + 6]) base.rect(0, y, W, y + 1, "#d8d0c4", STREET);
// tram wires on their poles
for (const px of [20, 120]) base.rect(px, WIREY - 2, px + 1, KERB + 2, "#3a3430", WIRE);
base.rect(0, WIREY, W, WIREY + 1, "#3a3430", WIRE);
// the tea stall on the corner: a little cart under an awning, kettle on the stove
base.rect(4, 62, 24, 74, "#a8805a", STALL); base.rect(2, 58, 26, 61, "#e8c86a", STALL); base.rect(10, 59, 16, 62, "#3a3430", STALL);

balance(base, 0.4);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#f2c84a", "#2a2420", "#5a8ad0", "#f4ecd8", "#e86a4a", "#e8c8a0", "#d8d0c8"] });

export const meta = {
  slug: "kolkata-tram-morning",
  name: "Kolkata Tram Morning",
  category: "india",
  note: "An old two-car tram rattles down a street of weathered colonial buildings at morning, its pole on the wire, as yellow taxis pass, a rickshaw puller runs by and the tea stall's kettle steams.",
  tags: ["kolkata", "tram", "yellow-taxi", "rickshaw", "street", "colonial", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    smoke(f, t, 14, 57, { c: "#d8d0c8", n: 6, rise: 6, drift: 2, size: 2, a: 0.5, seed: 3 });
    // the tram: two cream cars with a blue band, windows full of passengers, the trolley pole up to the wire (40 s)
    const tx = ((t * 6 + 60) % (W + 110)) - 100;
    for (const [cx, len] of [[tx, 40], [tx + 42, 40]]) {
      f.rect(cx, RAIL - 22, cx + len, RAIL + 1, "#f4ecd8"); f.rect(cx, RAIL - 6, cx + len, RAIL - 2, "#5a8ad0"); f.rect(cx, RAIL - 23, cx + len, RAIL - 22, "#5a8ad0");
      for (let wx = cx + 3; wx + 5 < cx + len; wx += 7) { f.rect(wx, RAIL - 19, wx + 5, RAIL - 11, "#3a3430"); f.put(wx + 2, RAIL - 15, "#e8c8a0"); f.put(wx + 2, RAIL - 14, ["#e86a4a", "#ffffff", "#f2c84a"][(((wx >> 3) % 3) + 3) % 3]); }
      for (const wx of [cx + 6, cx + len - 8]) { f.rect(wx, RAIL + 1, wx + 3, RAIL + 3, "#2a2420"); }
    }
    f.line(tx + 30, RAIL - 23, tx + 46, WIREY + 1, "#2a2420", 1);
    // taxis both ways, rounded yellow cars
    for (let i = 0; i < 3; i++) {
      const dir = i % 2 ? -1 : 1, y = dir > 0 ? 107 : 102, x = dir > 0 ? ((t * (14 + i * 4) + i * 90) % (W + 30)) - 15 : W + 15 - ((t * 16 + i * 90) % (W + 30));
      f.rect(x - 8, y - 4, x + 8, y, "#f2c84a"); f.rect(x - 4, y - 7, x + 4, y - 4, "#f2c84a"); f.rect(x - 3, y - 6, x + 3, y - 4, "#3a3430");
      for (const wx of [-5, 5]) f.rect(x + wx - 1, y, x + wx + 2, y + 2, "#2a2420");
    }
    // a hand-pulled rickshaw: the puller running between the shafts, big wheel, a passenger under the hood
    const rx = W + 20 - ((t * 5 + 40) % (W + 40)), ry = 100, st = Math.floor(t * 5) % 2;
    for (let a = 0; a < 14; a++) f.put(rx + 4 + Math.cos(a / 14 * Math.PI * 2) * 3.5, ry - 3 + Math.sin(a / 14 * Math.PI * 2) * 3.5, "#2a2420");
    f.rect(rx + 1, ry - 10, rx + 8, ry - 5, "#2a2420"); f.put(rx + 4, ry - 7, "#e8c8a0"); f.put(rx + 4, ry - 6, "#ffffff");
    f.line(rx + 1, ry - 5, rx - 8, ry - 4, "#6a4a30", 1);
    person(f, rx - 9, ry, { body: "#ffffff", head: "#6a4a30", legs: "#6a4a30", step: st });
    // people on the pavement and crows over the wires
    for (let i = 0; i < 4; i++) { const x = ((t * 2.5 + i * 47) % (W + 10)) - 5; person(f, i % 2 ? x : W - x, KERB + 3, { body: ["#e86a4a", "#ffffff", "#5a8ad0", "#f2c84a"][i], head: "#6a4a30", step: Math.floor(t * 3 + i) }); }
    birds(f, t, { n: 4, y: 20, period: 15, c: "#2a2420", only: SKY });
    return enc(f);
  };
}
