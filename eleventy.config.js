module.exports = function (eleventyConfig) {
  // Pure passthrough scaffold — every currently published path is copied
  // byte-for-byte into _site. No templating happens in this task.

  eleventyConfig.addPassthroughCopy("teacher");
  eleventyConfig.addPassthroughCopy("creative-coding");
  eleventyConfig.addPassthroughCopy("sound");
  eleventyConfig.addPassthroughCopy("index.html");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("videos.json");
  eleventyConfig.addPassthroughCopy("config.json");
  eleventyConfig.addPassthroughCopy("LICENSE");
  eleventyConfig.addPassthroughCopy("README.md");

  // New-site assets that live under src/ (published at the same relative path).
  eleventyConfig.addPassthroughCopy("src/sound/css/*.css");
  eleventyConfig.addPassthroughCopy("src/sound/js/*.js");
  eleventyConfig.addPassthroughCopy("src/sound/fonts/*.woff2");
  eleventyConfig.addPassthroughCopy("src/sound/img/posters/*.webp");
  eleventyConfig.addPassthroughCopy("src/sound/audio/**/*.mp3");

  // GitHub Pages must not run its own Jekyll build over Eleventy's output.
  eleventyConfig.addPassthroughCopy(".nojekyll");

  // True when the build contains a page with exactly this URL. A page with
  // `permalink: false` has url === false, so it never matches. service-card.njk
  // uses this to switch a card's link on as soon as its page exists.
  eleventyConfig.addFilter("pageExists", (allPages, url) => allPages.some((p) => p.url === url));

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};
