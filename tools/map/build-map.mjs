// Orqa fon xaritasi — o'zimiz chizamiz, tashqi xarita servisiga so'rov ketmaydi.
//
// Manba: Natural Earth (naturalearthdata.com) — jamoat mulki (public domain).
// Web Mercator proyeksiyasida (Leaflet bilan bir xil) 4096x4096 SVG yaratiladi:
// 4-zoom darajasida 1:1 — xarita aynan shu masshtabda ko'rsatiladi.
//
// Ishlatish:  npm run map
//   NE_DIR — geojson fayllari papkasi (standart: tools/map/data). Fayllar bo'lmasa
//            GitHub'dagi natural-earth-vector repozitoriysidan bir marta yuklab olinadi.
// Natija: public/map/world-light.svg, public/map/world-dark.svg

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NE_DIR = process.env.NE_DIR || path.join(ROOT, "tools", "map", "data");
const OUT = path.join(ROOT, "public", "map");
const NE_BASE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
const FILES = {
  countries: "ne_50m_admin_0_countries.geojson",
  lakes: "ne_50m_lakes.geojson",
  places: "ne_110m_populated_places_simple.geojson",
};

const SIZE = 4096;
const MAX_LAT = 85.0511287798;

const THEMES = {
  dark: {
    ocean: "#0b0b0e", land: "#19191e", border: "#2c2c33", grid: "#141418",
    country: "#6e6e79", city: "#9a9aa5", cityDot: "#fb923c", halo: "#19191e",
  },
  light: {
    ocean: "#dde6ee", land: "#f7f7f8", border: "#d2d3d9", grid: "#d3dde6",
    country: "#8b8b96", city: "#6b6b76", cityDot: "#ea580c", halo: "#f7f7f8",
  },
};

// ------------------------------------------------------------ ma'lumot

async function load(name) {
  const file = path.join(NE_DIR, name);
  if (!existsSync(file)) {
    mkdirSync(NE_DIR, { recursive: true });
    console.log(`yuklanmoqda: ${name}`);
    const res = await fetch(`${NE_BASE}/${name}`);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return JSON.parse(readFileSync(file, "utf8"));
}

// ------------------------------------------------------------ proyeksiya

function project([lon, lat]) {
  const clamped = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
  const rad = (clamped * Math.PI) / 180;
  const x = ((lon + 180) / 360) * SIZE;
  const y = ((1 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / Math.PI) / 2) * SIZE;
  return [x, y];
}

// Yaqin nuqtalarni tashlab yuborish: 1:1 masshtabda 1.2 px dan kichik farq ko'rinmaydi
function ringPath(ring) {
  const pts = [];
  let last = null;
  for (const coord of ring) {
    const [x, y] = project(coord);
    if (last && Math.hypot(x - last[0], y - last[1]) < 1.2) continue;
    pts.push([Math.round(x * 2) / 2, Math.round(y * 2) / 2]);
    last = [x, y];
  }
  if (pts.length < 3) return "";
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    area += x1 * y2 - x2 * y1;
  }
  if (Math.abs(area) < 6) return ""; // mayda orolchalar
  return "M" + pts.map(([x, y]) => `${x} ${y}`).join("L") + "Z";
}

function geometryPath(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  return polygons.map((rings) => rings.map(ringPath).join("")).join("");
}

// ------------------------------------------------------------ yozuvlar

const escapeXml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Natural Earth'dagi eskirgan nomlar
const RENAME = { "Nur-Sultan": "Astana", Kiev: "Kyiv" };

