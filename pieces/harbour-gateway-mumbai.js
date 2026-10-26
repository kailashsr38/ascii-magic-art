/* harbour-gateway-mumbai: the basalt triumphal arch on the waterfront at sunset, the grand hotel's red domes beside it and ferries in the harbour, hand-built.
 * Painted once: the sunset sky, the great arch with its four turrets and latticed windows, the hotel with
 * its red domes, the harbour wall and the water. Each frame bobs ferry launches on the water, wheels
 * pigeons over the plaza and walks people along the promenade. */
import { fbm, noise2, clamp, lerp } from "../lib/kit.js";
import { W, H, Canvas, hex, mix, birds, dome, arch, person, across, balance, fitPalette, paletteMeta, encoder, DOTS } from "../lib/scene.js";

const SKY = 1, HOTEL = 2, GATE = 3, SEA = 4, PLAZA = 5;
const GX = 60, SEAWALL = 80;

const base = new Canvas();
base.sky([[0, "#5a5a98"], [0.45, "#d088a0"], [0.8, "#f8a070"], [1, "#ffd090"]], SKY, 0, SEAWALL);
base.glow(30, 62, 6, 34, "#fff0c0", 0.6, SKY);
// the grand hotel on the right: long stone facade, arched windows, red domes
base.rect(108, 30, W, SEAWALL, (x, y) => mix(hex("#f0d8c0"), hex("#9a8078"), clamp((x - 108) / 100 * 0.6 + noise2(x / 3, y / 3, 3) * 0.06)), HOTEL);
for (let y = 36; y < SEAWALL - 4; y += 7) for (let x = 112; x < W - 2; x += 6) arch(base, x, y, 3, 5, "#5a4a52", HOTEL);
for (const [x, r] of [[150, 12], [118, 6], [182, 6]]) dome(base, x, 30, r, { c: "#e86a4a", shade: "#8a3a32", finial: "#f2c84a", onion: false, m: HOTEL });
// the gateway: yellow basalt arch, four corner turrets, a central dome hidden behind the parapet, jali windows
const g = (x, y) => mix(hex("#ffd8a0"), hex("#9a6a50"), clamp((x - (GX - 26)) / 52 * 0.9 + noise2(x / 2, y / 2, 5) * 0.08));
base.rect(GX - 26, 30, GX + 27, SEAWALL, g, GATE);
arch(base, GX - 10, 46, 20, 34, "#3a2a2e", GATE);
for (const dx of [-21, 14]) { arch(base, GX + dx, 50, 7, 14, "#4a3a3e", GATE); for (let y = 36; y < 44; y += 2) for (let x = GX + dx; x < GX + dx + 7; x += 2) base.put(x, y, "#6a4a42", GATE); }
for (const dx of [-26, 21]) { base.rect(GX + dx, 18, GX + dx + 6, 30, g, GATE); dome(base, GX + dx + 3, 18, 4, { c: "#ffd8a0", shade: "#9a6a50", finial: "#c8a060", m: GATE }); }
base.rect(GX - 20, 26, GX + 21, 30, (x) => mix(hex("#ffe4b8"), hex("#b88a68"), clamp((x - GX + 20) / 41)), GATE);
for (let x = GX - 20; x < GX + 21; x += 3) base.put(x, 25, "#e8b888", GATE);
// the plaza and the harbour wall, then the sea
base.rect(0, SEAWALL, W, 86, (x, y) => mix(hex("#d8c0b0"), hex("#9a8888"), (y - SEAWALL) / 6), PLAZA);
base.rect(0, 86, W, H, (x, y) => {
  const u = (y - 86) / (H - 86), path = Math.exp(-((x - 30) ** 2) / (30 + u * 600));
  return mix(mix(hex("#c8908c"), hex("#4a5070"), clamp(u * 1.2)), hex("#ffe0a8"), clamp(path * 0.7 + (Math.sin(y * 2 + Math.sin(x * 0.2) * 2) > 0.7 ? 0.1 : 0)));
}, SEA);

balance(base);
const PAL = fitPalette(base, { n: 50, extras: ["#ffffff", "#1e1820", "#e84a3a", "#2a5a9a", "#f2c84a", "#e8c8a8", "#9a9aa8"] });

export const meta = {
  slug: "harbour-gateway-mumbai",
  name: "Harbour Gateway Mumbai",
  category: "india",
  note: "The basalt triumphal arch stands on the waterfront at sunset beside the grand hotel's red domes as ferry launches bob in the harbour and pigeons wheel over the plaza.",
  tags: ["mumbai", "gateway", "harbour", "sunset", "landmark", "ferries", "india", "halftone"],
  cols: W, rows: H, fps: 15, cell: "square", look: "dots", dots: DOTS,
  palette: paletteMeta(PAL),
};

export default function create() {
  const f = new Canvas(), enc = encoder(PAL);
  return (t) => {
    f.copy(base);
    // ferry launches: white with a blue band, bobbing, one crossing
    for (const [x0, y, ph, moving] of [[20, 94, 0, false], [140, 98, 1.3, false], [0, 104, 2.2, true]]) {
      const x = moving ? across(t, 4, 0.3) : x0, bob = Math.round(Math.sin(t * 1.5 + ph));
      f.rect(x, y - 3 + bob, x + 20, y + bob, "#ffffff"); f.rect(x, y - 1 + bob, x + 20, y + bob, "#2a5a9a");
      f.rect(x + 3, y - 6 + bob, x + 15, y - 3 + bob, "#f4f0ec"); for (let k = 0; k < 5; k++) f.put(x + 4 + k * 2, y - 5 + bob, "#1e1820");
    }
    // pigeons wheeling over the plaza
    for (let i = 0; i < 8; i++) {
      const a = t * 0.8 + i * 0.8, x = GX + 30 + Math.cos(a) * 30, y = 66 + Math.sin(a) * 6, up = Math.sin(t * 9 + i) > 0;
      f.put(x, y, "#9a9aa8"); f.put(x - 1, y - (up ? 1 : 0), "#9a9aa8"); f.put(x + 1, y - (up ? 1 : 0), "#9a9aa8");
    }
    for (const [ph, c, dir] of [[0, "#e84a3a", 1], [0.35, "#f2c84a", -1], [0.7, "#ffffff", 1]]) {
      const u = across(t, 3, ph), x = dir > 0 ? u : W - u;
      person(f, x, 84, { body: c, head: "#8a5a3a", step: Math.floor(t * 4 + ph * 9) });
    }
    birds(f, t, { n: 4, y: 14, period: 15, c: "#1e1820", only: SKY });
    return enc(f);
  };
}
