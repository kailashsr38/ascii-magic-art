/* otp-code-entry: a six digit verification screen where a code is typed, rejected once, retyped and accepted. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "otp-code-entry",
  name: "OTP Code Entry",
  category: "screens",
  note: "A two step verification screen where a six digit code is typed, shakes as wrong, is retyped and goes green.",
  tags: ["otp", "verification", "security", "form", "login", "app"],
  cols: 60, rows: 19, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const TRIES = [["482913", false], ["482931", true]];
const KT = 0.32, PERIOD = 15;

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // phases: try0 typed at 1.0, verify, error until 5.6, cleared, try1 typed 6.2, verify, success
    let code = "", state = "typing", shake = 0, timer = 30;
    const T0 = 1.0, T1 = 6.4;
    const ver0 = T0 + 6 * KT + 0.2, ver1 = T1 + 6 * KT + 0.2;
    if (lt < T1 - 0.3) {
      code = TRIES[0][0].slice(0, Math.max(0, Math.min(6, Math.floor((lt - T0) / KT) + 1)));
      if (lt < T0) code = "";
      if (lt >= ver0) state = lt < ver0 + 0.9 ? "verify" : "error";
      if (state === "error") shake = Math.max(0, 1 - (lt - ver0 - 0.9) / 0.6);
    } else {
      code = lt < T1 ? "" : TRIES[1][0].slice(0, Math.min(6, Math.floor((lt - T1) / KT) + 1));
      if (lt >= ver1) state = lt < ver1 + 0.9 ? "verify" : "ok";
    }
    timer = Math.max(0, 30 - Math.floor(lt * 1.6));
    g.box(0, 0, W, H, "round", "7");
    const cx = W / 2;
    g.text(cx - 3, 2, "╭───╮", "6"); g.text(cx - 3, 3, "│ ■ │", "6"); g.text(cx - 3, 4, "╰───╯", "6");
    const title = "Enter verification code";
    g.text(cx - title.length / 2, 6, title, "0");
    const sub = "We sent a 6 digit code to +44 •••• •••• 217";
    g.text(Math.round(cx - sub.length / 2), 7, sub, "1");
    const dx = Math.round(Math.sin(lt * 40) * 2 * shake);
    const bx0 = Math.round(cx - (6 * 7 + 2) / 2) + dx;
    for (let i = 0; i < 6; i++) {
      const x = bx0 + i * 7 + (i >= 3 ? 2 : 0);
      const filled = i < code.length, cur = i === code.length && state === "typing";
      const col = state === "error" ? "5" : state === "ok" ? "2" : cur ? "3" : filled ? "0" : "8";
      g.box(x, 9, 6, 3, cur || state !== "typing" ? "heavy" : "round", col);
      if (filled) g.set(x + 2, 10, code[i], state === "error" ? "5" : state === "ok" ? "2" : "0");
      else if (cur && Math.floor(lt * 3) % 2 === 0) g.set(x + 2, 10, "▏", "3");
    }
    g.set(bx0 + 20, 10, "-", "7");
    let msg, mc;
    if (state === "verify") { msg = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[Math.floor(lt * 12) % 10] + " Verifying..."; mc = "3"; }
    else if (state === "error") { msg = "✗ That code is not right. Try again."; mc = "5"; }
    else if (state === "ok") { msg = "✓ Verified. Signing you in..."; mc = "2"; }
    else { msg = timer > 0 ? `Resend code in 0:${String(timer).padStart(2, "0")}` : "Resend code"; mc = timer > 0 ? "7" : "3"; }
    g.text(Math.round(cx - msg.length / 2), 13, msg, mc);
    const ok = state === "ok";
    g.box(cx - 13, 15, 26, 3, "round", code.length === 6 ? (ok ? "2" : "3") : "8");
    const bl = ok ? "Continue →" : "Verify";
    g.text(Math.round(cx - bl.length / 2), 16, bl, code.length === 6 ? "0" : "7");
    return g.frame();
  };
}
