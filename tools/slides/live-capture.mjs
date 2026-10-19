// Jonli servislarning bosh sahifasidan karusel rasmi: public/slides/<id>-1-<light|dark>.jpg
// Ishlatish: node tools/slides/live-capture.mjs [id ...]   (id bo'lmasa — hammasi)
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.join(ROOT, "public", "slides");
const SITES = { med: "https://med.kattabaza.uz", vizitka: "https://vizitka.kattabaza.uz", bron: "https://bron.kattabaza.uz", samsara: "https://samsara.kattabaza.uz", bot: "https://bot.kattabaza.uz" };
const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => p && existsSync(p));

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SITES);
const browser = await chromium.launch({ executablePath: CHROME });
for (const id of ids) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, colorScheme: theme });
    await ctx.addInitScript((th) => {
      try { localStorage.setItem("theme", th); localStorage.setItem("kb-theme", th); } catch {}
    }, theme);
    const page = await ctx.newPage();
    await page.goto(SITES[id], { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, `${id}-1-${theme}.jpg`), type: "jpeg", quality: 86 });
    await ctx.close();
  }
  console.log("ok", id);
}
await browser.close();
