#!/usr/bin/env node
/*
 * ascii-magic-art in the terminal.
 *   npx ascii-magic-art                         browse every piece live; enter copies a prompt
 *                                               that adds the piece to your project
 *   npx ascii-magic-art prompt [piece]          print (and copy) that prompt directly
 *   npx ascii-magic-art moonlit-sea             play one piece
 *   npx ascii-magic-art --list
 *   npx ascii-magic-art moonlit-sea --look=dots     (dots, ascii, numbers, binary...)
 *   npx ascii-magic-art moonlit-sea --chars=" .oO@" (your own characters)
 *   npx ascii-magic-art moonlit-sea --seconds=3     (stop on its own, for shell startup)
 *   npx ascii-magic-art moonlit-sea --frame         (print one still frame and exit, for a MOTD)
 * Press any key (or Ctrl+C) to stop a piece.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { withLook, restyle, LOOKS } from "../runtime/glyphs.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "pieces");
const SITE = "https://www.ascii-magic.com";
const CMD = "npx ascii-magic-art";

const argv = process.argv.slice(2);
const flags = Object.fromEntries(argv.filter((a) => a.startsWith("--")).map((a) => { const [k, ...v] = a.slice(2).split("="); return [k, v.join("=") || true]; }));
const args = argv.filter((a) => !a.startsWith("-"));
const slugs = fs.readdirSync(DIR).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3)).sort();
const out = process.stdout;
const color = (out.isTTY || !!flags.color) && process.env.NO_COLOR === undefined;
// 24-bit colour only where the terminal supports it. macOS Terminal.app does not: it reads the
// numbers inside a 24-bit code as separate commands (46 = cyan background...), which garbles
// the art. Everything else gets the nearest of the 256 standard colours.
const env = process.env;
const truecolor = flags.truecolor || /truecolor|24bit/i.test(env.COLORTERM || "") || env.FORCE_COLOR === "3" || !!env.WT_SESSION ||
  (env.TERM_PROGRAM !== "Apple_Terminal" && /iTerm|WezTerm|vscode|ghostty|Hyper|Tabby|WarpTerminal|rio/i.test(env.TERM_PROGRAM || ""));
// Nearest of the 240 standard colours (6x6x6 cube + 24 greys) by "redmean" distance, which
// weights the channels the way eyes do; cached, since a piece uses a few dozen colours.
const XLV = [0, 95, 135, 175, 215, 255], X256 = [];
for (let n = 16; n < 256; n++) X256.push([n, ...(n >= 232 ? [8 + (n - 232) * 10, 8 + (n - 232) * 10, 8 + (n - 232) * 10] : [XLV[Math.floor((n - 16) / 36)], XLV[Math.floor((n - 16) / 6) % 6], XLV[(n - 16) % 6]])]);
const near = new Map();
function to256(r, g, b) {
  const key = (r << 16) | (g << 8) | b;
  let best = near.get(key);
  if (best !== undefined) return best;
  let bd = Infinity;
  for (const [n, R, G, B] of X256) {
    const rm = (r + R) / 2, d = (2 + rm / 256) * (r - R) ** 2 + 4 * (g - G) ** 2 + (2 + (255 - rm) / 256) * (b - B) ** 2;
    if (d < bd) { bd = d; best = n; }
  }
  near.set(key, best);
  return best;
}
const fgc = ([r, g, b]) => (truecolor ? `\x1b[38;2;${r};${g};${b}m` : `\x1b[38;5;${to256(r, g, b)}m`);
const bgc = ([r, g, b]) => (truecolor ? `\x1b[48;2;${r};${g};${b}m` : `\x1b[48;5;${to256(r, g, b)}m`);
const interactive = out.isTTY && process.stdin.isTTY;
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const paint = (hex, s) => (color ? `${fgc(rgb(hex))}${s}\x1b[0m` : s);
const dim = (s) => (color ? `\x1b[2m${s}\x1b[22m` : s);
const bold = (s) => (color ? `\x1b[1m${s}\x1b[22m` : s);

if (flags.look && !LOOKS[flags.look]) { console.error(`No look "${flags.look}". Try: ${Object.keys(LOOKS).join(", ")}`); process.exit(1); }
const lookOpts = { look: flags.look, chars: flags.chars, mono: !!flags.mono, all: !!flags.all };
const restyled = !!(flags.look || flags.chars);

/* ── the one prompt ─────────────────────────────────────────────────────── */
function promptFor(slug, name, picked) {
  const lk = picked ? picked.look : flags.look, all = picked ? picked.all : flags.all;
  const look = (lk && lk !== "original" ? ` look="${lk}"` : "") + (lk && lk !== "original" && all ? " all" : "");
  if (!slug) return `Add an animated ASCII art piece from ASCII Magic to this project.

1. Read ${SITE}/ascii/index.json (634 pieces) and pick the one that fits this project best.
2. Load the script once, in the browser only (in SSR frameworks such as Next.js, load it on the client):
   <script type="module" src="${SITE}/ascii/ascii.js"></script>
3. Put the piece where it fits best, such as the hero, a loading state, an empty state or the 404 page:
   <ascii-art piece="PIECE"${look}></ascii-art>
4. Keep a real heading or text next to it (the art is decoration), and size it with the size attribute or CSS.

Rules for coding agents: ${SITE}/ascii/use/ai-coding-agents`;
  return `Add the animated ASCII art piece "${slug}" (${name}) from ASCII Magic to this project.

1. Load the script once, in the browser only (in SSR frameworks such as Next.js, load it on the client):
   <script type="module" src="${SITE}/ascii/ascii.js"></script>
2. Put the piece where it fits best, such as the hero, a loading state, an empty state or the 404 page:
   <ascii-art piece="${slug}"${look}></ascii-art>
3. Keep a real heading or text next to it (the art is decoration), and size it with the size attribute or CSS.

Preview and options: ${SITE}/ascii/${slug}
Rules for coding agents: ${SITE}/ascii/use/ai-coding-agents`;
}

