/* floppy-drive-read: a disk copy utility reading a floppy track by track, the head stepping across the spinning disk. */
import { Grid, palette, clamp, TAU } from "../lib/kit.js";

export const meta = {
  slug: "floppy-drive-read",
  name: "Floppy Disk Copier",
  category: "retro",
  note: "A disk copy utility reads a floppy track by track, the head stepping across the spinning disk while a sector map fills in and the drive light glows.",
  tags: ["retro", "floppy", "disk", "progress", "loader", "dashboard"],
  cols: 96, rows: 30, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd",
    "#1a1a1e", "#34343c", "#4a4a54", "#6a5a48", "#3a2c22", "#d8d0b8", "#c03030", "#ff4a3a", "#5a1a1a", "#2a50b0"]),
};

const TRACKS = 40, SECT = 9, TT = 0.42, PERIOD = TRACKS * TT + 4;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  // jacket placement
  const JX = 2, JY = 1, JW = 38, JH = 19;
  const CX = JX + JW / 2, CY = JY + JH / 2 - 0.5;
  const st = (lt) => {
    const tr = Math.floor(lt / TT);
    const f = (lt % TT) / TT;
    return [Math.min(tr, TRACKS), f];
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const [tr, f] = st(lt);
    const active = tr < TRACKS;
    const spin = t * 5.2;
    // ── the disk in its jacket ──
    for (let y = JY; y < JY + JH; y++) for (let x = JX; x < JX + JW; x++) {
      const dx = (x - CX + 0.5) / 2, dy = y - CY;
      const r = Math.hypot(dx, dy);
      let ch = "█", co = "c";
      if ((x + y * 2) % 7 === 0) ch = "▓";
      const win = Math.abs(dx) < 1.6 && dy > 3.2 && dy < 8.4; // head window
      const ring = r > 2.2 && r < 4.3;
      if (r < 2.2) { ch = " "; co = "b"; }
      else if (ring || win) {
        const a = Math.atan2(dy, dx) + spin;
        const sec = Math.floor(((a / TAU) % 1 + 1) % 1 * 18);
        ch = sec % 2 ? "█" : "▓"; co = sec % 2 ? "f" : "e";
        if (ring && r < 2.8) { ch = "█"; co = "e"; }
      }
      // index hole: a small round window, the disk hole passes under it once a turn
      if (Math.hypot(dx - 4.6, dy + 0.2) < 0.7) {
        const a = ((spin % TAU) + TAU) % TAU;
        ch = a < 0.35 ? " " : "█"; co = "f";
      }
      g.set(x, y, ch, co);
    }
    // label sticker and write protect notch
    g.fill(JX + 3, JY + 1, 16, 3, "█", "g");
    g.text(JX + 4, JY + 1, "▄▄▄▄▄ ▄▄▄ ▄", "k");
    g.text(JX + 4, JY + 2, "▀▀▀▀ ▀▀▀▀▀▀▀", "k");
    g.text(JX + 3, JY + 3, "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄", "h");
    g.fill(JX + JW - 1, JY + 3, 1, 2, " ");
    // head in the window, steps outward to inward with the track
    const hy = Math.round(CY + 8 - (tr / TRACKS) * 4.6);
    g.text(Math.round(CX) - 2, hy, "▐██▌", active ? "9" : "1");
    // ── the copy utility screen ──
    const SX = 42, SY = 0, SW = W - 42, SH = 21;
    g.box(SX, SY, SW, SH, "double", "3");
    g.text(SX + 2, SY, " DISKCOPY  A: → B: ", "9");
    // map: tracks across, sectors down
    const MX = SX + 6, MY = SY + 4;
    for (let k = 0; k < TRACKS; k += 10) g.text(MX + k, MY - 1, String(k).padEnd(2), "7");
    for (let s = 0; s < SECT; s++) {
      g.text(SX + 2, MY + s, String(s + 1), "7");
      for (let k = 0; k < TRACKS; k++) {
        let ch = "·", co = "7";
        const errCell = k === 17 && s === 4;
        if (k < tr) { ch = "W"; co = "2"; }
        else if (k === tr && active) {
          const rs = f * 2 * SECT;
          if (f < 0.5) { if (s < rs) { ch = "R"; co = "a"; } }
          else { ch = s < rs - SECT ? "W" : "R"; co = s < rs - SECT ? "2" : "a"; }
          if (errCell && f < 0.35 && s < rs) { ch = "?"; co = "5"; }
        }
        g.set(MX + k, MY + s, ch, co);
      }
    }
    g.set(MX + Math.min(tr, TRACKS - 1), MY + SECT, "▲", active ? "9" : "8");
    const done = Math.min(tr * SECT * 2 + (active ? Math.floor(f * SECT * 2) : 0), TRACKS * SECT * 2);
    const bytes = Math.floor(done / 2) * 512;
    const pct = done / (TRACKS * SECT * 2);
    g.text(SX + 2, MY + SECT + 2, "Track " + String(Math.min(tr, 39)).padStart(2, "0") + "  Side 0  Sector " + String(active ? Math.min(SECT, 1 + Math.floor(f * 2 * SECT) % SECT) : 9).padStart(2, "0"), "0");
    g.text(SX + 2, MY + SECT + 3, "Bytes " + String(bytes).padStart(6) + " / 184320", "1");
    const BW = SW - 12;
    const n = Math.round(pct * BW);
    g.text(SX + 2, MY + SECT + 5, "█".repeat(n) + "░".repeat(BW - n), n === BW ? "2" : "a");
    g.text(SX + SW - 8, MY + SECT + 5, String(Math.round(pct * 100)).padStart(3) + "%", "0");
    const msg = !active ? "Copy complete. Copy another (Y/N)?" : tr === 17 && f < 0.35 ? "CRC error, retrying sector 5..." : f < 0.5 ? "Reading..." : "Writing...";
    g.text(SX + 2, SY + 2, ("Track " + String(Math.min(tr, 39)).padStart(2, "0")).padEnd(10) + msg.padEnd(SW - 14).slice(0, SW - 14), msg.startsWith("CRC") ? "5" : !active ? "2" : "1");
    // ── the drive front panel ──
    const DY = 22;
    g.fill(0, DY, W, H - DY, "█", "b");
    g.box(0, DY, W, H - DY, "heavy", "c");
    g.fill(4, DY + 3, 60, 2, "█", "l");
    g.text(4, DY + 3, "▄".repeat(60), "c");
    g.text(4, DY + 4, "▀".repeat(60), "c");
    g.text(4, DY + 2, "DRIVE A", "1");
    g.text(30, DY + 3, "▀▀▀▀▀▀▀▀▀▀▀", "g");
    // latch lever turned down over the slot
    g.fill(66, DY + 2, 6, 4, "█", "c");
    g.text(67, DY + 3, "▐██▌", "7");
    g.text(67, DY + 4, "▐██▌", "7");
    const led = active && Math.floor(t * 30) % 7 !== 0;
    g.text(78, DY + 3, "▐█▌", led ? "i" : "j");
    g.text(78, DY + 5, "BUSY", "1");
    g.text(86, DY + 3, "40T", "1");
    g.text(86, DY + 4, "DS DD", "7");
    return g.frame();
  };
}
