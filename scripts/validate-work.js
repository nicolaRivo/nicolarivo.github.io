// Validates src/work/*.md (in sync with videos.json) and src/_data/services.json.
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

// ── Services (src/_data/services.json) ──────────────────────────────────────
// Same rules as above: report only, never a non-zero exit. `turnaround` and
// `price_from` are Nico's to set; while they are "TODO" they are counted as
// TODO fields, not reported as problems.

const SERVICES = path.join(ROOT, "src", "_data", "services.json");
const SERVICE_SLUGS = ["dialogue-editing", "podcast-editing", "sound-design"];
const SERVICE_KEYS = [
  "slug", "name", "pitch", "pain_points", "includes", "turnaround",
  "price_from", "faqs", "related_roles",
];
const ROLE_VOCAB = [
  "dialogue-edit", "cleanup", "adr", "foley", "sound-design", "mix",
  "composition", "field-recording",
];
// Agency language and the live page's claims, which the copy must not use.
const BANNED_COPY = [
  "immersive", "sonic experience", "crafting", "elevate", "seamless",
  "world-class", "bespoke", "passionate", "cutting-edge", "unlock",
];

const serviceProblems = [];
const serviceProblem = (msg) => serviceProblems.push(msg);

// Every path (dot/bracket notation) whose string value still contains "TODO".
function todoPaths(value, prefix) {
  if (typeof value === "string") return value.includes("TODO") ? [prefix || "(value)"] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => todoPaths(v, `${prefix}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => todoPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

// All string values in an entry, for the copy scan.
function allStrings(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(allStrings);
  return [];
}

function isSentenceList(value, min) {
  return Array.isArray(value) && value.length >= min
    && value.every((v) => typeof v === "string" && v.trim() !== "");
}

let services = [];
try {
  services = JSON.parse(fs.readFileSync(SERVICES, "utf8"));
  if (!Array.isArray(services)) throw new Error("not an array");
} catch (e) {
  serviceProblem(`services.json could not be read as an array: ${e.message}`);
  services = [];
}

if (services.length !== SERVICE_SLUGS.length) {
  serviceProblem(`services.json has ${services.length} entries, expected ${SERVICE_SLUGS.length}`);
}
const slugs = services.map((s) => s.slug);
if (services.length === SERVICE_SLUGS.length && slugs.join(",") !== SERVICE_SLUGS.join(",")) {
  serviceProblem(`services.json entries are ${slugs.join(", ")}; expected ${SERVICE_SLUGS.join(", ")}`);
}

for (const [i, service] of services.entries()) {
  const where = service.slug || `entry ${i + 1}`;

  const missing = SERVICE_KEYS.filter((k) => !(k in service));
  for (const key of missing) serviceProblem(`${where}: missing key '${key}'`);
  if (missing.length === 0) {
    const order = Object.keys(service).filter((k) => SERVICE_KEYS.includes(k));
    if (order.join(",") !== SERVICE_KEYS.join(",")) {
      serviceProblem(`${where}: keys out of order: ${order.join(", ")}`);
    }
  }

  for (const key of ["name", "pitch"]) {
    if (typeof service[key] !== "string" || service[key].trim() === "") {
      serviceProblem(`${where}: '${key}' is missing or empty`);
    }
  }
  if (!isSentenceList(service.pain_points, 2)) {
    serviceProblem(`${where}: 'pain_points' must be at least two non-empty strings`);
  }
  if (!isSentenceList(service.includes, 1)) {
    serviceProblem(`${where}: 'includes' must be at least one non-empty string`);
  }
  for (const key of ["turnaround", "price_from"]) {
    if (typeof service[key] !== "string" || service[key].trim() === "") {
      serviceProblem(`${where}: '${key}' is missing or empty (use the literal "TODO")`);
    }
  }

  if (!Array.isArray(service.faqs) || service.faqs.length < 3 || service.faqs.length > 4) {
    serviceProblem(`${where}: 'faqs' must be an array of 3 or 4 entries`);
  } else {
    service.faqs.forEach((faq, j) => {
      for (const key of ["q", "a"]) {
        if (!faq || typeof faq[key] !== "string" || faq[key].trim() === "") {
          serviceProblem(`${where}: faq ${j + 1} is missing a non-empty '${key}'`);
        }
      }
    });
  }

  if (!Array.isArray(service.related_roles) || service.related_roles.length === 0) {
    serviceProblem(`${where}: 'related_roles' must be a non-empty array`);
  } else {
    for (const role of service.related_roles) {
      if (!ROLE_VOCAB.includes(role)) serviceProblem(`${where}: related_roles has '${role}', not in the credit roles vocabulary`);
    }
  }

  const banned = BANNED_COPY.filter((phrase) =>
    allStrings(service).some((s) => s.toLowerCase().includes(phrase)));
  if (banned.length) serviceProblem(`${where}: copy uses banned wording: ${banned.join(", ")}`);
}

const serviceTodo = services
  .map((service) => ({ where: service.slug || "(no slug)", fields: todoPaths(service, "") }))
  .filter((e) => e.fields.length > 0);
const serviceTodoCount = serviceTodo.reduce((n, e) => n + e.fields.length, 0);

console.log(`work files:        ${files.length}`);
console.log(`videos.json:       ${videos.length} entries`);
console.log(`files with TODO:   ${todoFiles} of ${files.length} (${todoFields} TODO fields)`);
console.log(`sync with videos.json: ${syncProblems === 0 ? "OK" : `${syncProblems} problem(s)`}`);
console.log(`validation problems:   ${problems.length - syncProblems}`);
for (const p of problems) console.log(`  - ${p}`);

console.log(`services.json:     ${services.length} entries${slugs.length ? ` (${slugs.join(", ")})` : ""}`);
if (serviceTodo.length) {
  console.log(`services TODO:     ${serviceTodoCount} fields in ${serviceTodo.length} of ${services.length} entries`);
  for (const entry of serviceTodo) console.log(`  ${entry.where}: ${entry.fields.join(", ")}`);
} else if (services.length) {
  console.log(`services TODO:     none`);
}
console.log(`services problems: ${serviceProblems.length}`);
for (const p of serviceProblems) console.log(`  - ${p}`);

// Deliberately exit 0 for now; see header comment.
process.exit(0);