function copy(text) {
  const tries = process.platform === "darwin" ? [["pbcopy"]]
    : process.platform === "win32" ? [["clip"]]
    : [["wl-copy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"], ["clip.exe"]];
  for (const [cmd, ...a] of tries) {
    try { if (spawnSync(cmd, a, { input: text, stdio: ["pipe", "ignore", "ignore"] }).status === 0) return true; } catch {}
  }
  return false;
}

function givePrompt(slug, name, picked) {
  const text = promptFor(slug, name, picked);
  const ok = copy(text);
  const rule = dim("─".repeat(Math.min(72, (out.columns || 80) - 4)));
  out.write(`\n  ${ok ? paint("#00f5a0", "✓ Prompt copied to your clipboard.") : bold("Copy this prompt:")} ${ok ? "Paste it into Claude Code, Cursor, Copilot or any coding agent." : "Paste it into your coding agent."}\n\n  ${rule}\n`);
  out.write(text.split("\n").map((l) => "  " + l).join("\n"));
  out.write(`\n  ${rule}\n\n`);
}

/* ── drawing ────────────────────────────────────────────────────────────── */
function colorRow(t, c, pal) {
  if (!color || !c) return t.join("");
  let s = "", key = null;
  for (let x = 0; x < t.length; x++) {
    if (c[x] !== key) { key = c[x]; const hex = key !== " " && pal?.[key]; s += hex ? fgc(rgb(hex)) : "\x1b[39m"; }
    s += t[x];
  }
  return s + "\x1b[0m";
}
// Square-cell pictures: two picture rows per terminal line with the upper half
// block, top pixel as the text colour and bottom pixel as the background. k > 1
// samples every k-th pixel so a big scene fits a small terminal.
const LEVEL = { "▁": 0.14, "▂": 0.26, "▃": 0.38, "▄": 0.51, "▅": 0.64, "▆": 0.76, "▇": 0.88, "█": 1 };
function halfBlocks(frame, pal, k = 1) {
  const T = frame.text.split("\n").map((r) => [...r]), C = frame.color.split("\n").map((r) => [...r]);
  const px = (y, x) => {
    const key = C[y] && C[y][x];
    if (!key || key === " " || !pal[key]) return [0, 0, 0];
    const f = Math.min(1, (LEVEL[T[y][x]] ?? 0.8) * 1.25);
    return rgb(pal[key]).map((v) => Math.round(v * f));
  };
  const lines = [];
  for (let y = 0; y < T.length; y += 2 * k) {
    let line = "";
    for (let x = 0; x < T[0].length; x += k) line += `${fgc(px(y, x))}${bgc(px(y + k, x))}▀`;
    lines.push(line + "\x1b[0m");
  }
  return lines;
}
// A frame as terminal lines, fitted into w x h (square pictures shrink, text pieces crop to the centre).
function fitLines(frame, meta, w = Infinity, h = Infinity, styled = restyled) {
  if (typeof frame === "string") frame = { text: frame, color: null };
  const pal = frame.palette || meta.palette;
  if (meta.cell === "square" && color && frame.color && !styled) {
    const k = Math.max(1, Math.ceil(meta.cols / w), Math.ceil(meta.rows / (2 * h)));
    return halfBlocks(frame, pal, k);
  }
  const T = frame.text.split("\n").map((r) => [...r]), C = frame.color ? frame.color.split("\n").map((r) => [...r]) : null;
  const rows = Math.min(T.length, h), cols = Math.min(T[0].length, w);
  const y0 = Math.floor((T.length - rows) / 2), x0 = Math.floor((T[0].length - cols) / 2);
  const lines = [];
  for (let y = y0; y < y0 + rows; y++) lines.push(colorRow(T[y].slice(x0, x0 + cols), C && C[y] && C[y].slice(x0, x0 + cols), pal));
  return lines;
}

