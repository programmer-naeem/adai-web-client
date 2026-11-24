import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const roots = ["src/components", "src/features", "src/app"];
const letter = /[A-Za-z\u0980-\u09FF]/;
const bengali = /[\u0980-\u09FF]/;
const codeToken = /[()[\]{};=<`]/;

function looksLikeCopy(text) {
  if (!text || !letter.test(text) || codeToken.test(text)) return false;
  return true;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.includes(".test.")) out.push(full);
  }
  return out;
}

function strip(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/.*$/gm, "$1");
}

/** User-visible copy must live in messages/bn.json and messages/en.json. */
export function findHardcodedStrings(cwd = process.cwd()) {
  const hits = [];
  for (const file of roots.flatMap((root) => walk(path.join(cwd, root)))) {
    const lines = strip(fs.readFileSync(file, "utf8")).split("\n");
    lines.forEach((line, index) => {
      if (/^\s*import\s/.test(line)) return;
      const report = (text) => {
        const trimmed = text.trim();
        if (!looksLikeCopy(trimmed)) return;
        hits.push({ file: path.relative(cwd, file), line: index + 1, text: trimmed.slice(0, 120) });
      };
      for (const match of line.matchAll(/[^-=]>([^<>{}]+)</g)) report(match[1]);
      for (const match of line.matchAll(/\b(?:aria-label|placeholder|title|alt)=["']([^"']+)["']/g)) report(match[1]);
      for (const match of line.matchAll(/["'`]([^"'`\\]*)["'`]/g)) {
        if (bengali.test(match[1])) report(match[1]);
      }
    });
  }
  return hits;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invoked) {
  const hits = findHardcodedStrings(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
  if (hits.length > 0) {
    for (const hit of hits) console.error(`${hit.file}:${hit.line}: ${hit.text}`);
    console.error(`\n${hits.length} hard-coded user-visible string(s). Move them to messages/bn.json and messages/en.json.`);
    process.exit(1);
  }
}
