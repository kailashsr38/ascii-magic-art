/* inbox-list: an email inbox with unread dots where new mail slides in at the top. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "inbox-list",
  name: "Inbox List",
  category: "screens",
  note: "An email inbox with unread dots, stars and previews, where new mail slides in at the top.",
  tags: ["email", "inbox", "app", "mail", "list"],
  cols: 84, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60"]),
};

const MAIL = [
  ["Maya Chen", "Q4 roadmap review", "Pulled the notes together, the big open question is billing v2", "4"],
  ["Billing", "Your invoice INV-2291 is ready", "Amount due $480.00, payment scheduled for Nov 1", "1"],
  ["Omar Haddad", "Re: staging outage", "Root cause was the connection pool, fix is in review", "5"],
  ["Design Weekly", "12 tiny details that make UI feel fast", "Optimistic updates, skeletons and the art of waiting", "6"],
  ["Lena Park", "Offsite on the 24th?", "Thinking somewhere near the lake, cabins for 14 people", "2"],
  ["CI Bot", "Build #4821 passed on main", "All 312 checks passed in 6m 41s", "2"],
  ["Ana Ruiz", "Contract draft v3", "Made the edits to section 4, ready for your signature", "3"],
  ["Security", "New sign-in from Lisbon", "Chrome on macOS, if this was you no action needed", "5"],
  ["Dev Patel", "Lunch tomorrow?", "There's a new ramen place on 5th, my treat", "4"],
  ["Calendar", "Reminder: 1:1 with Maya at 3pm", "Agenda: hiring plan, launch retro, career goals", "3"],
  ["Support", "Ticket #8812 resolved", "The customer confirmed the export now works", "2"],
  ["Kai Sato", "Photos from the launch", "Uploaded 84 photos to the shared album", "6"],
];
const STEP = 2.4;
const fit = (s, w) => (s.length <= w ? s : s.slice(0, w - 2).trimEnd() + "..");
const ease = (v) => { v = Math.max(0, Math.min(1, v)); return 1 - Math.pow(1 - v, 3); };
const h = (n) => { let x = Math.imul(n ^ 0x5bd1e995, 2654435761) >>> 0; return (x ^ (x >>> 15)) / 4294967296 % 1; };

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  return (t) => {
    g.clear();
    const k = Math.floor(t / STEP), f = (t % STEP);
    const e = ease(f / 0.5);
    g.box(0, 0, W, H, "round", "7");
    const unread = 9 + (k % 5);
    g.text(2, 1, "Inbox", "0"); g.text(8, 1, `${unread} unread`, "3");
    g.text(W - 34, 1, "[", "8"); g.text(W - 32, 1, "Search mail", "7"); g.text(W - 6, 1, "/", "7"); g.text(W - 4, 1, "]", "8");
    g.text(2, 3, "Primary", "0"); g.hline(2, 8, 4, "━", "3");
    g.text(12, 3, "Updates  3", "1"); g.text(25, 3, "Promotions", "1");
    g.hline(1, W - 2, 4, "─", "8"); g.hline(2, 8, 4, "━", "3");
    const rowsVis = Math.floor((H - 6) / 2);
    const ct = (x, y, str, c) => { for (let i = 0; i < str.length; i++) if (x + i >= 1 && x + i <= W - 2) g.set(x + i, y, str[i], c); };
    for (let j = rowsVis; j >= 0; j--) { // older rows first, the fresh row lands on top
      const n = k - j; // mail serial
      const m = MAIL[((n % MAIL.length) + MAIL.length) % MAIL.length];
      // existing rows sit one slot lower after the new one arrives
      const slot = j === 0 ? 0 : j - 1 + e;
      const y = Math.round(5 + slot * 2);
      if (y > H - 3) continue;
      const fresh = j === 0;
      const dx = fresh ? Math.round((1 - e) * W) : 0;
      if (fresh && e <= 0) continue;
      const isUnread = j < 3 || h(n) > 0.55;
      const x = 2 + dx;
      g.fill(1, y, W - 2, 2, " ");
      if (fresh && f < 1.2) ct(x - 1, y, "░".repeat(W), "8"), ct(x - 1, y + 1, "░".repeat(W), "8");
      ct(x, y, isUnread ? "●" : " ", "3");
      ct(x + 2, y, h(n * 3) > 0.7 ? "■" : "□", h(n * 3) > 0.7 ? "9" : "7");
      ct(x + 4, y, m[0], isUnread ? "0" : "1");
      ct(x + 20, y, fit(m[1], W - 36), isUnread ? "0" : "1");
      const mins = 9 * 60 + 41 + n * 3;
      const tm = `${String(Math.floor(mins / 60) % 12 || 12)}:${String(mins % 60).padStart(2, "0")} ${Math.floor(mins / 60) % 24 >= 12 ? "pm" : "am"}`;
      ct(W - 3 - tm.length + dx, y, tm, fresh ? "3" : "1");
      ct(x + 18, y, "▌", m[3]);
      ct(x + 20, y + 1, fit(m[2], W - 28), "7");
    }
    g.vline(W - 1, 1, H - 2, "│", "7"); // sliding rows tuck under the frame
    return g.frame();
  };
}
