## Pretext

Pure JavaScript/TypeScript library (`@chenglou/pretext`, v0.0.2) for multiline text measurement & layout without DOM reflows. Uses canvas `measureText()` for segment widths and implements its own line-breaking engine. Supports all languages, emoji, bidi, CJK, Southeast Asian scripts, and complex mixed text.

**Architecture**: Two-phase model — `prepare()` (one-time segmentation + measurement) → `layout()` (pure arithmetic resize hot path, no DOM/canvas/string work). Rich APIs (`prepareWithSegments()`, `layoutWithLines()`, `walkLineRanges()`, `layoutNextLine()`) for custom rendering.

**Runtime**: Bun for tooling and dev server. TypeScript with ES modules. No build step for the library itself (ships `.ts` source).

Internal notes for contributors and agents. Use `README.md` as the public source of truth for API examples and user-facing limitations. Use `STATUS.md` for the compact current browser-accuracy / benchmark dashboard, `accuracy/chrome.json` / `accuracy/safari.json` / `accuracy/firefox.json` for the checked-in raw browser accuracy rows, `benchmarks/chrome.json` and `benchmarks/safari.json` for the checked-in current benchmark snapshots, `corpora/STATUS.md` for the compact corpus snapshot, `corpora/representative.json` for the current machine-readable representative corpus rows, `corpora/TAXONOMY.md` for the shared mismatch vocabulary, `RESEARCH.md` for the detailed exploration log, and `TODO.md` for the current priorities.

### Repository layout

```
src/              Core library (7 files: layout, analysis, measurement, line-break, bidi, test-data, tests)
pages/            Browser tooling pages (accuracy, benchmark, corpus, probe, gatsby, diagnostics)
pages/demos/      Public demo pages (accordion, bubbles, dynamic-layout, editorial-engine, masonry, rich-note, variable-typographic-ascii)
scripts/          CLI testing & validation scripts (13 scripts for accuracy, corpus, benchmark, gatsby, probe work)
corpora/          Long-form language test texts (14+ corpora in 12+ languages) + metadata
accuracy/         Checked-in browser accuracy snapshots (chrome.json, safari.json, firefox.json)
benchmarks/       Checked-in benchmark snapshots (chrome.json, safari.json)
.github/          CI/CD (GitHub Pages deployment via Bun)
```

### Other documentation

- `DEVELOPMENT.md` — dev setup, useful pages, deep profiling guidance
- `CHANGELOG.md` — version history (0.0.0 → 0.0.2)
- `README.md` — public API docs, demos, installation, caveats
- `STATUS.md` — compact browser accuracy + benchmark dashboard
- `TODO.md` — current priorities and anti-priorities
- `RESEARCH.md` — detailed exploration log and durable conclusions
- `corpora/STATUS.md` — long-form corpus canary snapshot
- `corpora/TAXONOMY.md` — shared mismatch classification vocabulary
- `corpora/README.md` — corpus sources and acquisition methods

### Commands

