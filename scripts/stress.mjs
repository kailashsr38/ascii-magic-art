#!/usr/bin/env node
/*
 * stress.mjs: find broken layouts. Every piece is rendered at many moments
 * (0..60 s) and each frame is checked for:
 *   box   a box (corner to corner) whose side or bottom edge is overwritten,
 *         e.g. text running out of a toast or a card
 *   edge  text touching the frame edge where the piece draws a border
 *   jump  frame size changing (rows/cols)
 *   throw an exception at some t
 * Usage: node scripts/stress.mjs [slugs...] [--json]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2), json = args.includes("--json");
let slugs = args.filter((a) => !a.startsWith("--"));
if (!slugs.length) slugs = fs.readdirSync(path.join(LIB, "pieces")).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3)).sort();

const TL = "┌╭╔┏", TR = "┐╮╗┓", BL = "└╰╚┗", BR = "┘╯╝┛";
const H = "─━═┄┅┈┉╌╍┬┴┼┯┷┳┻╤╧╦╩╪╫╬┿╋╀╁╂╃╄╅╆╇╈╉╊├┤╞╡╟╢╠╣┠┨┝┥╴╶╸╺";
const V = "│┃║┆┇┊┋╎╏├┤┼╞╡╟╢╠╣┠┨┝┥╪╫╬┿╋╂┬┴╤╧╦╩╵╷╹╻";
const isV = (c) => V.includes(c) || TL.includes(c) || TR.includes(c) || BL.includes(c) || BR.includes(c);
const isH = (c) => H.includes(c) || TL.includes(c) || TR.includes(c) || BL.includes(c) || BR.includes(c);

/** Boxes in a frame: top-left corner, run right along a top edge to a top-right corner, down to a bottom edge. */
function boxes(R) {
  const out = [];
  for (let y = 0; y < R.length; y++) for (let x = 0; x < R[y].length; x++) {
    if (!TL.includes(R[y][x])) continue;
    let x2 = x + 1; while (x2 < R[y].length && isH(R[y][x2]) && !TR.includes(R[y][x2])) x2++;
    if (x2 >= R[y].length || !TR.includes(R[y][x2]) || x2 - x < 3) continue;
    let y2 = y + 1; while (y2 < R.length && !BL.includes(R[y2][x]) && isV(R[y2][x])) y2++;
    if (y2 >= R.length || !BL.includes(R[y2][x])) continue;
    out.push([x, y, x2, y2]);
  }
  return out;
}

function check(frameText) {
  const R = frameText.split("\n").map((r) => [...r]), issues = [];
  for (const [x1, y1, x2, y2] of boxes(R)) {
    for (let y = y1 + 1; y < y2; y++) {
      const c = R[y][x2];
      if (!isV(c)) { issues.push(`box ${x1},${y1}-${x2},${y2}: right edge broken at row ${y} by "${c}" | ${R[y].slice(Math.max(0, x2 - 24), x2 + 4).join("")}`); break; }
    }
    for (let x = x1 + 1; x < x2; x++) {
      const c = R[y2][x];
      if (!isH(c) && c !== " ") { issues.push(`box ${x1},${y1}-${x2},${y2}: bottom edge broken at col ${x} by "${c}"`); break; }
    }
  }
  return issues;
}

const report = [];
for (const slug of slugs) {
  let mod;
  try { mod = await import(pathToFileURL(path.join(LIB, "pieces", slug + ".js")).href); } catch (e) { report.push({ slug, issues: ["import: " + e.message] }); continue; }
  if (mod.meta.cell === "square") continue; // picture scenes have no text layout
  const draw = mod.default(), seen = new Map();
  let W = null, Hh = null;
  for (let i = 0; i <= 240; i++) {
    const t = i * 0.25;
    let f; try { f = draw(t); } catch (e) { seen.set("throw " + e.message, t); break; }
    const txt = typeof f === "string" ? f : f.text, rows = txt.split("\n");
    if (W === null) { W = [...rows[0]].length; Hh = rows.length; }
    else if (rows.length !== Hh || rows.some((r) => [...r].length !== W)) seen.set("jump: frame size changes", t);
    for (const iss of check(txt)) { const k = iss.replace(/ at (row|col) \d+.*$/, ""); if (!seen.has(k)) seen.set(k, `t=${t}: ${iss}`); }
  }
  if (seen.size) report.push({ slug, category: mod.meta.category, issues: [...seen.values()].map(String).slice(0, 6) });
}
if (json) console.log(JSON.stringify(report, null, 1));
else {
  for (const r of report) console.log(`\n${r.slug} (${r.category})\n  ` + r.issues.join("\n  "));
  console.log(`\n${report.length} pieces with issues out of ${slugs.length}`);
}
