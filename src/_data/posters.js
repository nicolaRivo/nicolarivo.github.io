// Which credits have a committed local poster: { "<youtube_id>": true }.
// Read from disk at build time; no network. Regenerate with `npm run posters`.
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "sound", "img", "posters");

module.exports = () =>
  fs.existsSync(DIR)
    ? Object.fromEntries(fs.readdirSync(DIR).filter((f) => f.endsWith(".webp")).map((f) => [f.slice(0, -5), true]))
    : {};
