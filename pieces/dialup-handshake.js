/* dialup-handshake: a terminal program dialing a modem, the handshake noise, status lights and a bulletin board welcome. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "dialup-handshake",
  name: "Dial-Up Handshake",
  category: "screens",
  note: "A retro terminal program that dials out, shows the modem handshake as a noisy signal with front panel lights, connects and lands on a bulletin board.",
  tags: ["retro", "modem", "terminal", "bbs", "nostalgia", "network"],
  cols: 84, rows: 28, fps: 24,
  palette: palette(["#c9d1d9", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd", "#3fb950"]),
};

const PERIOD = 18;
const LIGHTS = ["HS", "AA", "CD", "OH", "RD", "SD", "TR", "MR"];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const type = (s, t0, lt, rate = 0.07) => s.slice(0, Math.max(0, Math.floor((lt - t0) / rate)));
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // phases
    const DIAL = 2.6, HAND = 4.4, CONN = 9.6, BBS = 10.6;
    g.box(0, 0, W, H - 4, "double", "3");
    g.text(2, 0, " TERM.EXE  COM2  57600 8-N-1 ", "a");
    const out = [];
    out.push([type("ATZ", 0.2, lt), "9"]);
    if (lt > 0.8) out.push(["OK", "2"]);
    if (lt > 1.1) out.push([type("AT&F1 E1 V1 M1 L2", 1.1, lt, 0.05), "9"]);
    if (lt > 2.1) out.push(["OK", "2"]);
    if (lt > DIAL - 0.2) out.push([type("ATDT 555-0142", DIAL - 0.2, lt, 0.06), "9"]);
    if (lt > DIAL + 1.0) out.push(["DIALING 555-0142 ...", "1"]);
    if (lt > CONN) out.push(["CONNECT 56000/ARQ/V90/LAPM/V42BIS", "2"]);
    out.forEach(([s, c], i) => g.text(2, 1 + i, s, c));
    let y = 1 + out.length;
    // handshake visual
    if (lt > HAND && lt < CONN) {
      const k = lt - HAND;
      y++;
      g.text(2, y, k < 1.2 ? "ringing..." : k < 2.4 ? "answer tone 2100 Hz" : k < 3.8 ? "probing line, training equalizer" : "negotiating error correction", "4");
      y++;
      const BW = W - 6, BH = 7, Y0 = y + 1;
      g.box(2, Y0 - 1, BW + 2, BH + 2, "light", "8");
      for (let x = 0; x < BW; x++) {
        const ph = x * 0.4 + lt * 24;
        let v;
        if (k < 1.2) v = Math.floor(k * 2.5) % 2 === 0 ? Math.sin(ph * 0.5) * 0.7 : 0; // ring bursts
        else if (k < 2.4) v = Math.sin(ph * 0.9) * 0.85; // clean tone
        else {
          const n = Math.sin(ph * 1.7 + Math.sin(x * 0.73 + lt * 31) * 3) * Math.sin(x * 0.21 + lt * 7);
          v = n * (0.6 + 0.4 * Math.sin(lt * 3 + x * 0.05));
        }
        const yy = Math.round(Y0 + (BH - 1) / 2 - v * (BH - 1) / 2);
        g.set(3 + x, yy, "█", k < 2.4 ? "a" : "6");
        const mid = Y0 + (BH - 1) / 2;
        for (let q = Math.min(yy, mid) + 1; q < Math.max(yy, mid); q++) g.set(3 + x, q, "│", k < 2.4 ? "3" : "6");
      }
      y = Y0 + BH + 1;
      const kb = ["2400", "9600", "14400", "28800", "33600", "48000", "56000"];
      if (k > 2.4) g.text(4, y, "rate probe: " + kb.slice(0, 1 + Math.floor((k - 2.4) * 2.2)).join(" → "), "9");
    }
    // BBS welcome
    if (lt > BBS) {
      const k = lt - BBS;
      const ART2 = [
        "  ┌──────────────────────────────────────────┐",
        "  │  ░▒▓ THE LAMPLIGHT BULLETIN BOARD ▓▒░    │",
        "  │      node 2 of 4 · sysop: moth           │",
        "  │      est. 1994 · 3 lines · 2 GB files    │",
        "  └──────────────────────────────────────────┘",
      ];
      const n = Math.min(ART2.length, Math.floor(k / 0.15));
      ART2.slice(0, n).forEach((l, i) => g.text(2, y + 1 + i, l, i === 1 ? "9" : "3"));
      const yy = y + 1 + ART2.length + 1;
      if (k > 1.2) { g.text(4, yy, "Enter your handle: ", "0"); g.text(23, yy, type("NIGHTCRAWLER", BBS + 1.6, lt, 0.09), "2"); }
      if (k > 3.2) { g.text(4, yy + 1, "Password: ", "0"); g.text(14, yy + 1, "*".repeat(Math.min(8, Math.floor((k - 3.4) / 0.1))), "1"); }
      if (k > 4.6) g.text(4, yy + 2, "Welcome back! You have 3 new messages.", "2");
      if (k > 5.4) g.text(4, yy + 3, "[M]essages  [F]iles  [D]oors  [C]hat  [G]oodbye", "a");
    }
    // cursor
    if (Math.floor(lt * 3) % 2 === 0 && lt < HAND) g.set(2 + (out[out.length - 1] ? out[out.length - 1][0].length : 0), out.length, "█", "0");
    // modem front panel
    const PY = H - 3;
    g.box(0, PY - 1, W, 4, "round", "7");
    g.text(2, PY, "MODEM 56K", "1");
    LIGHTS.forEach((n, i) => {
      const x = 16 + i * 8;
      let on = false;
      if (n === "MR" || n === "TR") on = true;
      if (n === "HS") on = lt > CONN;
      if (n === "AA") on = true;
      if (n === "OH") on = lt > DIAL + 0.5;
      if (n === "CD") on = lt > CONN;
      if (n === "SD") on = (lt < 2.6 && Math.floor(lt * 9) % 2 === 0) || (lt > BBS && Math.floor(lt * 13 + 1) % 3 === 0);
      if (n === "RD") on = (lt > HAND && Math.floor(lt * 11) % 2 === 0) || (lt > BBS && Math.floor(lt * 17) % 3 !== 0);
      g.set(x, PY, on ? "●" : "○", on ? (n === "CD" || n === "HS" ? "2" : n === "OH" ? "5" : "b") : "8");
      g.text(x + 2, PY, n, "1");
    });
    g.text(2, PY + 1, lt > CONN ? `online 00:${String(Math.floor(lt - CONN)).padStart(2, "0")}  ·  56000 bps  ·  V.42bis` : "offline", lt > CONN ? "2" : "7");
    return g.frame();
  };
}
