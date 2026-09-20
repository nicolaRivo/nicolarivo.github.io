# CLAUDE.md — guardrails

This is a guardrails file, not documentation.

## State
- `/sound` is mid-rebuild with Eleventy, on the branch `rebuild/sound`.
- The plan does not live in this repo. The current task always arrives from Nico as a written task file.
- **Never propose a plan of your own, never widen scope. If the work seems to call for something outside the task, stop and report instead of doing it.**

## Never do
- `/teacher` and `/creative-coding` must never be modified. The CI invariants protecting them must never be relaxed, weakened or removed, for any reason.
- Those two sections have known bugs (broken links, misnamed sketch folders, absolute URLs, a leftover placeholder). They are recorded and deliberately deferred to a separate project after cutover. **Do not fix them.**
- `/creative-coding` will eventually be retired in favour of a separate site. Invest no effort in it.
- Do not modify `videos.json` while the live page still fetches it at runtime.
- The admin panel in `sound/index.html` is being removed. Do not extend, refactor, isolate or preserve it in any form.
- Do not change the Pages deploy source. Do not add a deploy job to CI.
- `~/Developer/node-l-soup` is a different project in a different repo. Never touch it from here.
- No secrets in the repo, ever.
- Never edit or regenerate `baseline-manifest.txt` to make CI pass. If the manifest check fails, a published file changed: fix that file, not the manifest.
- The live palette source is the inline `<style>` of `sound/index.html` plus the `dusk` theme. `sound/css/portfolio.css` is a dead orphan that no page loads. Never derive design tokens from it.
- Requirement for the credit pages (not built yet): a `redesign-demo` credit's page must state in full that it is a sound redesign exercise on existing footage, not a commissioned credit. The card badge says only "Sound redesign (demo)".
- `/sound/component-test/` and its placeholder audio (`src/sound/audio/placeholder/`) are for review only and are removed in the cleanup task.