- `bun start` — serve pages at http://localhost:3000 without watch-mode reload (kills stale `:3000` listeners first)
- `bun run start:watch` — same page server, but with Bun's watch/reload client when you explicitly want it
- `bun run site:build` — build the static demo site into `site/` for GitHub Pages
- `bun run check` — typecheck + lint
- `bun test` — lightweight invariant tests against the shipped implementation
- `bun run accuracy-check` / `:safari` / `:firefox` — browser accuracy sweeps
- `bun run accuracy-snapshot` / `:safari` / `:firefox` — full raw browser accuracy rows written to `accuracy/*.json`
- `bun run benchmark-check` / `:safari` — benchmark snapshot with both the short shared corpus and long-form corpus stress rows, including `prepare()` phase split (`analyze` vs `measure`) for the long-form corpora
- `bun run corpus-check --id=... --font='20px ...' --lineHeight=32` — corpus spot check with optional font override
- `bun run corpus-representative` — refresh the checked-in representative corpus anchor rows in `corpora/representative.json`
- `bun run corpus-sweep --id=... --samples=9 --font='20px ...'` — sampled width sweep; use this before a dense sweep on large corpora
- `bun run corpus-font-matrix --id=... --samples=5` — sampled cross-font check for one checked-in corpus
- `bun run corpus-taxonomy --id=... 300 450 600` — classify current mismatches by rough steering bucket (`edge-fit`, `glue-policy`, `boundary-discovery`, `shaping-context`, etc.) using the full browser diagnostics
- `bun run gatsby-check` / `:safari` — Gatsby canary diagnostics
- `bun run gatsby-sweep --start=300 --end=900 --step=10` — fast Gatsby width sweep; add `--diagnose` to rerun mismatching widths through the slow checker
- `bun run pre-wrap-check --browser=chrome,safari` — small browser-oracle sweep for `{ whiteSpace: 'pre-wrap' }` cases like preserved spaces, tabs, hard breaks, CRLF normalization, and mixed-script indentation
- `bun run probe-check --text='...' --width=320 --font='20px ...' --dir=rtl --lang=ar --method=range|span --whiteSpace=normal|pre-wrap` — isolate a single snippet in the real browser and choose the browser-line extraction method explicitly
- `bun run corpus-check --id=mixed-app-text --diagnose --method=span|range 710` — compare corpus-line extraction methods directly when a mismatch may be diagnostic-tool sensitive

### Important files

**Core library (`src/`)**:
- `src/layout.ts` — core library; keep `layout()` fast and allocation-light
- `src/analysis.ts` — normalization, segmentation, glue rules, and text-analysis phase for `prepare()`
- `src/measurement.ts` — canvas measurement runtime, segment metrics cache, emoji correction, and engine-profile shims
- `src/line-break.ts` — internal line-walking core shared by the rich layout APIs and the hot-path line counter
- `src/bidi.ts` — simplified bidi metadata helper for the rich `prepareWithSegments()` path
- `src/test-data.ts` — shared corpus for browser accuracy pages/checkers and benchmarks
- `src/layout.test.ts` — small durable invariant tests for the exported prepare/layout APIs

**Browser tooling pages (`pages/`)**:
- `pages/accuracy.ts` — browser sweep plus per-line diagnostics
- `pages/benchmark.ts` — performance comparisons
- `pages/corpus.ts` — long-form corpus diagnostics page
- `pages/probe.ts` — single-snippet isolation page
- `pages/gatsby.ts` — Gatsby canary diagnostics page
- `pages/diagnostic-utils.ts` — shared grapheme-safe diagnostic helpers used by the browser check pages

**Demo pages (`pages/demos/`)**:
- `pages/demos/index.html` — public static demo landing page used as the GitHub Pages site root
- `pages/demos/bubbles.ts` — bubble shrinkwrap demo using the rich non-materializing line-range walker
- `pages/demos/dynamic-layout.ts` — fixed-height editorial spread with a continuous two-column flow, obstacle-aware title routing, and live logo-driven reflow
- `pages/demos/editorial-engine.ts` — rich text demo with selection interaction
- `pages/demos/rich-note.ts` — rich note-taking demo
- `pages/demos/accordion.ts` — interactive accordion demo
- `pages/demos/masonry/` — masonry layout demo
- `pages/demos/variable-typographic-ascii.ts` — typographic demo
- `pages/demos/wrap-geometry.ts` — shared wrap-geometry utilities for demos
- `pages/demos/bubbles-shared.ts` — shared bubble utilities
- `pages/demos/dynamic-layout-text.ts` — text content for the dynamic-layout demo

**Checked-in data**:
- `accuracy/chrome.json` / `accuracy/safari.json` / `accuracy/firefox.json` — checked-in raw accuracy rows backing `STATUS.md`
- `benchmarks/chrome.json` / `benchmarks/safari.json` — checked-in current benchmark snapshots backing `STATUS.md`
- `corpora/representative.json` — checked-in representative corpus anchor rows backing `corpora/STATUS.md`

