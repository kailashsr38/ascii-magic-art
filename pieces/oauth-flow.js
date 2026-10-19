/* oauth-flow: an authorization code login, each hop carried along a bus between user, app, auth server and API. */
import { Grid, palette, clamp } from "../lib/kit.js";

export const meta = {
  slug: "oauth-flow",
  name: "OAuth Code Flow",
  category: "explainers",
  note: "An authorization code login flow where redirects, the code exchange and the bearer token hop between the browser, app, auth server and API, with each message typed out as it travels.",
  tags: ["oauth", "auth", "login", "diagram", "security", "docs"],
  cols: 100, rows: 24, fps: 24,
  palette: palette(["#e6edf3", "#8b949e", "#30363d", "#79c0ff", "#7ee787", "#ffa657", "#ff7b72", "#d2a8ff", "#ffffff", "#56d4dd", "#f2cc60", "#6e7681"]),
};

const NODES = [
  ["User", "browser", 2, 18, "3"],
  ["Client App", "web server", 28, 18, "9"],
  ["Auth Server", "identity provider", 53, 22, "7"],
  ["Resource API", "/v1", 82, 16, "5"],
];
const SHORT = ["user", "app", "auth", "api"];
// from, to, label, isResponse, payload lines
const STEPS = [
  [0, 1, "click Sign in", false, ["GET /login", "Host: app.example.org"]],
  [1, 0, "redirect to authorize", true, ["HTTP/1.1 302 Found", "Location: id.example.org/authorize", "  ?response_type=code", "  &client_id=app-web", "  &scope=read:profile", "  &state=x7Fq2"]],
  [0, 2, "sign in and consent", false, ["POST /authorize", "user=alex@example.org", "password=••••••••", "consent=read:profile"]],
  [2, 0, "redirect with code", true, ["HTTP/1.1 302 Found", "Location: app.example.org/callback", "  ?code=Sp1Ax9Kd", "  &state=x7Fq2"]],
  [0, 1, "deliver code", false, ["GET /callback?code=Sp1Ax9Kd", "state x7Fq2 matches ✓"]],
  [1, 2, "exchange code", false, ["POST /token", "grant_type=authorization_code", "code=Sp1Ax9Kd", "client_id=app-web", "client_secret=••••••••"]],
  [2, 1, "access token", true, ["HTTP/1.1 200 OK", "{ access_token: eyJhbGciOi..,", "  token_type: Bearer,", "  expires_in: 3600,", "  refresh_token: rT0k.. }"]],
  [1, 3, "call API", false, ["GET /v1/me", "Authorization: Bearer eyJhbGciOi.."]],
  [3, 1, "profile", true, ["HTTP/1.1 200 OK", "{ id: 4821,", "  name: Alex Kim,", "  plan: team }"]],
];
const TAGS = ["GET", "302", "POST", "code", "code", "code", "token", "Bearer", "200"];