async function load(slug) {
  const mod = await import(pathToFileURL(path.join(DIR, slug + ".js")).href);
  return { meta: mod.meta, raw: mod.default(), draw: withLook(mod.default(), mod.meta.palette, lookOpts) };
}

/* ── commands ───────────────────────────────────────────────────────────── */
const first = args[0];
if (flags.help || flags.h || first === "help") {
  out.write(`
  ${bold("ascii-magic-art")}  634 animated ASCII art pieces for web pages, READMEs and terminals

  ${CMD}                      browse them all live (s changes the look), enter copies a prompt for your coding agent
  ${CMD} prompt <piece>       print and copy that prompt
  ${CMD} <piece>              play one piece          ${dim("--look=dots  --chars=\" .oO@\"  --seconds=3  --frame  --color  --truecolor")}
  ${CMD} --list               every piece name

  Browse on the web: ${SITE}/ascii
`);
  process.exit(0);
}
if (flags.list || flags.l || first === "list") { console.log(slugs.join("\n")); process.exit(0); }
if (first === "prompt") {
  const slug = args[1];
  if (slug && !slugs.includes(slug)) { console.error(`No piece "${slug}". Try --list.`); process.exit(1); }
  givePrompt(slug, slug ? (await load(slug)).meta.name : null);
  process.exit(0);
}
if (first) await play(first);
else if (interactive) await browse();
else { out.write(promptFor(null) + "\n"); process.exit(0); }

/* ── play one piece ─────────────────────────────────────────────────────── */
async function play(slug) {
  if (!slugs.includes(slug)) { console.error(`No piece "${slug}". Try --list.`); process.exit(1); }
  const { meta, draw } = await load(slug);
  // In a terminal the piece is fitted to the window (pictures shrink, text pieces crop to the
  // centre); piped output (a MOTD file) keeps the full size.
  const box = () => (out.isTTY ? [Math.max(10, (out.columns || 80) - 1), Math.max(5, (out.rows || 24) - 1)] : [Infinity, Infinity]);
  if (flags.frame) { const [w, h] = box(); out.write(fitLines(draw(flags.t ? parseFloat(flags.t) : 1.5), meta, w, h).join("\n") + "\n"); process.exit(0); }
  // The alternate screen (like htop or vim): nothing scrolls, and the shell comes back as it was.
  const alt = !flags.keep;
  out.write((alt ? "\x1b[?1049h" : "") + "\x1b[?25l\x1b[2J");
  const t0 = Date.now();
  const frame = () => {
    const [w, h] = box(), lines = fitLines(draw((Date.now() - t0) / 1000), meta, w, h);
    const width = meta.cell === "square" && color && !restyled ? Math.ceil(meta.cols / Math.max(1, Math.ceil(meta.cols / w), Math.ceil(meta.rows / (2 * h)))) : Math.min(meta.cols, w);
    const padL = " ".repeat(Math.max(0, Math.floor(((out.columns || 80) - width) / 2))), padT = Math.max(0, Math.floor(((out.rows || 24) - lines.length) / 2));
    // no newline after the last line: a frame as tall as the window must not scroll it
    out.write("\x1b[H" + "\x1b[K\n".repeat(padT) + lines.map((l) => padL + l + "\x1b[K").join("\n") + "\x1b[0m\x1b[J");
  };
  frame();
  const timer = setInterval(frame, 1000 / meta.fps);
  out.on("resize", () => out.write("\x1b[2J"));
  const stop = (byKey) => {
    clearInterval(timer);
    out.write("\x1b[0m\x1b[?25h" + (alt ? "\x1b[?1049l" : "\n"));
    // a hint only when someone pressed a key, never at shell startup (--seconds)
    if (byKey && interactive && !flags.seconds) out.write(`  Add ${meta.name} to your project in one prompt:  ${bold(`${CMD} prompt ${slug}`)}\n`);
    process.exit(0);
  };
  process.on("SIGINT", () => stop(true));
  if (flags.seconds) setTimeout(() => stop(false), parseFloat(flags.seconds) * 1000);
  if (process.stdin.isTTY) { process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.on("data", () => stop(true)); }
}

