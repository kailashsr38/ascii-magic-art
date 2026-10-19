/* relay-chat-channel: a terminal relay chat channel with joins, parts, messages, a nick list and an input line. */
import { Grid, palette } from "../lib/kit.js";

export const meta = {
  slug: "relay-chat-channel",
  name: "Relay Chat Channel",
  category: "screens",
  note: "A terminal relay chat client where people join and leave a channel, chat with timestamps and the nick list updates beside them.",
  tags: ["irc", "chat", "terminal", "retro", "community", "messages"],
  cols: 96, rows: 28, fps: 20,
  palette: palette(["#e6edf3", "#8b949e", "#7ee787", "#79c0ff", "#ffa657", "#ff7b72", "#d2a8ff", "#484f58", "#30363d", "#f2cc60", "#56d4dd", "#ff9bce"]),
};

const NICKC = { moth: "6", byteweaver: "3", kestrel: "4", "pixel_ann": "b", dmz: "a", tarn: "9", you: "2" };
const BASE = ["@moth", "+byteweaver", "dmz", "kestrel"];
// [dt, kind, nick, text]
const EV = [
  [0.0, "msg", "dmz", "anyone tried the new ascii shaders build?"],
  [1.0, "msg", "kestrel", "yeah, the plasma one runs at 60 on my old laptop"],
  [1.3, "join", "pixel_ann"],
  [1.0, "msg", "pixel_ann", "hey all o/"],
  [0.9, "msg", "moth", "welcome pixel_ann, topic has the faq link"],
  [1.4, "msg", "byteweaver", "dmz: the tunnel one needs the depth buffer patch"],
  [1.2, "action", "dmz", "pulls latest and rebuilds"],
  [1.3, "msg", "dmz", "much better, thanks"],
  [1.0, "join", "tarn"],
  [1.0, "msg", "tarn", "is the meetup still on for saturday?"],
  [1.2, "msg", "moth", "yes, 7pm at the usual place"],
  [1.1, "part", "kestrel", "off to sleep"],
  [0.9, "type", "you", "count me in for saturday"],
  [2.2, "msg", "you", "count me in for saturday"],
  [1.0, "msg", "pixel_ann", "same here :)"],
  [3.0, "end"],
];

const HIST = [
  [["21:32 ", "7"], ["<", "7"], ["moth", "6"], ["> ", "7"], ["new art pack is up in the files area", "0"]],
  [["21:33 ", "7"], ["<", "7"], ["kestrel", "4"], ["> ", "7"], ["the harbour scene is lovely", "0"]],
  [["21:34 ", "7"], ["<--", "5"], [" lumen", "1"], [" has quit (connection reset)", "5"]],
  [["21:35 ", "7"], ["<", "7"], ["byteweaver", "3"], ["> ", "7"], ["anyone know a good braille dither ramp?", "0"]],
  [["21:36 ", "7"], ["<", "7"], ["moth", "6"], ["> ", "7"], ["byteweaver: 2x4 dots per cell, threshold per dot", "0"]],
  [["21:36 ", "7"], ["<", "7"], ["byteweaver", "3"], ["> ", "7"], ["oh nice, that doubles the resolution", "0"]],
  [["21:38 ", "7"], [" * ", "6"], ["kestrel stretches", "6"]],
  [["21:39 ", "7"], ["-->", "2"], [" dmz", "a"], [" (~dmz@10.4.2.9) has joined #asciiart", "2"]],
];

