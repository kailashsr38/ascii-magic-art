/* form-validation-errors: a sign up form submitted too early, errors appearing under fields, then fixed one by one. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "form-validation-errors",
  name: "Form Validation Errors",
  category: "screens",
  note: "A form is submitted half filled, red errors drop in under each bad field, then each one is corrected until it submits clean.",
  tags: ["form", "validation", "errors", "signup", "app", "input"],
  cols: 70, rows: 27, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

// label, first value, error, fixed value
const F = [
  ["Full name", "Jonas Weber", null, null],
  ["Work email", "jonas@weber", "Enter a valid email address", "jonas@weber-design.de"],
  ["Company size", "", "Choose a company size", "11 to 50"],
  ["Phone", "+49 30 12", "Phone number looks too short", "+49 30 1234 5678"],
];
const SUBMIT1 = 1.2, FIX0 = 3.2, FIXD = 1.9, PERIOD = 14.5;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const shake = lt >= SUBMIT1 && lt < SUBMIT1 + 0.4 ? Math.round(Math.sin(lt * 50) * 1.5) : 0;
    let fixI = 0;
    g.box(0, 0, W, H, "round", "7");
    g.text(2, 0, " Request a demo ", "0");
    let errors = 0;
    const submit2 = FIX0 + 3 * FIXD + 0.4;
    F.forEach(([label, v1, err, v2], i) => {
      const y = 2 + i * 5;
      let val = v1, state = "idle", focus = false;
      if (err) {
        const fi = fixI++;
        const a = FIX0 + fi * FIXD;
        if (lt >= SUBMIT1) state = "err";
        if (lt >= a) {
          focus = lt < a + FIXD - 0.2;
          const target = v2;
          // erase back to common prefix then type
          let pre = 0; while (pre < v1.length && v1[pre] === target[pre]) pre++;
          const er = v1.length - pre, steps = Math.floor((lt - a) / 0.06);
          if (steps < er) val = v1.slice(0, v1.length - steps);
          else val = target.slice(0, Math.min(target.length, pre + steps - er));
          if (val === target) state = "ok";
        }
      } else if (lt >= SUBMIT1) state = "ok";
      if (state === "err") errors++;
      const bc = state === "err" ? "5" : focus ? "3" : state === "ok" ? "2" : "8";
      const x = 3 + (state === "err" ? shake : 0);
      g.text(x, y, label, state === "err" ? "5" : "1");
      if (i === 0 || i === 1) g.text(x + label.length + 1, y, "*", "5");
      g.box(x, y + 1, 52, 3, focus ? "heavy" : "round", bc);
      if (i === 2) {
        g.text(x + 2, y + 2, val || "Select...", val ? "0" : "7");
        g.text(x + 48, y + 2, "▼", "1");
      } else g.text(x + 2, y + 2, val, "0");
      if (focus && Math.floor(lt * 4) % 2 === 0 && i !== 2) g.set(x + 2 + val.length, y + 2, "▏", "3");
      if (state === "ok") g.text(x + 49, y + 2, "✓", "2");
      if (state === "err") { g.text(x + 49, y + 2, "!", "5"); g.text(x + 2, y + 4, "✗ " + err, "5"); }
    });
    // inline error list on right shown as compact
    const done = lt >= submit2;
    g.box(3, 22, 18, 3, lt >= submit2 && lt < submit2 + 0.3 ? "heavy" : "round", done ? "2" : "3");
    g.text(6, 23, done ? "✓ Sent" : "Submit", done ? "2" : "0");
    if (lt >= SUBMIT1 && !done) {
      const m = errors ? `${errors} field${errors > 1 ? "s" : ""} need attention` : "Looks good, ready to submit";
      g.text(24, 23, (errors ? "▲ " : "✓ ") + m, errors ? "4" : "2");
    }
    if (done) g.text(24, 23, "Thanks, we will be in touch within a day.", "1");
    g.text(3, H - 2, "* required", "7");
    return g.frame();
  };
}
