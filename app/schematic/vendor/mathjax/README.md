# Schematic Editor Web MathJax

The script beside this file combines the official MathJax 4.1.3 startup, core, TeX input and SVG output with all SVG glyph data from the official `mathjax-tex` 4.1.3 font package. The component follows MathJax's [custom combined component guide](https://docs.mathjax.org/en/v4.1/advanced/build/component.html) and uses the font described in the [font guide](https://docs.mathjax.org/en/v4.1/output/fonts.html).

The component omits the external MathML input, context menu, and optional semantic enrichment, speech, braille, and explorer tooling. The official TeX input component keeps its standard package set. The Web loader continues to disable `autoload` and `require`, use the existing delimiters, and emit self-contained paths with `svg.fontCache: "none"`. MathJax's internal MathML tree and SVG wrappers are included.

## Rebuild the vendor file

Run from the Schematic Editor repository root with Node.js and npm as specified by its package configuration. Use the system `tar` command.

```sh
npm ci
node -e "require('node:fs').mkdirSync('tmp/mathjax-pack', {recursive: true})"
npm pack @mathjax/src@4.1.3 @mathjax/mathjax-tex-font@4.1.3 --ignore-scripts --registry https://registry.npmjs.org --pack-destination tmp/mathjax-pack
node scripts/build-web-mathjax.mjs tmp/mathjax-pack
```

The recipe verifies both registry tarball SHA-512 digests and requires the repository-locked esbuild 0.25.12. It builds only for this vendoring step. Normal Web builds copy the checked-in asset. The emitted JavaScript name includes the first 12 characters of its SHA-256. If the bytes change, update the relative path in `apps/web/mathjax.ts` and replace the previous file. Run `npm run test:web-performance` and `npm run test:note` against the resulting bundle.

Run `node scripts/web-mathjax-compat-smoke.mjs` against the current Web build to check the single-file load, export and caching in Chromium. To also compare formula geometry and exported PNG pixels, pass the path to an `apps/web/dist` built from the previous revision (`86742fe`).

MathJax and its TeX font are distributed under the accompanying Apache 2.0 license. The archived official component previously vendored here was `tex-mml-svg-mathjax-tex.js` from the same 4.1.3 font package.
