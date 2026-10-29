// Admin boshqaradigan sayt sozlamalari: data/site.json.
// Ilovalarni yashirish/o'zgartirish, o'zimiz qo'shgan ilovalar, e'lon, texnik ish rejimi.
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

const FILE = path.join(config.dataDir, "site.json");

const EMPTY = {
  banner: { on: false, text: "" },
  maintenance: { on: false, text: "" },
  ignoreIps: [],
  services: {},
  overrides: {},
  customApps: [],
};

const s = (v, max = 500) => String(v ?? "").trim().slice(0, max);
const list = (v, max = 30, len = 60) => (Array.isArray(v) ? v : []).map((x) => s(x, len)).filter(Boolean).slice(0, max);

export function sanitize(raw = {}) {
  const out = structuredClone(EMPTY);
  out.banner = { on: !!raw.banner?.on, text: s(raw.banner?.text, 300) };
  out.maintenance = { on: !!raw.maintenance?.on, text: s(raw.maintenance?.text, 300) };
  out.ignoreIps = list(raw.ignoreIps, 20, 45);

  for (const [id, v] of Object.entries(raw.services || {}).slice(0, 50)) {
    const e = {};
    if (v.hidden) e.hidden = true;
    if (v.status === "live" || v.status === "soon") e.status = v.status;
    if (typeof v.home === "boolean") e.home = v.home;
    if (Object.keys(e).length) out.services[s(id, 40)] = e;
  }

  for (const [id, v] of Object.entries(raw.overrides || {}).slice(0, 1000)) {
    const e = {};
    if (v.hidden) e.hidden = true;
    for (const k of ["title", "description", "file_url", "section", "preview_url", "version", "size_mb"]) {
      if (s(v[k], 1000)) e[k] = s(v[k], k === "description" ? 1000 : 500);
    }
    if (Array.isArray(v.categories) && v.categories.length) e.categories = list(v.categories);
    if (Object.keys(e).length) out.overrides[s(id, 80)] = e;
  }

  out.customApps = (Array.isArray(raw.customApps) ? raw.customApps : []).slice(0, 500).map((a, i) => ({
    id: s(a.id, 80) || `adm-${Date.now().toString(36)}${i}`,
    title: s(a.title, 120),
    description: s(a.description, 1000),
    section: s(a.section, 30) || "kattabaza",
    categories: list(a.categories),
    file_url: s(a.file_url, 1000),
    file_type: s(a.file_type, 12).toUpperCase(),
    size_mb: s(a.size_mb, 20),
    version: s(a.version, 40),
    preview_url: s(a.preview_url, 500),
    locked: !!a.locked,
    hidden: !!a.hidden,
  })).filter((a) => a.title && a.file_url);
  return out;
}

let site = structuredClone(EMPTY);
const ready = readFile(FILE, "utf8")
  .then((t) => {
    site = sanitize(JSON.parse(t));
  })
  .catch(() => {});

export const getSite = () => site;
export const siteReady = () => ready;

export async function saveSite(raw) {
  site = sanitize(raw);
  await mkdir(config.dataDir, { recursive: true });
  const tmp = FILE + ".tmp";
  await writeFile(tmp, JSON.stringify(site, null, 2));
  await rename(tmp, FILE);
  return site;
}

// Brauzerga beriladigan qism (hammasi ochiq ma'lumot, sirlar yo'q)
export const publicSite = () => ({
  banner: site.banner.on ? site.banner.text : "",
  maintenance: site.maintenance.on ? site.maintenance.text || "Saytda texnik ishlar olib borilmoqda." : "",
  services: site.services,
  overrides: site.overrides,
  customApps: site.customApps.filter((a) => !a.hidden),
});
