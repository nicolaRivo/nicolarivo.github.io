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

  // GitHub Pages must not run its own Jekyll build over Eleventy's output.
  eleventyConfig.addPassthroughCopy(".nojekyll");

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};
