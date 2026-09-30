// Google Sheets (opensheet orqali) — keshlangan o'qish.
// Sheet ID faqat serverda turadi, brauzerga hech qachon yuborilmaydi.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

const OPENSHEET = "https://opensheet.elk.sh";
const cache = new Map(); // "sheetId/tab" -> { at, data }
const inflight = new Map();
const diskFile = path.join(config.dataDir, "catalog-cache.json");
let diskLoaded = false;

async function loadDisk() {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    const saved = JSON.parse(await readFile(diskFile, "utf8"));
    for (const [key, entry] of Object.entries(saved)) {
      // Diskdagi nusxa "eskirgan" deb belgilanadi — birinchi so'rovda yangilanadi
      cache.set(key, { at: 0, data: entry.data, persist: true });
    }
  } catch {}
}

async function saveDisk() {
  const out = {};
  for (const [key, entry] of cache) if (entry.persist) out[key] = { data: entry.data };
  try {
    await mkdir(config.dataDir, { recursive: true });
    await writeFile(diskFile, JSON.stringify(out));
  } catch (err) {
    console.warn("[sheets] keshni yozib bo'lmadi:", err.message);
  }
}

async function fetchTab(sheetId, tab) {
  const url = `${OPENSHEET}/${sheetId}/${encodeURIComponent(tab)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${tab}: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`${tab}: ${data?.error || "kutilmagan javob"}`);
  return data;
}

// Yangi bo'lsa keshdan beradi; eskirgan bo'lsa qayta so'raydi; so'rov
// yiqilsa oxirgi muvaffaqiyatli nusxani qaytaradi (sayt bo'sh qolmasin).
// persist=false — kalitlar diskka yozilmaydi.
export async function readTab(sheetId, tab, { persist = true } = {}) {
  if (!sheetId) throw new Error("SHEET_ID sozlanmagan");
  await loadDisk();
  const key = `${sheetId}/${tab}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < config.cacheSeconds * 1000) return hit.data;
  if (inflight.has(key)) return inflight.get(key);

  const job = fetchTab(sheetId, tab)
    .then((data) => {
      cache.set(key, { at: Date.now(), data, persist });
      if (persist) saveDisk();
      return data;
    })
    .catch((err) => {
      if (hit) {
        console.warn(`[sheets] ${tab} yangilanmadi, eski nusxa beriladi:`, err.message);
        return hit.data;
      }
      throw err;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, job);
  return job;
}

const str = (v) => (v === undefined || v === null ? "" : String(v).trim());
const splitList = (v) => str(v).split(",").map((s) => s.trim()).filter(Boolean);

function fileTypeOf(row) {
  const direct = [row.file_type, row.type, row.format, row.extension, row.ext, row.mime_type]
    .map(str)
    .find(Boolean);
  if (direct) {
    const clean = direct.replace(/^\./, "");
    return (clean.includes("/") ? clean.split("/").pop() : clean).toUpperCase();
  }
  let source = str(row.file_url || row.post_link || row.title);
  try {
    source = decodeURIComponent(source);
  } catch {}
  const ext = source.match(/\.([a-zA-Z0-9]{2,8})(?:$|[?#/&\s])/);
  return ext ? ext[1].toUpperCase() : "FILE";
}

// Faqat kerakli maydonlar — jadvaldagi ortiqcha ustunlar tashqariga chiqmaydi.
// Maydon nomlari frontend komponentlari kutgan shaklda (jadval ustunlari bilan bir xil).
function normalizeMaterial(row, index) {
  return {
    id: str(row.id) || `m-${index}`,
    title: str(row.title),
    description: str(row.description),
    categories: splitList(row.categories),
    tags: splitList(row.tags),
    gallery_urls: splitList(row.gallery_urls),
    file_url: str(row.file_url),
    file_type: fileTypeOf(row),
    size_mb: str(row.size_mb),
    version: str(row.version),
    platform: str(row.platform),
    author: str(row.author),
    preview_url: str(row.preview_url),
    post_link: str(row.post_link),
    channel_ID: str(row.channel_ID),
    created_at: str(row.created_at),
  };
}

export async function getCatalog() {
  const [materials, channels] = await Promise.all([
    readTab(config.sheetId, config.materialsTab),
    readTab(config.sheetId, config.channelsTab).catch(() => []),
  ]);
  return {
    materials: materials.map(normalizeMaterial).filter((m) => m.title),
    channels: channels
      .map((c) => ({ channel_ID: str(c.channel_ID), Name: str(c.Name) }))
      .filter((c) => c.channel_ID && c.Name),
  };
}