export default function create() {
  const g = new Grid(meta.cols, meta.rows);
  const W = meta.cols, H = meta.rows;
  let acc = 0;
  const ev = EV.map((e) => { acc += e[0]; return [acc, ...e.slice(1)]; });
  const PERIOD = acc;
  const NW = 16, CW = W - NW - 1;
  return (t) => {
    g.clear();
    const lt = t % PERIOD;
    const nicks = BASE.slice();
    const lines = [
      [[" -- ", "7"], ["Now talking on ", "1"], ["#asciiart", "a"]],
      [[" -- ", "7"], ["Topic: ", "1"], ["text mode forever · faq: see /docs · meetup sat 7pm", "0"]],
      ...HIST,
    ];
    let typing = null;
    let minute = 41 * 60;
    for (const [at, kind, nick, text] of ev) {
      if (at > lt || kind === "end") break;
      const ts = `21:${String(Math.floor((minute + at * 7) / 60) % 60).padStart(2, "0")}`;
      const T = [ts + " ", "7"];
      if (kind === "msg") lines.push([T, ["<", "7"], [nick, NICKC[nick]], ["> ", "7"], [text, "0"]]);
      else if (kind === "action") lines.push([T, [" * ", "6"], [nick + " " + text, "6"]]);
      else if (kind === "join") { lines.push([T, ["-->", "2"], [" " + nick, NICKC[nick]], [" (~" + nick + "@10.4.2.17) has joined #asciiart", "2"]]); nicks.push(nick); }
      else if (kind === "part") { lines.push([T, ["<--", "5"], [" " + nick, NICKC[nick]], [` has left #asciiart (${text})`, "5"]]); nicks.splice(nicks.indexOf(nick), 1); }
      else if (kind === "type") typing = [at, text];
      if (kind === "msg" && nick === "you") typing = null;
    }
    // title bar
    g.text(0, 0, " #asciiart ", "a"); g.text(11, 0, `[${nicks.length + 1} users]  +nt`, "1");
    g.text(W - 24, 0, "relay.lan:6697 (tls)", "7");
    g.hline(0, W - 1, 1, "─", "8");
    // messages
    const VIS = H - 5;
    // wrap long lines like a real client: break at spaces, hang the continuation under the text
    const rows = [];
    for (const segs of lines) {
      const cells = [];
      for (const [s, c] of segs) for (const ch of s) cells.push([ch, c]);
      const max = CW - 2, ind = 6;
      let start = 0, first = true;
      while (start < cells.length) {
        const w = first ? max : max - ind;
        let end = Math.min(cells.length, start + w);
        if (end < cells.length) { let b = end; while (b > start + 8 && cells[b][0] !== " ") b--; if (b > start + 8) end = b; }
        rows.push([first ? 0 : ind, cells.slice(start, end)]);
        start = end; while (start < cells.length && cells[start][0] === " ") start++;
        first = false;
      }
    }
    rows.slice(-VIS).forEach(([x0, cells], i) => cells.forEach(([ch, c], k) => g.set(x0 + k, 2 + i, ch, c)));
    // nick list
    for (let y = 2; y < H - 3; y++) g.set(CW, y, "│", "8");
    const all = [...nicks, "you"].sort((a, b) => {
      const r = (n) => (n.startsWith("@") ? 0 : n.startsWith("+") ? 1 : 2);
      return r(a) - r(b) || a.replace(/[@+]/, "").localeCompare(b.replace(/[@+]/, ""));
    });
    all.forEach((n, i) => {
      const bare = n.replace(/[@+]/, "");
      const pre = n[0] === "@" ? "@" : n[0] === "+" ? "+" : " ";
      g.set(CW + 2, 2 + i, pre, pre === "@" ? "2" : "9");
      g.text(CW + 3, 2 + i, bare, NICKC[bare] || "0");
    });
    // status + input
    g.hline(0, W - 1, H - 3, "─", "8");
    g.text(0, H - 2, "[21:4" + (Math.floor(lt / 6) % 10) + "] [you(+i)] [3:relay/#asciiart(+nt)] [Act: 2]", "3");
    g.text(0, H - 1, "[#asciiart] ", "a");
    if (typing) {
      let s = typing[1].slice(0, Math.floor((lt - typing[0]) / 0.07));
      if (s.length > W - 14) s = s.slice(s.length - (W - 14)); // input scrolls left
      g.text(12, H - 1, s, "0");
      if (Math.floor(lt * 3) % 2 === 0) g.set(12 + s.length, H - 1, "█", "0");
    } else if (Math.floor(lt * 3) % 2 === 0) g.set(12, H - 1, "█", "0");
    return g.frame();
  };
}