**Scripts (`scripts/`)**:
- `scripts/browser-automation.ts` — shared browser control (Puppeteer-style, single-owner lock per browser)
- `scripts/build-demo-site.ts` — static site builder for GitHub Pages deployment
- `scripts/pre-wrap-check.ts` — small permanent browser-oracle sweep for the non-default `{ whiteSpace: 'pre-wrap' }` mode

### Implementation notes

- `prepare()` / `prepareWithSegments()` do horizontal-only work. `layout()` / `layoutWithLines()` take explicit `lineHeight`.
- `setLocale(locale?)` retargets the hoisted word segmenter for future `prepare()` calls and clears shared caches. Use it before preparing new text when the app wants a specific `Intl.Segmenter` locale instead of the runtime default.
- `prepare()` should stay the opaque fast-path handle. If a page/script needs segment arrays, that should usually flow through `prepareWithSegments()` instead of re-exposing internals on the main prepared type.
- `walkLineRanges()` is the rich-path batch geometry API: no string materialization, but still browser-like line widths/cursors/discretionary-hyphen state. Prefer it over private line walkers for shrinkwrap or aggregate layout work.
- `prepare()` is internally split into a text-analysis phase and a measurement phase; keep that seam clear, but keep the public API simple unless requirements force a change.
- The internal segment model now distinguishes at least eight break kinds: normal text, collapsible spaces, preserved spaces, tabs, non-breaking glue (`NBSP` / `NNBSP` / `WJ`-like runs), zero-width break opportunities, soft hyphens, and hard breaks. Do not collapse those back into one boolean unless the model gets richer in a better way.
- `layout()` is the resize hot path: no DOM reads, no canvas calls, no string work, and avoid gratuitous allocations.
- Segment metrics cache is `Map<font, Map<segment, metrics>>`; shared across texts and resettable via `clearCache()`. Width is only one cached fact now; grapheme widths and other segment-derived facts can be populated lazily.
- Word and grapheme segmenters are hoisted at module scope. Any locale reset should also clear the word cache.
- Punctuation is merged into preceding word-like segments only, never into spaces.
- Keep script-specific break-policy fixes in preprocessing, not `layout()`. That includes Arabic no-space punctuation clusters, Arabic punctuation-plus-mark clusters, and `" " + combining marks` before Arabic text.
- `NBSP`-style glue should survive `prepare()` as visible content and prevent ordinary word-boundary wrapping; `ZWSP` should survive as a zero-width break opportunity.
- Soft hyphens should stay invisible when unbroken, but if the engine chooses that break, the broken line should expose a visible trailing hyphen in `layoutWithLines()`.
- If a soft hyphen wins the break, the rich line APIs should still expose the visible trailing `-` in `line.text`, even though the public line types do not currently carry a separate soft-hyphen metadata flag.
- `layoutNextLine()` is the rich-path escape hatch for variable-width userland layout. It now hides its grapheme-cache bookkeeping again by internally splitting line stepping from text materialization. Keep that internal split semantically aligned with `layoutWithLines()`, but do not pull its extra bookkeeping into the hot `layout()` path.
- Astral CJK ideographs, compatibility ideographs, and the later extension blocks must still hit the CJK path; do not rely on BMP-only `charCodeAt()` checks there.
- Non-word, non-space segments are break opportunities, same as words.
- CJK grapheme splitting plus kinsoku merging keeps prohibited punctuation attached to adjacent graphemes.
- Emoji correction is auto-detected per font size, constant per emoji grapheme, and effectively font-independent.
- Bidi levels now stay on the rich `prepareWithSegments()` path as custom-rendering metadata only. The opaque fast `prepare()` handle should not pay for bidi metadata that `layout()` does not consume, and line breaking itself does not read those levels.
- A larger pure-TS Unicode stack like `text-shaper` is useful as reference material, especially for Unicode coverage and richer bidi metadata, but its runtime segmentation and greedy glyph-line breaker are not replacements for our browser-facing `Intl.Segmenter` + preprocessing + canvas-measurement model.
- Supported CSS target is still the common app-text configuration: `white-space: normal`, `word-break: normal`, `overflow-wrap: break-word`, `line-break: auto`.
- There is now a second explicit whitespace mode, `{ whiteSpace: 'pre-wrap' }`, for ordinary spaces, `\t` tabs, and `\n` hard breaks. Tabs follow the default browser-style tab stops. Treat it as editor/input-oriented, not the whole CSS `pre-wrap` surface.
- Keep the permanent `pre-wrap` coverage small and explicit. A one-time raw-source validation was useful, but the standing repo coverage should stay a compact oracle set rather than a giant sweep over wiki scaffolding.
- That default target means narrow widths may still break inside words, but only at grapheme boundaries. Keep the core engine honest to that behavior; if an editorial page wants stricter whole-word handling, layer it on top in userland instead of quietly changing the library default.
- `system-ui` is unsafe for accuracy; canvas and DOM can resolve different fonts on macOS.
- Accuracy pages and checkers are now expected to be green in all three installed browsers on fresh runs; if a page disagrees, suspect stale tabs/servers before changing the algorithm.
- The browser automation lock is self-healing for stale dead-owner files now, but it is still single-owner per browser. If a checker times out on the lock, confirm a live checker process still owns it before changing the algorithm.
- Accuracy/corpus/Gatsby checkers can use background-safe browser automation, but benchmark runs should stay foreground. Do not “optimize away” benchmark focus; throttled/background tabs make the numbers less trustworthy.
- For deep perf or memory work, prefer an isolated debuggable Chrome over a pure Bun microbenchmark. Bun is fine for quick hypotheses, but Chrome profiling is the better source of truth for CPU hotspots, allocation churn, and retained-heap checks.
- Refresh `benchmarks/chrome.json` and `benchmarks/safari.json` when a diff changes benchmark methodology or the text engine hot path (`src/analysis.ts`, `src/measurement.ts`, `src/line-break.ts`, `src/layout.ts`, `src/bidi.ts`, or `pages/benchmark.ts`). `STATUS.md` should stay a compact dashboard, not the only source of current benchmark numbers.
- `bun start` is the stable human-facing dev server. Use `bun run start:watch` only when you explicitly want Bun's watch/reload client. The scripted checkers intentionally keep using `--no-hmr` temporary servers so their runs stay deterministic and easy to tear down.
- Do not run multiple browser corpus/sweep/font-matrix jobs in parallel against the same browser. The automation session and temporary page server paths interfere with each other and can make a healthy corpus look hung or flaky.
- An `ERR_CONNECTION_REFUSED` tab on `localhost:3210` or a similar temporary checker port usually means you caught a per-run Bun server after teardown. That is expected after the script exits; it is not, by itself, evidence of a bad measurement.
- Keep `src/layout.test.ts` small and durable. For browser-specific or narrow hypothesis work, prefer throwaway probes/scripts and promote only the stable invariants into permanent tests.
- For Gatsby canary work, sweep widths cheaply first and only diagnose the mismatching widths in detail. The slow detailed checker is for narrowing root causes, not for every width by default.
- For Arabic corpus/probe work, use normalized slices, the exact corpus font, and the RTL `Range`-based diagnostics. Raw offsets or rough fallback fonts will mislead you.
- For `pre-wrap` probe work, Safari span extraction is currently a better cross-check than Safari `Range` extraction around preserved spaces and hard breaks. Keep using `Range` for the default `white-space: normal` diagnostics unless the mode itself is the thing under test.
- For Southeast Asian and Arabic/Urdu raw-diagnostic work, keep using the script-appropriate extractor instead of forcing one Safari rule everywhere.
- The corpus/probe diagnostic pages now compute our line offsets directly from prepared segments and grapheme fallbacks; do not go back to reconstructing them from `layoutWithLines().line.text.length`.
- `/corpus`, `corpus-check`, and `corpus-sweep` now accept `font` / `lineHeight` overrides. Use those before inventing a second page or checker when the question is “does this same corpus stay healthy under another font?”
- Prefer Chrome for the first font-matrix pass. Safari font-matrix automation is slower and noisier, so treat it as follow-up smoke coverage.
- Mixed app text is now a first-class canary. Use it to catch product-shaped classes like URL/query-string wrapping, emoji ZWJ runs, and mixed-script punctuation before tuning another book corpus.
- URL-like runs such as `https://...` / `www...` are currently modeled as two breakable preprocessing units when a query exists: the path through the query introducer (`?`), then the query string. This is intentionally narrow and exists to stop obviously bad mid-path URL breaks without forcing the whole query string to fragment character-by-character.
- Mixed app text also pulled in two more keep-worthy preprocessing rules: contextual escaped quote clusters like `\"word\"`, and numeric/time-range runs like `२४×७` / `7:00-9:00`.
- For Southeast Asian scripts or mixed text containing Thai/Lao/Khmer/Myanmar, trust the `Range`-based corpus diagnostics over span-probing; span units can perturb line breaking there.
- The remaining Chrome mixed-app `710px` soft-hyphen miss is extractor-sensitive and not cleanly local. Treat it as paragraph-scale / accumulation-sensitive until a cleaner reproducer appears, and do not patch the engine from only one extractor view.
- Safari `Range`-based probe extraction can over-advance across URL query text (`...path?q`) even when the real DOM height and the `span` extractor are exact. Cross-check `--method=span` before changing the engine on Safari URL/query probe misses.
- Keep the current corpus lessons in mind:
  - Thai: contextual ASCII quotes were a real keep
  - Khmer: explicit zero-width separators from clean source text are useful signal
  - Lao: wrapped raw-law text was a bad canary and was rejected
  - Myanmar: punctuation/medial-glue keeps survived, broader Chrome-only fixes did not
  - Japanese: kana iteration marks are CJK line-start-prohibited
  - Chinese: the remaining broad Chrome-positive field is real and not obviously another punctuation bug
