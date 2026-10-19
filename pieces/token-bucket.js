/* token-bucket: a rate limiter bucket refilling at a steady rate, spending a token per request and rejecting a burst. */
import { Grid, palette, clamp, rng } from "../lib/kit.js";

export const meta = {
  slug: "token-bucket",
  name: "Token Bucket Limiter",
  category: "explainers",
  note: "A token bucket rate limiter where tokens drip in at a fixed rate, each request spends one on its way to the API, and a sudden burst drains the bucket so the overflow is turned away with 429s.",
  tags: ["rate-limit", "api", "algorithm", "diagram", "backend", "docs"],
  cols: 96, rows: 28, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const CAP = 15, RATE = 2, LOOP = 24, IN = 0.9, OUT = 0.7;
  const r = rng(5);
  const reqs = [];
  for (let ts = 0.3; ts < LOOP - 6; ) {
    const burst = ts > 6 && ts < 9.5;
    reqs.push({ ts });
    ts += burst ? 0.09 + r() * 0.06 : 0.55 + r() * 0.6;
  }
  // simulate the bucket
  let tok = CAP, last = 0;
  const hist = [];
  const HS = 0.1;
  let hi = 0;
  const sample = (upto) => { while (hi * HS <= upto) { hist.push(Math.min(CAP, tok + RATE * (hi * HS - last))); hi++; } };
  for (const q of reqs) {
    q.tg = q.ts + IN;
    sample(q.tg - 1e-6);
    tok = Math.min(CAP, tok + RATE * (q.tg - last)); last = q.tg;
    q.ok = tok >= 1;
    if (q.ok) tok -= 1;
    q.after = tok;
  }
  sample(LOOP);
  const tokensAt = (lt) => hist[Math.min(hist.length - 1, Math.floor(lt / HS))];
  const GX = 30, BX = 36, BW = 19, BY = 6, BH = 12;
  return (t) => {
    g.clear();
    const lt = t % LOOP;
    const tokens = tokensAt(lt);
    const whole = Math.floor(tokens + 1e-6);
    // incoming lane
    g.box(1, 13, 12, 5, "round", "3");
    g.text(3, 14, "clients", "0");
    const rps = reqs.filter((q) => q.ts <= lt && q.ts > lt - 1).length;
    g.text(3, 15, rps + " req/s", rps > 4 ? "5" : "1");
    g.hline(13, BX - 2, 15, "─", "b");
    // pass lane to the API, reject lane down
    g.hline(BX + BW + 1, 79, 15, "─", "b");
    g.box(80, 13, 15, 5, "round", "4");
    g.text(82, 14, "API", "0");
    g.vline(GX, 16, 22, "│", "b");
    g.box(GX - 7, 23, 15, 3, "round", "6");
    g.text(GX - 5, 24, "429 limited", "6");
    // bucket
    g.text(BX + 6, 2, "refill", "1");
    g.text(BX + 6, 3, RATE + " per s", "0");
    g.text(BX + 8, 4, "┬", "9");
    g.vline(BX, BY, BY + BH, "│", "9");
    g.vline(BX + BW, BY, BY + BH, "│", "9");
    g.hline(BX + 1, BX + BW - 1, BY + BH, "─", "9");
    g.set(BX, BY + BH, "└", "9"); g.set(BX + BW, BY + BH, "┘", "9");
    g.set(BX - 1, BY, "─", "9"); g.set(BX + BW + 1, BY, "─", "9");
    // tokens stacked, 5 per row, 3 rows, drawn bottom up
    for (let i = 0; i < CAP; i++) {
      const row = Math.floor(i / 5), col = i % 5;
      const x = BX + 2 + col * 3 + (row % 2), y = BY + BH - 2 - row * 3;
      if (i < whole) { g.text(x, y, "●", "a"); }
      else g.text(x, y, "·", "2");
    }
    // falling token from the tap when not full
    if (tokens < CAP - 0.01) {
      const f = (lt * RATE) % 1;
      const topRow = Math.floor(whole / 5);
      const floorY = BY + BH - 2 - topRow * 3;
      const y = Math.round(5 + f * (floorY - 5));
      g.set(BX + 8, y, "●", "a");
    }
    g.text(BX + 2, BY + BH + 1, "tokens " + String(whole).padStart(2) + " / " + CAP, whole === 0 ? "6" : "0");
    // gate glyph
    // requests in flight
    let allowed = 0, limited = 0;
    const recent = [];
    for (const q of reqs) {
      if (q.ts > lt) break;
      const age = lt - q.tg;
      if (lt < q.tg) {
        const x = Math.round(13 + ((lt - q.ts) / IN) * (GX - 13));
        g.set(x, 15, "▶", "3");
      } else if (q.ok) {
        allowed++; recent.push(q);
        if (age < OUT) { const x = Math.round(BX + BW + 1 + (age / OUT) * (79 - BX - BW - 1)); g.set(x, 15, "▶", "4"); }
        if (age < 0.25) g.set(BX + 8, BY + 1, "↑", "a");
      } else {
        limited++; recent.push(q);
        if (age < OUT) { const y = Math.round(16 + (age / OUT) * 6); g.set(GX, y, "▼", "6"); }
      }
    }
    // gate
    const lastQ = recent[recent.length - 1];
    const gc = lastQ && lt - lastQ.tg < 0.3 ? (lastQ.ok ? "4" : "6") : "b";
    g.text(GX - 1, 14, "┌┐", gc); g.text(GX - 1, 15, "┤├", gc); g.text(GX - 1, 16, "└┘", gc);
    g.hline(GX + 1, BX - 1, 15, "─", "b");
    g.set(BX, 15, "┼", "9");
    g.set(BX + BW, 15, "┼", "9");
    // stats panel
    g.box(62, 1, 33, 10, "round", "b");
    g.text(64, 1, " limiter ", "0");
    g.text(64, 3, "capacity", "1"); g.text(76, 3, CAP + " tokens", "0");
    g.text(64, 4, "refill", "1"); g.text(76, 4, RATE + " tokens/s", "0");
    g.text(64, 6, "allowed", "1"); g.text(76, 6, String(allowed), "4");
    g.text(64, 7, "limited", "1"); g.text(76, 7, String(limited), limited ? "6" : "1");
    g.text(64, 9, "last 20", "1");
    recent.slice(-20).forEach((q, i) => g.set(72 + i, 9, q.ok ? "✓" : "✗", q.ok ? "4" : "6"));
    // token history chart
    g.text(62, 20, "tokens over time", "1");
    for (let c = 0; c < 32; c++) {
      const tt = lt - (31 - c) * 0.3;
      const v = tokensAt(((tt % LOOP) + LOOP) % LOOP) / CAP;
      const h = v * 4;
      for (let k = 0; k < 4; k++) {
        const vv = h - k;
        const ch = vv >= 1 ? "█" : vv > 0.5 ? "▄" : vv > 0.05 ? "▁" : null;
        if (ch) g.set(62 + c, 25 - k, ch, v < 0.15 ? "6" : "a");
      }
    }
    g.hline(62, 93, 26, "─", "2");
    const burst = lt > 6 && lt < 9.8;
    g.text(1, 0, "rate limiter", "0");
    g.text(15, 0, burst ? "● burst incoming" : "● normal traffic", burst ? "5" : "4");
    g.text(1, rows - 1, "Retry-After: 1", "b");
    return g.frame();
  };
}