export default function create() {
  const { cols, rows } = meta;
  const g = new Grid(cols, rows);
  const S = STEPS.length, STEP = 2.0, LOOP = S * STEP + 3;
  const cx = (i) => NODES[i][2] + (NODES[i][3] >> 1);
  const BUS = 9;
  const paths = STEPS.map(([a, b]) => {
    const out = [];
    const xa = cx(a), xb = cx(b), d = Math.sign(xb - xa);
    for (let y = 7; y < BUS; y++) out.push([xa, y]);
    for (let x = xa; x !== xb; x += d) out.push([x, BUS]);
    out.push([xb, BUS]);
    for (let y = BUS - 1; y >= 7; y--) out.push([xb, y]);
    return out;
  });
  return (t) => {
    g.clear();
    const lt = (t + 0.9) % LOOP;
    const done = lt >= S * STEP;
    const cur = done ? S - 1 : Math.floor(lt / STEP);
    const st = done ? STEP : lt - cur * STEP;
    const p = clamp(st / 1.1);
    const reached = (k) => done || cur > k || (cur === k && p >= 1);
    const [f, to, , resp] = STEPS[cur];
    // header
    g.text(1, 0, "authorization code flow", "0");
    g.text(26, 0, "OAuth 2.0 + state check", "1");
    if (done) g.text(cols - 14, 0, "✓ signed in", "4");
    else g.text(cols - 14, 0, `step ${cur + 1} of ${S}`, "a");
    // bus and stubs
    g.hline(cx(0), cx(3), BUS, "─", "b");
    NODES.forEach((_, i) => {
      g.vline(cx(i), 7, BUS - 1, "│", "b");
      g.set(cx(i), BUS, i === 0 ? "└" : i === 3 ? "┘" : "┴", "b");
    });
    // the moving message
    if (!done) {
      const P = paths[cur];
      const co = resp ? "4" : "5";
      const n = Math.round(p * (P.length - 1));
      for (let k = 0; k <= n; k++) {
        const [x, y] = P[k];
        g.set(x, y, y === BUS ? "━" : "┃", co);
      }
      const [hx, hy] = P[n];
      if (p >= 1) g.set(hx, hy, "▲", co);
      else g.set(hx, hy, "●", "8");
      const tag = " " + TAGS[cur] + " ";
      const tx = clamp(hx - (tag.length >> 1), 0, cols - tag.length);
      g.text(tx, BUS + 1, tag, co);
    }
    // nodes
    NODES.forEach(([name, sub, x, w, co], i) => {
      const on = !done && (i === f || i === to);
      g.box(x, 2, w, 5, on ? "heavy" : "round", on ? co : "b");
      g.text(x + 2, 3, name, on ? "8" : "0");
      g.text(x + 2, 4, sub, "1");
      let s = "", sc = "1";
      if (i === 0) [s, sc] = done ? ["● signed in", "4"] : ["○ signed out", "1"];
      if (i === 1) [s, sc] = reached(6) ? ["● token held", "4"] : ["○ no session", "1"];
      if (i === 2) [s, sc] = reached(5) ? ["● code used", "1"] : reached(3) ? ["● code issued", "a"] : ["○ waiting", "1"];
      if (i === 3) [s, sc] = reached(8) ? ["● jwt valid", "4"] : ["○ idle", "1"];
      g.text(x + 2, 5, s, sc);
      g.set(cx(i), 6, on ? "┳" : "┬", on ? co : "b");
    });
    // step list
    g.text(1, 12, "steps", "1");
    STEPS.forEach(([a, b, label, r], i) => {
      const y = 13 + i;
      const isCur = !done && i === cur;
      const future = !done && i > cur;
      g.text(1, y, isCur ? "▶" : future ? " " : "✓", isCur ? "a" : "4");
      g.text(3, y, String(i + 1), isCur ? "8" : future ? "b" : "1");
      g.text(5, y, (SHORT[a] + " → " + SHORT[b]).padEnd(12), future ? "b" : r ? "4" : "5");
      g.text(18, y, label, isCur ? "8" : future ? "b" : "0");
    });
    // payload panel
    const PX = 46, PY = 11, PW = cols - PX, PH = 12;
    g.box(PX, PY, PW, PH, "round", "b");
    const [sa, sb] = STEPS[cur];
    g.text(PX + 2, PY, ` ${cur + 1} · ${NODES[sa][0]} → ${NODES[sb][0]} `, "0");
    const lines = STEPS[cur][4];
    const total = lines.reduce((a, l) => a + l.length, 0);
    let budget = done ? total : Math.floor(clamp((st - 0.2) / 1.3) * total);
    lines.forEach((l, i) => {
      const shown = l.slice(0, Math.max(0, budget));
      budget -= l.length;
      const head = i === 0;
      let co = head ? (resp ? "4" : "5") : "0";
      if (/••/.test(l)) co = "1";
      if (/code=|state|access_token|Bearer/.test(l) && !head) co = "9";
      g.text(PX + 2, PY + 2 + i, shown, co);
    });
    // footer
    g.text(1, rows - 1, "client_id app-web   scope read:profile   redirect_uri /callback", "b");
    return g.frame();
  };
}