/* ── browse everything ──────────────────────────────────────────────────── */
async function browse() {
  const cats = JSON.parse(fs.readFileSync(path.join(ROOT, "categories.json"), "utf8"));
  const catName = Object.fromEntries(cats.map((c) => [c.id, c.name]));
  const metas = await Promise.all(slugs.map((s) => import(pathToFileURL(path.join(DIR, s + ".js")).href).then((m) => m.meta)));
  const order = new Map(cats.map((c, i) => [c.id, i]));
  const list = metas.sort((a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99) || a.name.localeCompare(b.name));
  const FEATURED = ["matrix-rain", "spinning-torus", "sleeping-cat", "double-pendulum", "game-of-life", "heart-3d", "goldfish-tank", "falling-sand"];
  let i = list.findIndex((m) => m.slug === FEATURED[Math.floor(Math.random() * FEATURED.length)]);
  if (i < 0) i = 0;
  let cur = null, t0 = 0, timer = null, toast = "", toastUntil = 0, intro = true;
  // looks you can cycle with s / S while browsing; a redraws text and line art too
  const LOOK_KEYS = Object.keys(LOOKS);
  let li = Math.max(0, LOOK_KEYS.indexOf(flags.look || "original")), all = !!flags.all;
  const lookNow = () => LOOK_KEYS[li];
  const frameAt = (t) => { const raw = cur.raw(t), lk = lookNow(); return lk === "original" ? raw : restyle(raw, cur.meta.palette, { look: lk, all }); };

  const cleanup = () => { clearInterval(timer); out.write("\x1b[0m\x1b[?25h\x1b[?1049l"); try { process.stdin.setRawMode(false); } catch {} process.stdin.pause(); };
  const quit = () => { cleanup(); out.write(`  634 pieces to browse on the web: ${SITE}/ascii\n  Add one in one prompt:  ${bold(`${CMD} prompt <piece>`)}\n\n`); process.exit(0); };
  process.on("SIGINT", quit);
  out.write("\x1b[?1049h\x1b[?25l\x1b[2J");
  process.stdin.setRawMode(true); process.stdin.resume();

  // intro: the wordmark types in, then the one-prompt line
  const MARK = String.raw` █████╗ ███████╗ ██████╗██╗██╗    ███╗   ███╗ █████╗  ██████╗ ██╗ ██████╗
██╔══██╗██╔════╝██╔════╝██║██║    ████╗ ████║██╔══██╗██╔════╝ ██║██╔════╝
███████║███████╗██║     ██║██║    ██╔████╔██║███████║██║  ███╗██║██║
██╔══██║╚════██║██║     ██║██║    ██║╚██╔╝██║██╔══██║██║   ██║██║██║
██║  ██║███████║╚██████╗██║██║    ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║╚██████╗
╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝ ╚═════╝`.split("\n").map((r) => [...r]);
  const GRAD = [[0, 210, 255], [58, 123, 213], [0, 245, 160]];
  const grad = (u) => { const s = u * (GRAD.length - 1), j = Math.min(GRAD.length - 2, Math.floor(s)), f = s - j; return GRAD[j].map((v, q) => Math.round(v + (GRAD[j + 1][q] - v) * f)); };
  async function playIntro() {
    const W = out.columns || 80, H = out.rows || 24, mw = MARK[0].length;
    if (!color || W < mw + 4 || H < 14) { intro = false; return; }
    const pad = " ".repeat(Math.floor((W - mw) / 2)), top = Math.max(1, Math.floor((H - 12) / 2));
    const lines2 = [`${bold("634 animated ASCII pieces.")} Add one to your project in ${paint("#00f5a0", "one prompt")}.`, dim("Arrow keys to browse, s to change the look, enter to copy, paste into your coding agent.")];
    const plain2 = ["634 animated ASCII pieces. Add one to your project in one prompt.", "Arrow keys to browse, s to change the look, enter to copy, paste into your coding agent."];
    const start = Date.now();
    await new Promise((res) => {
      const tick = setInterval(() => {
        const t = (Date.now() - start) / 1000, reveal = Math.min(1, t / 0.9) * (mw + 6);
        if (!intro || t > 2.6) { clearInterval(tick); return res(); }
        let s = "\x1b[H" + "\n".repeat(top);
        for (const row of MARK) {
          let line = pad;
          for (let x = 0; x < row.length; x++) {
            if (x > reveal || row[x] === " ") { line += " "; continue; }
            const shine = Math.max(0, 1 - Math.abs(x - (t - 1) * 60) / 6);
            const c = grad(x / mw).map((v) => Math.round(v + (255 - v) * shine));
            line += `${fgc(c)}${row[x]}`;
          }
          s += line + "\x1b[0m\x1b[K\n";
        }
        s += "\n";
        if (t > 1) plain2.forEach((p, k) => (s += " ".repeat(Math.max(0, Math.floor((W - p.length) / 2))) + lines2[k] + "\x1b[K\n"));
        out.write(s);
      }, 1000 / 30);
    });
    intro = false;
    out.write("\x1b[2J");
  }

  async function open(k) {
    i = (k + list.length) % list.length;
    cur = await load(list[i].slug);
    t0 = Date.now();
    clearInterval(timer);
    out.write("\x1b[2J");
    timer = setInterval(frame, 1000 / Math.min(30, cur.meta.fps || 24));
    frame();
  }
  function frame() {
    if (!cur) return;
    const W = out.columns || 80, H = out.rows || 24, m = cur.meta;
    const styled = lookNow() !== "original";
    const lines = fitLines(frameAt((Date.now() - t0) / 1000), m, W - 2, H - 5, styled);
    const vis = m.cell === "square" && color && !styled ? Math.ceil(m.cols / Math.max(1, Math.ceil(m.cols / (W - 2)), Math.ceil(m.rows / (2 * (H - 5))))) : Math.min(m.cols, W - 2);
    const pad = " ".repeat(Math.max(0, Math.floor((W - vis) / 2)));
    const lookLabel = LOOKS[lookNow()].label + (all && lookNow() !== "original" ? " + text" : "");
    const head = `  ${paint("#00d2ff", "ASCII")} ${paint("#00f5a0", "MAGIC")}   ${bold(m.name)}  ${dim(`${catName[m.category] || m.category}  ·  ${i + 1}/${list.length}`)}   ${dim("look")} ${paint("#00f5a0", lookLabel)}`;
    const keys = [["← →", "browse"], ["↑ ↓", "category"], ["s", "look"], ["a", "text too"], ["enter", "copy the prompt"], ["c", "copy as text"], ["q", "quit"]].map(([k, v]) => `${bold(k)} ${dim(v)}`).join("   ");
    const foot = Date.now() < toastUntil ? `  ${paint("#00f5a0", toast)}` : `  ${keys}`;
    const gap = Math.max(0, H - 4 - lines.length), above = Math.floor(gap / 2);
    out.write("\x1b[H" + head + "\x1b[K\n\x1b[K\n" + "\x1b[K\n".repeat(above) + lines.map((l) => pad + l + "\x1b[K").join("\n") + "\n" + "\x1b[K\n".repeat(gap - above) + foot + "\x1b[K");
  }
  function jumpCategory(dir) {
    const c = list[i].category;
    let k = i;
    if (dir > 0) { while (list[k % list.length].category === c && k < i + list.length) k++; }
    else {
      k = i; while (list[(k + list.length) % list.length].category === c && k > i - list.length) k--;
      const pc = list[(k + list.length) % list.length].category; while (list[(k - 1 + list.length) % list.length].category === pc) k--;
    }
    open(k);
  }
  process.stdin.on("data", (d) => {
    const key = d.toString();
    if (intro) { intro = false; return; }
    if (key === "q" || key === "\x03" || key === "\x1b") return quit();
    if (key === "\x1b[C" || key === "l" || key === " ") return open(i + 1);
    if (key === "\x1b[D" || key === "h") return open(i - 1);
    if (key === "\x1b[B" || key === "j") return jumpCategory(1);
    if (key === "\x1b[A" || key === "k") return jumpCategory(-1);
    if (key === "s" || key === "S") { li = (li + (key === "s" ? 1 : LOOK_KEYS.length - 1)) % LOOK_KEYS.length; out.write("\x1b[2J"); return frame(); }
    if (key === "a") { all = !all; out.write("\x1b[2J"); return frame(); }
    if (key === "c") {
      const f = frameAt((Date.now() - t0) / 1000);
      toast = copy(typeof f === "string" ? f : f.text) ? `✓ Copied this frame of ${cur.meta.name} as text` : "Could not reach the clipboard on this system";
      toastUntil = Date.now() + 1800; return;
    }
    if (key === "\r" || key === "\n") { cleanup(); givePrompt(list[i].slug, list[i].name, { look: lookNow(), all }); process.exit(0); }
  });
  out.on("resize", () => out.write("\x1b[2J"));
  await playIntro();
  await open(i);
}