- The corpus diagnostics should derive our candidate lines from `layoutWithLines()`, not from a second local line-walker. That avoids SHY and future custom-break drift between the hot path and the diagnostic path.
- Current line-fit tolerance is `0.005` for Chromium/Gecko and `1/64` for Safari/WebKit. That bump was justified by the remaining Arabic fine-width field and did not move the solved browser corpus or Gatsby coarse canary.
- Refresh `accuracy/chrome.json`, `accuracy/safari.json`, and `accuracy/firefox.json` when a diff changes the browser sweep methodology or the main text engine behavior (`src/analysis.ts`, `src/measurement.ts`, `src/line-break.ts`, `src/layout.ts`, `src/bidi.ts`, or `pages/accuracy.ts`).
- Refresh `corpora/representative.json` when a diff intentionally changes one of the tracked representative canaries or their canonical anchor behavior. Keep it compact: anchors and designated fragile-width sentinels, not every exploratory sweep result.

### Open questions

- Decide whether line-fit tolerance should stay as a browser-specific shim or move to runtime calibration alongside emoji correction.
- If a future Arabic corpus still exposes misses after preprocessing and corpus cleanup, decide whether that needs a richer break-policy model or a truly shaping-aware architecture beyond segment-sum layout.
- `layoutWithLines()` now returns line boundary cursors (`start` / `end`) in addition to `{ text, width }`; keep that data model useful for future manual reflow work, especially for the richer editorial demos.
- The dynamic-layout demo is the current real consumer of the rich line API. If a future custom-layout page wants more metadata, make it prove that need there before expanding the rich API again.
- The browser demos should increasingly dogfood `layoutNextLine()` rather than depending on `layoutWithLines()` for whole-paragraph materialization. That keeps the streaming userland path honest.
- ASCII fast path could skip some CJK, bidi, and emoji overhead.
- Benchmark methodology still needs review.
- Additional CSS configs are still untested: `break-all`, `keep-all`, `strict`, `loose`, `anywhere`.

### CI/CD

- GitHub Pages deployment via `.github/workflows/pages.yml`: checkout → `bun install --frozen-lockfile` → `bun run site:build` → deploy to GitHub Pages
- No automated test CI yet; accuracy/corpus/benchmark checks are run manually via the CLI scripts

### Related

- `../text-layout/` — Sebastian Markbage's original prototype + our experimental variants.