function placeLabels(countries, places) {
  const boxes = [];
  const free = (b) => !boxes.some((o) => b.x1 < o.x2 && b.x2 > o.x1 && b.y1 < o.y2 && b.y2 > o.y1);
  const labels = [];

  const city = (p) => {
    const [x, y] = project(p.coords);
    const size = 13;
    const text = RENAME[p.name] || p.name;
    const box = { x1: x - 5, x2: x + 10 + text.length * size * 0.56, y1: y - 9, y2: y + 9 };
    if (!free(box)) return;
    boxes.push(box);
    labels.push({ kind: "city", x, y, size, text });
  };

  const allCities = places.features
    .map((f) => ({ ...f.properties, coords: f.geometry.coordinates }))
    .filter((p) => p.featurecla === "Admin-0 capital" || p.scalerank <= 1)
    .sort((a, b) => a.scalerank - b.scalerank || b.pop_max - a.pop_max);

  // 1) Poytaxtlar birinchi — ular davlat nomi ostida yo'qolib ketmasin
  allCities.filter((p) => p.featurecla === "Admin-0 capital").forEach(city);

  // 2) Davlat nomlari (qisqa nomi: "China", "United States")
  const ranked = countries.features
    .map((f) => f.properties)
    .filter((p) => p.LABELRANK <= 5 && p.LABEL_X != null)
    .sort((a, b) => a.LABELRANK - b.LABELRANK);
  for (const p of ranked) {
    const size = p.LABELRANK <= 2 ? 19 : p.LABELRANK === 3 ? 15 : 12;
    const text = String(p.NAME).toUpperCase();
    const [x, y] = project([p.LABEL_X, p.LABEL_Y]);
    // Poytaxt bilan to'qnashsa — nom biroz yuqoriga yoki pastga suriladi
    for (const dy of [0, -size * 1.4, size * 1.4]) {
      const w = text.length * (size * 0.64 + 2);
      const box = { x1: x - w / 2, x2: x + w / 2, y1: y + dy - size * 0.85, y2: y + dy + size * 0.35 };
      if (!free(box)) continue;
      boxes.push(box);
      labels.push({ kind: "country", x, y: y + dy, size, text });
      break;
    }
  }

  // 3) Qolgan yirik shaharlar
  allCities.filter((p) => p.featurecla !== "Admin-0 capital").forEach(city);
  return labels;
}

// ------------------------------------------------------------ SVG

function buildSvg(theme, countryPaths, lakePath, labels) {
  const c = THEMES[theme];
  const grid = [];
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * SIZE;
    grid.push(`M${x.toFixed(1)} 0V${SIZE}`);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project([0, lat]);
    grid.push(`M0 ${y.toFixed(1)}H${SIZE}`);
  }

  const text = labels
    .map((l) =>
      l.kind === "country"
        ? `<text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" font-size="${l.size}" class="c">${escapeXml(l.text)}</text>`
        : `<circle cx="${l.x.toFixed(1)}" cy="${l.y.toFixed(1)}" r="3.2" class="d"/><text x="${(l.x + 7).toFixed(1)}" y="${(l.y + 4.5).toFixed(1)}" font-size="${l.size}" class="t">${escapeXml(l.text)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
<!-- KattaBaza background map (${theme}). Data: Natural Earth, public domain. Generated by tools/map/build-map.mjs -->
<style>
text{font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;paint-order:stroke;stroke:${c.halo};stroke-width:3px;stroke-linejoin:round}
.c{fill:${c.country};font-weight:600;letter-spacing:2px;text-anchor:middle}
.t{fill:${c.city};font-weight:500}
.d{fill:${c.cityDot};stroke:${c.halo};stroke-width:1.5}
</style>
<rect width="${SIZE}" height="${SIZE}" fill="${c.ocean}"/>
<path d="${grid.join("")}" stroke="${c.grid}" stroke-width="1" fill="none"/>
<path d="${countryPaths.join("")}" fill="${c.land}" stroke="${c.border}" stroke-width="1.1" stroke-linejoin="round" fill-rule="evenodd"/>
<path d="${lakePath}" fill="${c.ocean}" stroke="${c.border}" stroke-width="0.8"/>
${text}
</svg>
`;
}

// ------------------------------------------------------------

const [countries, lakes, places] = await Promise.all([load(FILES.countries), load(FILES.lakes), load(FILES.places)]);
const countryPaths = countries.features.map((f) => geometryPath(f.geometry)).filter(Boolean);
const lakePath = lakes.features
  .filter((f) => (f.properties.scalerank ?? 9) <= 3)
  .map((f) => geometryPath(f.geometry))
  .join("");
const labels = placeLabels(countries, places);

mkdirSync(OUT, { recursive: true });
for (const theme of Object.keys(THEMES)) {
  const file = path.join(OUT, `world-${theme}.svg`);
  const svg = buildSvg(theme, countryPaths, lakePath, labels);
  writeFileSync(file, svg);
  console.log(`${path.relative(ROOT, file)}  ${(svg.length / 1024).toFixed(0)} KB`);
}
