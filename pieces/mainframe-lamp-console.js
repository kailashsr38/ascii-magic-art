/* mainframe-lamp-console: a mainframe operator console with register lamps flickering as a batch job runs and the console log prints. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "mainframe-lamp-console",
  name: "Mainframe Lamp Console",
  category: "retro",
  note: "A mainframe operator console whose rows of register lamps flicker with the running program, status lights change and the console log prints a nightly batch.",
  tags: ["retro", "mainframe", "lights", "computer", "dashboard", "terminal"],
  cols: 100, rows: 32, fps: 20,
  palette: palette(["#ffb347", "#5a3a12", "#ffe2a8", "#c8c2b0", "#8a8678", "#4a4a52", "#2c2e36", "#1c1d22", "#ff5a4a", "#5a1a16", "#7ee787", "#16401c",
    "#f2cc60", "#4a3c10", "#79c0ff", "#18304a", "#e6edf3", "#8b949e", "#a8dcff"]),
};

const LOG = [
  ["09:41:02 JOB 0412 NIGHTLY  STARTED", "g"],
  ["09:41:02 STEP SORTIN   READ  48,210 RECS", "h"],
  ["09:41:05 STEP SORTIN   ENDED  RC=0000", "a"],
  ["09:41:05 MOUNT TAPE 004417 ON UNIT 182", "c"],
  ["09:41:09 TAPE 004417 MOUNTED  READY", "h"],
  ["09:41:09 STEP LEDGER   POST  12,904 ITEMS", "h"],
  ["09:41:14 STEP LEDGER   ENDED  RC=0000", "a"],
  ["09:41:14 STEP REPORT   PRINT 318 PAGES", "h"],
  ["09:41:18 STEP REPORT   ENDED  RC=0004", "c"],
  ["09:41:18 JOB 0412 NIGHTLY  ENDED  CPU 00:00:16", "g"],
  ["09:41:19 JOB 0413 BACKUP   STARTED", "g"],
];
const PERIOD = 22;
const hash = (n) => { let h = Math.imul(n ^ 0x27d4eb2d, 0x85ebca6b); h ^= h >>> 15; h = Math.imul(h, 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  const lamps = (x, y, bits, val, on = "0", off = "1") => {
    for (let i = 0; i < bits; i++) {
      const b = (val >>> (bits - 1 - i)) & 1;
      g.set(x + i + Math.floor(i / 4), y, "●", b ? on : off);
    }
  };
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // cabinet
    g.fill(0, 0, W, H, "█", "7");
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x * 3 + y * 5) % 13 === 0) g.set(x, y, "▓", "6");
    // lamp panel
    g.fill(2, 1, 74, 15, " ");
    g.box(2, 1, 74, 15, "heavy", "4");
    g.text(5, 1, " SYSTEM CONTROL PANEL ", "2");
    const tick = Math.floor(t * 18);
    const running = lt < 19.5;
    const wait = !running || (tick % 23 < 3);
    // instruction address walks a loop with occasional branches
    const loopPos = tick % 37;
    const base = 0x01a40 + (Math.floor(tick / 37) % 5) * 0x200;
    const addr = running ? base + loopPos * 4 : 0x01a40;
    const instr = running ? Math.floor(hash(loopPos + 7) * 0xffff) : 0;
    const ra = running ? (Math.floor(hash(Math.floor(tick / 2)) * 0xffffffff) >>> 0) : 0;
    const rb = running ? ((0x0000ff00 << (tick % 16)) | (tick & 0xff)) >>> 0 : 0;
    const sd = running ? (Math.floor(hash(tick * 3 + 1) * 0xffffffff) >>> 0) : 0;
    const rows = [["INSTR ADDR", 24, addr], ["INSTRUCTION", 16, instr], ["REGISTER A", 32, ra], ["REGISTER B", 32, rb], ["STORAGE DATA", 32, sd]];
    rows.forEach(([n, bits, v], i) => {
      const y = 3 + i * 2;
      g.text(4, y, n.padEnd(13), "3");
      lamps(18, y, bits, v);
      g.text(62, y, (v >>> 0).toString(16).toUpperCase().padStart(bits / 4, "0").padStart(8), "c");
    });
    // bit position legend
    g.text(18, 13, "0    4    8    12   16   20   24   28", "4");
    g.text(62, 13, "     HEX", "4");
    // status lamps
    const ST = [["SYSTEM", true, "a", "b"], ["MANUAL", !running, "c", "d"], ["WAIT", wait, "c", "d"], ["STOP", !running && lt > 20.2, "8", "9"], ["LOAD", lt > 21.2, "e", "f"], ["TEST", false, "8", "9"]];
    g.fill(78, 1, 20, 15, " ");
    g.box(78, 1, 20, 15, "heavy", "4");
    g.text(81, 1, " STATUS ", "2");
    ST.forEach(([n, on, a, b], i) => {
      const y = 3 + i * 2;
      g.text(81, y, "▐██▌", on ? a : b);
      g.text(86, y, n, on ? "2" : "4");
    });
    // rotary dials and push buttons
    const DY = 17;
    g.fill(2, DY, 96, 4, " ");
    g.box(2, DY, 96, 4, "light", "5");
    const dial = (x, label, pos) => {
      g.text(x, DY + 1, "(" + "/-\\|"[pos % 4] + ")", "3");
      g.text(x + 4, DY + 1, label, "4");
    };
    dial(4, "ADDR CMP", 1); dial(18, "RATE", running ? 0 : 3); dial(28, "CHECK", 2);
    const BTN = [["START", "a"], ["STOP", "8"], ["RESET", "c"], ["LOAD", "e"], ["INTR", "3"]];
    BTN.forEach(([n, c], i) => {
      const x = 42 + i * 11;
      const pressed = (n === "STOP" && lt > 19.5 && lt < 20.1) || (n === "LOAD" && lt > 21.1);
      g.text(x, DY + 1, pressed ? "▐" + "▓".repeat(n.length) + "▌" : "▐" + "█".repeat(n.length) + "▌", c);
      g.text(x + 1, DY + 2, n, "3");
    });
    // console log
    const LY = 22, LH = H - LY - 1;
    g.fill(2, LY, 96, LH, " ");
    g.box(2, LY, 96, LH, "double", "5");
    g.text(5, LY, " CONSOLE ", "2");
    const shown = Math.min(LOG.length, Math.floor(lt / 1.6) + 1);
    const vis = LH - 2;
    const s0 = Math.max(0, shown - vis);
    for (let i = s0; i < shown; i++) {
      const [s, c] = LOG[i];
      const n = i === shown - 1 ? Math.min(s.length, Math.floor((lt - i * 1.6) * 40)) : s.length;
      g.text(4, LY + 1 + i - s0, s.slice(0, n), c);
    }
    const clock = 9 * 3600 + 41 * 60 + 2 + Math.floor(lt);
    g.text(80, LY + 1, String(Math.floor(clock / 3600)).padStart(2, "0") + ":" + String(Math.floor(clock / 60) % 60).padStart(2, "0") + ":" + String(clock % 60).padStart(2, "0"), "0");
    g.text(80, LY + 2, running ? "CPU BUSY" : "CPU IDLE", running ? "a" : "c");
    return g.frame();
  };
}
