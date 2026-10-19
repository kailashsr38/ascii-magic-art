/* packet-sniffer: a packet capture view streaming colour-coded packets with a hex dump of the selected one. */
import { Grid, palette, rng } from "../lib/kit.js";

export const meta = {
  slug: "packet-sniffer",
  name: "Packet Capture",
  category: "screens",
  note: "A packet capture tool streaming colour-coded TCP, UDP, DNS and TLS packets with protocol counters and a hex dump of the selected packet.",
  tags: ["network", "packets", "terminal", "security", "developer", "monitor"],
  cols: 100, rows: 30, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd"]),
};

const HOSTS = ["10.0.0.12", "10.0.0.1", "10.0.0.31", "192.168.4.20", "10.0.0.7", "172.16.2.9"];
const KINDS = [
  ["TCP", "3", (r) => `[${["S", "S.", ".", "P.", "F."][Math.floor(r * 5)]}] seq ${Math.floor(r * 4e9)} win 64240`],
  ["TLS", "6", (r) => (r < 0.5 ? "Application Data, len " + Math.floor(40 + r * 1400) : "Client Hello, SNI api.internal")],
  ["DNS", "9", (r) => (r < 0.5 ? `A? cdn.internal. (${Math.floor(30 + r * 20)})` : `A 10.0.4.${Math.floor(r * 250)} ttl 300`)],
  ["UDP", "a", (r) => `length ${Math.floor(20 + r * 500)}`],
  ["HTTP", "2", (r) => (r < 0.5 ? "GET /healthz HTTP/1.1" : "HTTP/1.1 200 OK (application/json)")],
  ["ICMP", "4", (r) => `echo ${r < 0.5 ? "request" : "reply"}, id 4120, seq ${Math.floor(r * 90)}`],
  ["ARP", "1", () => "who-has 10.0.0.1 tell 10.0.0.12"],
];
const PORTS = { TCP: 5432, TLS: 443, DNS: 53, UDP: 5353, HTTP: 8080, ICMP: 0, ARP: 0 };
const RATE = 9; // packets per second

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  const pk = (n) => {
    const r = rng(n * 7919 + 3);
    const kr = r();
    const k = kr < 0.34 ? 0 : kr < 0.6 ? 1 : kr < 0.74 ? 2 : kr < 0.82 ? 3 : kr < 0.92 ? 4 : kr < 0.97 ? 5 : 6;
    const a = Math.floor(r() * HOSTS.length), b = (a + 1 + Math.floor(r() * (HOSTS.length - 1))) % HOSTS.length;
    const sp = 30000 + Math.floor(r() * 30000);
    const bytes = []; const len = 32;
    for (let i = 0; i < len; i++) bytes.push(Math.floor(r() * 256));
    return { k, a, b, sp, info: KINDS[k][2](r()), bytes, len: Math.floor(54 + r() * 1400) };
  };
  const LIST = H - 13;
  return (t) => {
    g.clear();
    const total = Math.floor(t * RATE) + 40;
    g.text(0, 0, "capture on eth0 · filter: ", "1"); g.text(26, 0, "not port 22", "9");
    g.text(W - 27, 0, `packets ${String(total).padStart(6)} · 0 dropped`, "1");
    [[3, "No."], [14, "Time"], [20, "Source"], [42, "Destination"], [64, "Proto"], [71, "Len"], [76, "Info"]].forEach(([x, h]) => g.text(x, 1, h, "0"));
    g.hline(0, W - 1, 2, "─", "8");
    const sel = total - 5;
    for (let i = 0; i < LIST; i++) {
      const n = total - LIST + 1 + i;
      const p = pk(n);
      const [proto, c] = KINDS[p.k];
      const y = 3 + i;
      const ts = (n / RATE + 0.0137 * (n % 7)).toFixed(6);
      const isSel = n === sel;
      if (isSel) g.text(0, y, "▶", "0");
      const port = PORTS[proto];
      const src = HOSTS[p.a] + (port ? ":" + p.sp : "");
      const dst = HOSTS[p.b] + (port ? ":" + port : "");
      g.text(1, y, String(n).padStart(5), isSel ? "0" : "7");
      g.text(8, y, ts.padStart(10), "7");
      g.text(20, y, src, isSel ? "0" : "1");
      g.text(42, y, dst, isSel ? "0" : "1");
      g.text(64, y, proto.padEnd(5), c);
      g.text(70, y, String(p.len).padStart(4), "7");
      g.text(76, y, p.info.length > W - 78 ? p.info.slice(0, W - 80) + ".." : p.info, isSel ? "0" : c);
    }
    // detail pane
    const DY = 3 + LIST;
    g.hline(0, W - 1, DY, "─", "8");
    const p = pk(sel);
    const [proto, c] = KINDS[p.k];
    g.text(0, DY + 1, `Frame ${sel}: ${p.len} bytes on wire`, "0");
    g.text(36, DY + 1, `Ethernet II > IPv4 ${HOSTS[p.a]} → ${HOSTS[p.b]} > `, "1");
    g.text(36 + `Ethernet II > IPv4 ${HOSTS[p.a]} → ${HOSTS[p.b]} > `.length, DY + 1, proto, c);
    for (let row = 0; row < 4; row++) {
      const y = DY + 2 + row;
      g.text(0, y, (row * 16).toString(16).padStart(4, "0"), "7");
      let asc = "";
      for (let i = 0; i < 8; i++) {
        const b = p.bytes[(row * 8 + i) % 32] ^ (row * 31);
        g.text(6 + i * 3 + (i >= 4 ? 1 : 0), y, b.toString(16).padStart(2, "0"), i < 2 && row === 0 ? "3" : "1");
        asc += b >= 33 && b < 127 ? String.fromCharCode(b) : ".";
      }
      g.text(32, y, asc, "7");
    }
    // protocol counters
    const SX = 46;
    g.text(SX, DY + 2, "protocol mix (last 200)", "1");
    const cnt = KINDS.map(() => 0);
    for (let n = total - 199; n <= total; n++) cnt[pk(n).k]++;
    KINDS.slice(0, 6).forEach(([nm, cc], i) => {
      const x = SX + (i % 2) * 27, y = DY + 3 + Math.floor(i / 2);
      const bw = 14, w = Math.round((cnt[i] / 200) * bw * 2.5);
      g.text(x, y, nm.padEnd(5), cc);
      g.text(x + 5, y, "█".repeat(Math.min(bw, w)), cc); g.text(x + 5 + Math.min(bw, w), y, "░".repeat(bw - Math.min(bw, w)), "8");
      g.text(x + 20, y, String(cnt[i]).padStart(3), "1");
    });
    g.hline(0, W - 1, H - 2, "─", "8");
    g.text(0, H - 1, "● capturing", "5"); g.text(13, H - 1, `${(RATE * 0.71).toFixed(1)} kB/s`, "1");
    g.text(W - 34, H - 1, "q quit · f filter · enter follow", "7");
    return g.frame();
  };
}
