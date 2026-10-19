/* core-memory-plane: a magnetic core memory plane where select wires pulse and ferrite cores flip one by one to store a picture. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "core-memory-plane",
  name: "Magnetic Core Plane",
  category: "retro",
  note: "A magnetic core memory plane where an X and a Y select wire light up together and the ferrite core where they cross flips, bit by bit storing a heart and a smile before the rows are cleared.",
  tags: ["retro", "memory", "computer history", "electronics", "bits", "hero"],
  cols: 110, rows: 30, fps: 24,
  palette: palette(["#ff9a3a", "#ffd08a", "#5a3416", "#3a220e", "#8a7a5a", "#5a4e3a", "#56d4dd", "#e6ffff", "#f2cc60", "#7ee787", "#1d4a2a", "#e6edf3", "#8b949e", "#484f58", "#1a1a1e", "#2a2420", "#ff7b72"]),
};

const PIC = [
  ".11..11...1111..", "11111111.1....1.", "111111111.1..1.1", "111111111......1",
  ".111111.1.1..1.1", "..1111..1..11..1", "...11....1....1.", ".........11111..",
];
const NX = 16, NY = 8, STEP = 0.14;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const writes = [];
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) if (PIC[y][x] === "1") writes.push([x, y]);
  const WEND = 0.6 + writes.length * STEP, HOLD = WEND + 2.2, CLR = 0.32, PERIOD = HOLD + NY * CLR + 0.8;
  const GX = 6, GY = 3, SX = 5, SY = 3;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // state of each core
    const bits = PIC.map(() => new Array(NX).fill(0));
    let sel = null, mode = "idle", flipAge = 9;
    const nW = Math.min(writes.length, Math.max(0, Math.floor((lt - 0.6) / STEP) + 1));
    for (let i = 0; i < nW; i++) bits[writes[i][1]][writes[i][0]] = 1;
    if (lt >= 0.6 && lt < WEND) { sel = writes[nW - 1]; mode = "write"; flipAge = (lt - 0.6) % STEP; }
    let clrRow = -1;
    if (lt >= HOLD) {
      const r = Math.floor((lt - HOLD) / CLR);
      for (let y = 0; y < Math.min(NY, r); y++) bits[y].fill(0);
      if (r < NY) { clrRow = r; mode = "clear"; flipAge = (lt - HOLD) % CLR; if (flipAge > CLR * 0.5) bits[r].fill(0); }
    }
    // frame
    g.fill(0, 0, 92, H, "█", "e");
    g.fill(2, 1, 88, H - 2, " ");
    g.box(2, 1, 88, H - 2, "double", "4");
    g.text(5, 1, " CORE PLANE 16 x 8 ", "1");
    // sense wire: a diagonal threading every core
    for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
      const cx = GX + x * SX, cy = GY + y * SY;
      g.set(cx + 2, cy + 1, (x + y) % 2 ? "╲" : "╱", mode !== "idle" && flipAge < 0.08 ? "9" : "a");
    }
    // select wires
    for (let y = 0; y < NY; y++) {
      const hot = (sel && sel[1] === y) || clrRow === y;
      g.hline(GX - 3, GX + (NX - 1) * SX + 3, GY + y * SY, "─", hot ? (mode === "clear" ? "8" : "6") : "5");
      g.text(GX - 5 < 3 ? 3 : GX - 5, GY + y * SY, "X" + y, hot ? "7" : "c");
    }
    for (let x = 0; x < NX; x++) {
      const hot = (sel && sel[0] === x) || clrRow >= 0;
      g.vline(GX + x * SX, GY - 1, GY + (NY - 1) * SY + 1, "│", hot ? (mode === "clear" ? "8" : "6") : "5");
    }
    // cores
    for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
      const cx = GX + x * SX, cy = GY + y * SY;
      const on = bits[y][x];
      const flashing = (sel && sel[0] === x && sel[1] === y && flipAge < 0.07) || (clrRow === y && flipAge < 0.06);
      g.text(cx - 1, cy, on ? "▐█▌" : "▐░▌", flashing ? "7" : on ? "0" : "2");
    }
    for (let x = 0; x < NX; x += 3) g.text(GX + x * SX - 1, H - 3, "Y" + x, sel && sel[0] === x ? "7" : "c");
    // side panel
    const PX = 93;
    g.box(PX, 1, 16, 12, "light", "d");
    g.text(PX + 2, 1, " DRIVER ", "c");
    const a = sel ? sel[1] * NX + sel[0] : clrRow >= 0 ? clrRow * NX : 0;
    g.text(PX + 2, 3, "ADDR  " + a.toString(8).padStart(3, "0"), "b");
    g.text(PX + 2, 4, "X SEL " + (sel ? String(sel[1]).padStart(2) : clrRow >= 0 ? String(clrRow).padStart(2) : " -"), "6");
    g.text(PX + 2, 5, "Y SEL " + (sel ? String(sel[0]).padStart(2) : clrRow >= 0 ? "ALL" : " -"), "6");
    g.text(PX + 2, 7, "MODE", "c");
    g.text(PX + 2, 8, mode === "write" ? "WRITE 1" : mode === "clear" ? "READ+CLR" : "HOLD", mode === "write" ? "9" : mode === "clear" ? "8" : "c");
    g.text(PX + 2, 10, "ONES " + String(bits.flat().reduce((s, v) => s + v, 0)).padStart(3), "0");
    // sense amp trace
    g.box(PX, 14, 16, 8, "light", "d");
    g.text(PX + 2, 14, " SENSE ", "c");
    for (let x = 0; x < 14; x++) {
      const tt = lt - (13 - x) * 0.04;
      const pulse = mode !== "idle" && ((tt - 0.6) % STEP + STEP) % STEP < 0.05 && tt > 0.6 && tt < WEND;
      const pulse2 = tt >= HOLD && ((tt - HOLD) % CLR) < 0.06 && tt < HOLD + NY * CLR;
      const yy = pulse || pulse2 ? 16 : 19;
      g.set(PX + 1 + x, yy, pulse || pulse2 ? "█" : "─", pulse2 ? "8" : "9");
      if (yy === 16) { g.set(PX + 1 + x, 17, "█", pulse2 ? "8" : "9"); g.set(PX + 1 + x, 18, "█", pulse2 ? "8" : "9"); }
    }
    g.text(PX + 1, 23, "WORD VIEW", "c");
    for (let y = 0; y < NY; y += 2) for (let x = 0; x < NX; x++) {
      const a = bits[y][x], b = bits[y + 1][x];
      g.set(PX + x, 24 + y / 2, a && b ? "█" : a ? "▀" : b ? "▄" : "·", a || b ? "0" : "d");
    }
    return g.frame();
  };
}
