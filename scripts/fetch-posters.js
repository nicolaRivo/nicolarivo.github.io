// Downloads each credit's YouTube poster and stores it as a WebP sized for the
// grid, in src/sound/img/posters/<youtube_id>.webp. Run on demand:
//
//   npm run posters              regenerate every poster
//   npm run posters -- --missing only fetch posters that do not exist yet
//
// It is NOT part of the build: the site builds offline from the committed files.
// On any failure the last committed poster is kept. Exit code is 1 only when a
// credit ends up with no poster at all.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const WORK_DIR = path.join(ROOT, "src", "work");
const OUT_DIR = path.join(ROOT, "src", "sound", "img", "posters");

const HOST = "https://i.ytimg.com/vi";
// Best first. maxresdefault is 16:9; sddefault / hqdefault are 4:3 frames with
// black bars above and below a 16:9 picture.
const VARIANTS = ["maxresdefault", "sddefault", "hqdefault"];
const OUT_WIDTH = 640; // grid columns are at most ~570 CSS px wide
const PLACEHOLDER_MAX_WIDTH = 120; // what YouTube serves for a missing variant
const CONCURRENCY = 4;
const onlyMissing = process.argv.includes("--missing");

function youtubeIds() {
  return fs.readdirSync(WORK_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const m = fs.readFileSync(path.join(WORK_DIR, f), "utf8").match(/^youtube_id:\s*"?([^"\r\n]+?)"?\s*$/m);
      if (!m) throw new Error(`${f}: no youtube_id`);
      return m[1];
    });
}

async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function toWebp(buf) {
  const meta = await sharp(buf).metadata();
  if (!meta.width || meta.width <= PLACEHOLDER_MAX_WIDTH) return null; // missing variant
  let img = sharp(buf);
  // A 4:3 frame carries the picture in its central 16:9: drop the black bars.
  if (Math.abs(meta.height / meta.width - 0.75) < 0.02) {
    const h = Math.round((meta.width * 9) / 16);
    img = img.extract({ left: 0, top: Math.round((meta.height - h) / 2), width: meta.width, height: h });
  }
  const out = await img
    .resize({ width: Math.min(OUT_WIDTH, meta.width), withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toBuffer({ resolveWithObject: true });
  return { data: out.data, width: out.info.width, height: out.info.height };
}

async function fetchPoster(id) {
  const dest = path.join(OUT_DIR, `${id}.webp`);
  const had = fs.existsSync(dest);
  if (onlyMissing && had) return { id, status: "skipped (exists)" };

  const errors = [];
  for (const variant of VARIANTS) {
    try {
      const buf = await download(`${HOST}/${id}/${variant}.jpg`);
      if (!buf) { errors.push(`${variant}: not available`); continue; }
      const webp = await toWebp(buf);
      if (!webp) { errors.push(`${variant}: placeholder`); continue; }
      fs.writeFileSync(dest, webp.data);
      return { id, status: "ok", variant, size: webp.data.length, dims: `${webp.width}x${webp.height}` };
    } catch (e) {
      errors.push(`${variant}: ${e.message}`);
    }
  }
  return { id, status: had ? "kept existing" : "MISSING", errors };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const ids = youtubeIds();
  const results = [];
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    results.push(...(await Promise.all(ids.slice(i, i + CONCURRENCY).map(fetchPoster))));
  }
  for (const r of results) {
    const detail = r.variant ? `${r.variant} -> ${r.dims}, ${(r.size / 1024).toFixed(1)} KB` : (r.errors || []).join("; ");
    console.log(`${r.id.padEnd(12)} ${r.status}${detail ? "  " + detail : ""}`);
  }
  const missing = results.filter((r) => r.status === "MISSING");
  const kept = results.filter((r) => r.status === "kept existing");
  console.log(`\n${results.length} credits: ${results.filter((r) => r.status === "ok").length} fetched, ${kept.length} kept existing, ${missing.length} missing`);
  process.exit(missing.length ? 1 : 0);
})();
