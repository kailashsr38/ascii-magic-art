/* login-form: a sign-in card filling in, the button pressing, then a drawn success tick. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "login-form",
  name: "Login Form",
  category: "screens",
  note: "A sign-in card where the email and password fill in, the button presses and a success tick draws itself.",
  tags: ["form", "login", "auth", "app", "onboarding"],
  cols: 56, rows: 26, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#3fb950"]),
};

const PERIOD = 10.5;
const EMAIL = "maya.chen@studio.dev";
const SPIN = "┤┘┴└├┌┬┐";

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const cx = 8, cw = 40;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    // backdrop pattern
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x + y * 2) % 6 === 0) g.set(x, y, "·", "8");
    g.fill(cx, 1, cw, H - 2, " ");
    g.box(cx, 1, cw, H - 2, "round", "7");
    g.text(cx + 3, 2, "■", "3"); g.text(cx + 5, 2, "Northwind", "0"); g.text(cx + cw - 13, 2, "workspace", "1");
    if (lt < 6.8) {
      g.text(cx + 3, 4, "Welcome back", "0");
      g.text(cx + 3, 5, "Sign in to continue to your team", "1");
      const ne = Math.max(0, Math.min(EMAIL.length, Math.floor((lt - 0.6) / 0.075)));
      const np = Math.max(0, Math.min(12, Math.floor((lt - 2.7) / 0.09)));
      const fe = lt > 0.3 && lt < 2.5, fp = lt >= 2.5 && lt < 4.0;
      g.text(cx + 3, 7, "Email", "1");
      g.box(cx + 3, 8, cw - 6, 3, fe ? "heavy" : "light", fe ? "3" : "7");
      if (ne) g.text(cx + 5, 9, EMAIL.slice(0, ne), "0"); else g.text(cx + 5, 9, "you@company.com", "8");
      g.text(cx + 3, 11, "Password", "1"); g.text(cx + cw - 20, 11, "Forgot password?", "3");
      g.box(cx + 3, 12, cw - 6, 3, fp ? "heavy" : "light", fp ? "3" : "7");
      if (np) g.text(cx + 5, 13, "•".repeat(np), "0"); else g.text(cx + 5, 13, "••••••••", "8");
      if (np >= 12) g.text(cx + cw - 9, 13, "✓", "2");
      const blink = Math.floor(lt * 3) % 2 === 0;
      if (fe && blink) g.set(cx + 5 + ne, 9, "█", "3");
      if (fp && blink) g.set(cx + 5 + np, 13, "█", "3");
      const chk = lt > 4.3;
      g.text(cx + 3, 16, chk ? "[✓]" : "[ ]", chk ? "2" : "1"); g.text(cx + 7, 16, "Remember me for 30 days", "1");
      const press = lt > 4.9 && lt < 5.15, busy = lt >= 5.15;
      g.box(cx + 3, 18, cw - 6, 3, press ? "double" : busy ? "heavy" : "light", press || busy ? "3" : "7");
      const label = busy ? SPIN[Math.floor(lt * 12) % 8] + "  Signing in" : "Sign in  →";
      g.text(cx + Math.floor((cw - label.length) / 2), 19, label, busy || press ? "3" : "0");
      g.text(cx + 7, H - 3, "No account?", "1"); g.text(cx + 19, H - 3, "Create one", "3");
    } else {
      const u = lt - 6.8;
      const ox = cx + cw / 2, oy = 10, R = 7;
      const prog = Math.min(1, u / 0.7);
      for (let y = oy - 5; y <= oy + 5; y++) for (let x = ox - 16; x <= ox + 16; x++) {
        const dx = (x - ox) / 2, dy = y - oy;
        const d = Math.hypot(dx * 2, dy * 2) / 2;
        const a = (Math.atan2(dy, dx) + Math.PI * 1.5) % (Math.PI * 2) / (Math.PI * 2);
        if (Math.abs(d - R / 2 - 0.6) < 0.6 && a <= prog) g.set(x, y, "█", "9");
      }
      if (u > 0.6) {
        const k = Math.min(1, (u - 0.6) / 0.5);
        const pts = [[ox - 5, oy], [ox - 2, oy + 2], [ox + 5, oy - 2]];
        const seg1 = Math.min(1, k * 2), seg2 = Math.max(0, k * 2 - 1);
        g.line(pts[0][0], pts[0][1], pts[0][0] + (pts[1][0] - pts[0][0]) * seg1, pts[0][1] + (pts[1][1] - pts[0][1]) * seg1, "█", "2");
        if (seg2 > 0) g.line(pts[1][0], pts[1][1], pts[1][0] + (pts[2][0] - pts[1][0]) * seg2, pts[1][1] + (pts[2][1] - pts[1][1]) * seg2, "█", "2");
      }
      if (u > 1.1) {
        g.text(cx + 12, 17, "You are signed in", "0");
        g.text(cx + 9, 18, "maya.chen@studio.dev", "3");
        g.text(cx + 9, 20, "Opening dashboard" + ".".repeat(Math.floor(u * 3) % 4), "1");
        const bw = cw - 12, n = Math.round(Math.min(1, (u - 1.1) / 2.4) * bw);
        g.text(cx + 6, 22, "━".repeat(n), "3"); g.text(cx + 6 + n, 22, "─".repeat(bw - n), "8");
      }
    }
    return g.frame();
  };
}
