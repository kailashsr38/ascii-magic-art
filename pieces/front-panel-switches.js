/* front-panel-switches: a minicomputer front panel where a program is toggled in word by word, deposited and run as a chasing light. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "front-panel-switches",
  name: "Front Panel Toggle Programming",
  category: "retro",
  note: "A minicomputer front panel where an operator flips the toggle switches to enter a short program word by word, deposits each one, then hits run and the data lights chase.",
  tags: ["retro", "minicomputer", "switches", "leds", "computer history", "hero"],
  cols: 100, rows: 26, fps: 24,
  palette: palette(["#ff4a3a", "#4a1410", "#ffb03a", "#4a3010", "#e6e0cc", "#8a8678", "#2a2c34", "#1c1e24", "#3a3c46", "#7a2a1a", "#7a5a1a", "#f4eee0", "#7ee787", "#16401c", "#121318", "#5a5c66"]),
};

const PROG = [0o012700, 0o000001, 0o006300, 0o010037, 0o177570, 0o000774];
const START = 0o1000;
const TOG = 0.13;

export default function create() {
  const W = meta.cols, H = meta.rows;
  const g = new Grid(W, H);
  // build the operator script: events [time, kind, value]
  const ev = [];
  let t = 0.5, sw = 0;
  const setSwitches = (v) => {
    for (let b = 15; b >= 0; b--) {
      const want = (v >> b) & 1;
      if (((sw >> b) & 1) !== want) { sw ^= 1 << b; ev.push([t, "sw", sw]); t += TOG; }
    }
    t += 0.25;
  };
  const press = (k) => { ev.push([t, "press", k]); t += 0.45; };
  setSwitches(START); press("LOAD ADR");
  for (const w of PROG) { setSwitches(w); press("DEP"); }
  setSwitches(START); press("LOAD ADR");
  press("RUN");
  const RUN_T = t, STOP_T = t + 5;
  t = STOP_T; press("STOP");
  setSwitches(0);
  const PERIOD = t + 0.8;
  const xBit = (b) => { const i = 15 - b; return 14 + i * 4 + (i >= 1 ? 2 : 0) + Math.floor(Math.max(0, i - 1) / 3) * 2; };
  return (tt) => {
    g.clear();
    const lt = tt % PERIOD;
    let swv = 0, addr = 0, data = 0, pressed = "", running = false, pressAge = 9;
    const mem = {};
    for (const [et, kind, v] of ev) {
      if (et > lt) break;
      if (kind === "sw") swv = v;
      else {
        pressed = v; pressAge = lt - et;
        if (v === "LOAD ADR") { addr = swv; data = mem[addr] || 0; }
        if (v === "DEP") { if (Object.keys(mem).length) addr = addr + 1; mem[addr] = swv; data = swv; }
        if (v === "RUN") running = true;
        if (v === "STOP") running = false;
      }
    }
    // the first deposit goes at the loaded address
    if (running && lt < STOP_T) {
      const k = Math.floor((lt - RUN_T) * 14);
      data = 1 << (k % 16);
      addr = START + 2 + (k % 4);
    } else if (lt >= STOP_T && pressed === "STOP") { data = 1 << (Math.floor((STOP_T - RUN_T) * 14) % 16); addr = START + 5; }
    // panel
    g.fill(0, 0, W, H, "█", "7");
    g.fill(1, 1, W - 2, H - 2, " ");
    g.box(1, 1, W - 2, H - 2, "heavy", "8");
    g.text(4, 1, " MINI-16  PROGRAMMER CONSOLE ", "b");
    // octal group colour bands behind the switches
    for (let b = 15; b >= 0; b--) {
      const grp = b === 15 ? 0 : Math.floor((14 - b) / 3) + 1;
      const band = grp % 2 ? "9" : "a";
      const x = xBit(b);
      for (let y = 13; y <= 17; y++) g.text(x - 1, y, "▒▒▒", band);
    }
    const leds = (y, label, v, on, off) => {
      g.text(4, y, label, "5");
      for (let b = 15; b >= 0; b--) g.set(xBit(b), y, "●", (v >> b) & 1 ? on : off);
    };
    leds(4, "ADDRESS", addr, "0", "1");
    leds(7, "DATA", data, "2", "3");
    for (let b = 15; b >= 0; b--) g.text(xBit(b) - (b > 9 ? 1 : 0), 9, String(b), "f");
    // status
    const STAT = [["RUN", running], ["HALT", !running], ["MEM", running || pressAge < 0.3], ["USER", false]];
    STAT.forEach(([n, on], i) => { g.set(90, 4 + i * 2, "●", on ? (n === "RUN" ? "c" : "0") : n === "RUN" ? "d" : "1"); g.text(92, 4 + i * 2, n, "5"); });
    g.text(4, 11, "octal  " + addr.toString(8).padStart(6, "0") + "  /  " + data.toString(8).padStart(6, "0"), "4");
    // toggle switches
    g.text(4, 15, "SWITCH", "5");
    g.text(4, 16, "REGISTER", "5");
    for (let b = 15; b >= 0; b--) {
      const up = (swv >> b) & 1;
      const x = xBit(b);
      g.set(x, 13, up ? "█" : " ", "b");
      g.set(x, 14, up ? "█" : " ", "b");
      g.set(x, 15, "■", "6");
      g.set(x, 16, up ? " " : "█", "b");
      g.set(x, 17, up ? " " : "█", "b");
    }
    // function switches
    const FN = ["LOAD ADR", "EXAM", "DEP", "CONT", "RUN", "STOP", "S INST"];
    let fx = 14;
    FN.forEach((n) => {
      const down = pressed === n && pressAge < 0.35;
      g.text(fx, 20, down ? "▄▄" : "██", down ? "2" : "b");
      g.text(fx, 21, down ? "██" : "▀▀", down ? "2" : "5");
      g.text(fx, 22, n, down ? "2" : "5");
      fx += n.length + 3;
    });
    g.text(84, 20, "POWER", "5");
    g.text(84, 21, "(●)", "c");
    return g.frame();
  };
}
