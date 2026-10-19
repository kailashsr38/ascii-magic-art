#!/usr/bin/env node
/*
 * validate.mjs: every piece must pass before it ships.
 *   node scripts/validate.mjs            all pieces
 *   node scripts/validate.mjs a b c      only these slugs
 * Checks: meta shape, slug = filename, exact cols x rows on every frame,
 * colour layer the same shape and every key in meta.palette, no throws over
 * 6 seconds of time, frames actually change (it animates), and the average
 * frame costs under 12 ms in Node.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "pieces");
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "categories.json"), "utf8")).map((c) => c.id);
const want = process.argv.slice(2);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".js")).filter((f) => !want.length || want.includes(f.slice(0, -3)));

// Characters that are one cell wide in every common monospace font.
const EXTRA = "·•●○◦■□▪▫◆◇▲△▼▽◀▶►◄≈≡°✓✗♥×÷±→←↑↓↗↘↙↖⟋⟍";
const okChar = (c) => {
  const n = c.codePointAt(0);
  return (n >= 32 && n <= 126) || (n >= 0x2500 && n <= 0x259f) || (n >= 0x2800 && n <= 0x28ff) || EXTRA.includes(c);
};
let bad = 0;
const seen = new Map();
for (const f of files.sort()) {
  const slug = f.slice(0, -3);
  const errs = [];
  try {
    const mod = await import(pathToFileURL(path.join(DIR, f)).href + "?v=" + Date.now());
    const m = mod.meta;
    if (!m) throw new Error("no exported meta");
    if (m.slug !== slug) errs.push(`meta.slug "${m.slug}" must equal filename "${slug}"`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errs.push("slug must be kebab-case a-z0-9");
    for (const k of ["name", "category", "note", "cols", "rows", "fps"]) if (m[k] === undefined) errs.push(`meta.${k} missing`);
    if (!CATEGORIES.includes(m.category)) errs.push(`unknown category "${m.category}"`);
    if (!Array.isArray(m.tags) || m.tags.length < 2) errs.push("meta.tags needs 2+ entries");
    const [mc, mr] = m.cell === "square" ? [240, 120] : [140, 60];
    if (m.cols < 16 || m.cols > mc || m.rows < 3 || m.rows > mr) errs.push(`size ${m.cols}x${m.rows} out of range (16-${mc} x 3-${mr})`);
    if (m.fps < 1 || m.fps > 60) errs.push("fps 1-60");
    if (/—/.test(m.note + m.name)) errs.push("no em dashes in copy");
    if (seen.has(m.name.toLowerCase())) errs.push(`duplicate name with ${seen.get(m.name.toLowerCase())}`);
    seen.set(m.name.toLowerCase(), slug);
    const draw = mod.default();
    if (typeof draw !== "function") throw new Error("default export must return a draw(t) function");
    const frames = [];
    let ms = 0, n = 0;
    for (let t = 0; t <= 6; t += 0.25) {
      const t0 = performance.now();
      const fr = draw(t);
      ms += performance.now() - t0; n++;
      const text = typeof fr === "string" ? fr : fr && fr.text;
      if (typeof text !== "string") { errs.push(`t=${t}: frame is not a string or {text,color}`); break; }
      const lines = text.split("\n");
      if (lines.length !== m.rows) { errs.push(`t=${t}: ${lines.length} rows, want ${m.rows}`); break; }
      const wrong = lines.findIndex((l) => [...l].length !== m.cols);
      if (wrong >= 0) { errs.push(`t=${t}: row ${wrong} is ${[...lines[wrong]].length} wide, want ${m.cols}`); break; }
      if (typeof fr === "object") {
        if (!m.palette) { errs.push("colour frame but no meta.palette"); break; }
        const cl = fr.color.split("\n");
        if (cl.length !== m.rows || cl.some((l) => [...l].length !== m.cols)) { errs.push(`t=${t}: colour layer shape differs`); break; }
        const keys = new Set(fr.color.replace(/[\n ]/g, ""));
        const missing = [...keys].filter((k) => !m.palette[k]);
        if (missing.length) { errs.push(`t=${t}: colour keys not in palette: ${missing.join("")}`); break; }
      }
      const odd = [...new Set([...text.replace(/\n/g, "")].filter((c) => !okChar(c)))];
      if (odd.length) { errs.push(`t=${t}: characters not safe for monospace: ${odd.join(" ")}`); break; }
      frames.push(text);
    }
    if (!errs.length) {
      if (new Set(frames).size < 3 && !m.still) errs.push("frames barely change: it should animate (or set meta.still = true)");
      const blank = frames[0].replace(/\s/g, "").length / (m.cols * m.rows);
      if (blank < 0.02) errs.push(`first frame is ${(blank * 100).toFixed(1)}% ink: nearly empty`);
      const avg = ms / n;
      if (avg > 12) errs.push(`slow: ${avg.toFixed(1)} ms per frame (limit 12)`);
    }
  } catch (e) {
    errs.push("throws: " + (e && e.stack ? e.stack.split("\n").slice(0, 2).join(" ") : e));
  }
  if (errs.length) { bad++; console.log(`FAIL ${slug}\n  - ` + errs.join("\n  - ")); }
  else if (want.length) console.log(`ok   ${slug}`);
}
console.log(`\n${files.length - bad}/${files.length} pieces pass`);
process.exit(bad ? 1 : 0);
