// SVG -> PNG:  node tools/brand/render.mjs <src.svg> <out.png> <kenglik> <balandlik>
// SVG o'lchamidan qat'i nazar, berilgan o'lchamga cho'zib chiziladi.
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
const [,, src, out, w, h] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.setContent(`<html><head><style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style></head><body>${readFileSync(src, "utf8")}</body></html>`);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
await p.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: +w, height: +h } });
await b.close();
