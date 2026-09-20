// Validates src/work/*.md and checks they stay in sync with videos.json.
// Node built-ins only. Reports and exits 0: it must not fail the build while
// TODOs are unresolved. It becomes a CI gate once the TODOs are filled in.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WORK_DIR = path.join(ROOT, "src", "work");
const VIDEOS = path.join(ROOT, "videos.json");
const POSTERS = path.join(ROOT, "src", "sound", "img", "posters");

const REQUIRED_KEYS = [
  "title", "slug", "year", "type", "legacy_category", "client", "roles",
  "services", "youtube_id", "audio_before", "audio_after", "featured",
  "order", "credit_line",
];

const problems = [];
const problem = (msg) => problems.push(msg);

// Minimal front-matter reader: flat `key: value` lines between two `---` fences.
function readFrontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):(?:\s+(.*)|\s*)$/);
    if (!kv) continue;
    let value = (kv[2] || "").trim();
    if (value.startsWith('"')) {
      try { value = JSON.parse(value); } catch { /* keep raw */ }
    }
    data[kv[1]] = value;
  }
  return data;
}

const files = fs.readdirSync(WORK_DIR).filter((f) => f.endsWith(".md")).sort();
const entries = [];
let todoFiles = 0;
let todoFields = 0;

for (const file of files) {
  const text = fs.readFileSync(path.join(WORK_DIR, file), "utf8");
  const fm = readFrontMatter(text);
  if (!fm) {
    problem(`${file}: no front matter found`);
    continue;
  }
  entries.push({ file, fm });

  for (const key of REQUIRED_KEYS) {
    if (!(key in fm)) problem(`${file}: missing front-matter key '${key}'`);
  }
  if (!fm.youtube_id) problem(`${file}: youtube_id is empty`);
  else if (!fs.existsSync(path.join(POSTERS, `${fm.youtube_id}.webp`))) {
    problem(`${file}: no local poster (run: npm run posters)`);
  }
  if (fm.slug !== path.basename(file, ".md")) {
    problem(`${file}: slug '${fm.slug}' does not match the filename`);
  }

  if (text.includes("TODO")) todoFiles++;
  todoFields += Object.values(fm).filter((v) => v.includes("TODO")).length;
}

// order must be unique
const byOrder = new Map();
for (const { file, fm } of entries) {
  if (!/^\d+$/.test(fm.order || "")) {
    problem(`${file}: order '${fm.order}' is not an integer`);
    continue;
  }
  if (!byOrder.has(fm.order)) byOrder.set(fm.order, []);
  byOrder.get(fm.order).push(file);
}
for (const [order, list] of byOrder) {
  if (list.length > 1) problem(`order ${order} is used by more than one file: ${list.join(", ")}`);
}

// sync with videos.json, matching on youtube_id
let videos = [];
try {
  videos = JSON.parse(fs.readFileSync(VIDEOS, "utf8"));
  if (!Array.isArray(videos)) throw new Error("not an array");
} catch (e) {
  problem(`videos.json could not be read as an array: ${e.message}`);
}

const filesById = new Map();
for (const { file, fm } of entries) {
  if (!fm.youtube_id) continue;
  if (!filesById.has(fm.youtube_id)) filesById.set(fm.youtube_id, []);
  filesById.get(fm.youtube_id).push(file);
}
const videoCount = new Map();
for (const v of videos) videoCount.set(v.youtube, (videoCount.get(v.youtube) || 0) + 1);

for (const [id, n] of videoCount) {
  const matches = filesById.get(id) || [];
  if (n > 1) problem(`sync: youtube id '${id}' appears ${n} times in videos.json`);
  if (matches.length === 0) problem(`sync: videos.json entry '${id}' has no file in src/work/`);
  if (matches.length > 1) problem(`sync: videos.json entry '${id}' has ${matches.length} files: ${matches.join(", ")}`);
}
for (const [id, matches] of filesById) {
  if (!videoCount.has(id)) problem(`sync: ${matches.join(", ")} has youtube_id '${id}' with no entry in videos.json`);
}

const syncProblems = problems.filter((p) => p.startsWith("sync:") || p.startsWith("videos.json")).length;

console.log(`work files:        ${files.length}`);
console.log(`videos.json:       ${videos.length} entries`);
console.log(`files with TODO:   ${todoFiles} of ${files.length} (${todoFields} TODO fields)`);
console.log(`sync with videos.json: ${syncProblems === 0 ? "OK" : `${syncProblems} problem(s)`}`);
console.log(`validation problems:   ${problems.length - syncProblems}`);
for (const p of problems) console.log(`  - ${p}`);

// Deliberately exit 0 for now; see header comment.
process.exit(0);
