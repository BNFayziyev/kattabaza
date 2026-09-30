// Karusel rasmlari — HAQIQIY platformalar interfeysidan, demo ma'lumot bilan.
//
// Nima qiladi: treyler va time (FaceID) frontendlarining yig'ilgan nusxasini
// ochadi, ularning /api so'rovlariga shu yerdagi demo javoblarni qaytaradi
// (haqiqiy serverlarga ham, haqiqiy ma'lumotlarga ham tegilmaydi) va har bir
// sahifani kunduzgi va tungi mavzuda suratga oladi.
//
// Ishlatish:  npm run slides:capture
//   TREYLER_DIST — treyler web/dist papkasi       (standart: C:/treyler/web/dist)
//   FACEID_DIST  — FaceID frontend yig'ilgan papka (standart: vaqtinchalik papkaga yig'iladi)
//   FACEID_SRC   — FaceID frontend manbasi          (standart: C:/faceID_manager/frontend)
//
// Natija: public/slides/<id>-<light|dark>.jpg

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = path.join(ROOT, "public", "slides");
const TREYLER_DIST = process.env.TREYLER_DIST || "C:/treyler/web/dist";
const FACEID_SRC = process.env.FACEID_SRC || "C:/faceID_manager/frontend";
let FACEID_DIST = process.env.FACEID_DIST || path.join(os.tmpdir(), "kattabaza-faceid-dist");

const VIEWPORT = { width: 1280, height: 720 };
// Barcha rasmlar bir xil "hozir"da olinadi: 30-sentabr, Toshkentda 15:40
const NOW = Date.parse("2026-09-30T10:40:00Z");
const TODAY = "2026-09-30";
const THEMES = ["light", "dark"];

const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => p && existsSync(p));

// ------------------------------------------------------------ yordamchilar

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".json": "application/json", ".woff2": "font/woff2" };

/** Kontekstni: demo domen -> dist fayllari + /api -> mock. Boshqa so'rovlar internetga o'tadi. */
async function serve(context, origin, dist, api) {
  await context.route(`${origin}/**`, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/api/")) {
      const body = api(url, route.request());
      return route.fulfill({ status: body === undefined ? 404 : 200, contentType: "application/json", body: JSON.stringify(body ?? { detail: "not found" }) });
    }
    let file = path.join(dist, decodeURIComponent(url.pathname));
    if (!existsSync(file) || url.pathname === "/") file = path.join(dist, "index.html");
    return route.fulfill({ status: 200, contentType: MIME[path.extname(file)] || "application/octet-stream", body: readFileSync(file) });
  });
}

async function shoot(page, id, theme) {
  await page.waitForTimeout(1200);
  // JPEG — interfeys rasmi PNG dan ~3 barobar yengil, sifat farqi sezilmaydi
  const file = path.join(OUT, `${id}-${theme}.jpg`);
  await page.screenshot({ path: file, type: "jpeg", quality: 86 });
  console.log(`  ${path.basename(file)}`);
}

// ================================================================ TREYLER

const SOURCES = [
  ["spireon", "Spireon FleetLocate"],
  ["skybitz", "SkyBitz"],
  ["orbcomm", "ORBCOMM"],
  ["xtra", "XTRA Lease"],
  ["gpstab", "GPSTab"],
];

const HUBS = [
  ["Laredo, TX", 27.53, -99.49], ["Dallas, TX", 32.78, -96.8], ["Houston, TX", 29.76, -95.37],
  ["San Antonio, TX", 29.42, -98.49], ["Memphis, TN", 35.15, -90.05], ["Joliet, IL", 41.53, -88.08],
  ["Chicago, IL", 41.88, -87.63], ["Atlanta, GA", 33.75, -84.39], ["Nashville, TN", 36.16, -86.78],
  ["Indianapolis, IN", 39.77, -86.16], ["Columbus, OH", 39.96, -83.0], ["Kansas City, MO", 39.1, -94.58],
  ["Oklahoma City, OK", 35.47, -97.52], ["Phoenix, AZ", 33.45, -112.07], ["El Paso, TX", 31.76, -106.49],
  ["Jacksonville, FL", 30.33, -81.66], ["Charlotte, NC", 35.23, -80.84], ["St. Louis, MO", 38.63, -90.2],
  ["Louisville, KY", 38.25, -85.76], ["Denver, CO", 39.74, -104.99],
];

function makeTrailers() {
  const r = rng(53012);
  const list = [];
  // Ogir holatlar ro'yxatning boshida bo'lsin — ogohlantirish oynasi to'lib ko'rinadi
  const dwellHours = [171, 158, 147, 133, 126, 122, 101, 93, 88, 76, 71, 64, 59, 53, 50];
  for (let i = 0; i < 64; i++) {
    const [source, sourceLabel] = SOURCES[i % SOURCES.length];
    const [city, lat0, lon0] = HUBS[Math.floor(r() * HUBS.length)];
    const lat = lat0 + (r() - 0.5) * 0.6;
    const lon = lon0 + (r() - 0.5) * 0.8;
    const moving = i >= dwellHours.length && r() < 0.45;
    const stale = !moving && i >= dwellHours.length && r() < 0.08;
    const hours = i < dwellHours.length ? dwellHours[i] + r() : moving ? 0.2 : 2 + r() * 40;
    const dwellSeconds = Math.round(hours * 3600);
    const staleSeconds = stale ? Math.round((26 + r() * 30) * 3600) : Math.round(r() * 1500 + 120);
    const severity = hours >= 120 ? "critical" : hours >= 48 ? "warning" : "ok";
    const snoozed = i === 9;
    const status = moving ? "moving" : snoozed ? "snoozed" : stale ? "stale" : severity;
    const num = source === "xtra" ? `XT-${2100 + i * 7}` : source === "gpstab" ? `GT-${900 + i * 3}` : String(47000 + ((i * 7919) % 9000));
    list.push({
      id: `${source}:${num}`,
      source,
      sourceLabel,
      externalId: num,
      name: num,
      vin: `1JJV532D${String(4000000 + i * 1731).slice(0, 7)}${i % 10}`,
      note: i === 1 ? "Customer asked to hold until Friday" : null,
      lat,
      lon,
      address: `${Math.round(100 + r() * 9800)} ${["Industrial Blvd", "Logistics Pkwy", "Commerce St", "Freight Dr", "Terminal Rd"][i % 5]}, ${city}`,
      lastTs: NOW - staleSeconds * 1000,
      anchorTs: NOW - dwellSeconds * 1000,
      dwellSeconds: moving ? 0 : dwellSeconds,
      staleSeconds,
      isMoving: moving,
      isStale: stale,
      isInactive: false,
      isSnoozed: snoozed,
      snoozeUntil: snoozed ? NOW + 3 * 86400000 : null,
      battery: Math.round(55 + r() * 45),
      speedKph: moving ? Math.round(60 + r() * 45) : 0,
      severity,
      status,
      meta: null,
    });
  }
  return list;
}

function treylerApi(trailers) {
  const stats = () => {
    const count = (fn) => trailers.filter(fn).length;
    return {
      total: trailers.length,
      moving: count((x) => x.isMoving),
      ok: count((x) => x.status === "ok"),
      warning: count((x) => x.status === "warning"),
      critical: count((x) => x.status === "critical"),
      snoozed: count((x) => x.isSnoozed),
      stale: count((x) => x.isStale),
      inactive: 0,
      bySource: SOURCES.map(([source, label]) => ({
        source,
        label,
        count: count((x) => x.source === source),
        critical: count((x) => x.source === source && x.status === "critical"),
        warning: count((x) => x.source === source && x.status === "warning"),
      })),
      longestDwellSeconds: Math.max(...trailers.map((x) => x.dwellSeconds)),
      idleHoursCritical: Math.round(trailers.filter((x) => x.status === "critical").reduce((s, x) => s + x.dwellSeconds, 0) / 3600),
    };
  };
  const user = { id: 1, telegramId: "100200300", fullName: "Aziz Karimov", username: "aziz", role: "admin", isActive: true, canWrite: true };

  return (url) => {
    const p = url.pathname;
    if (p === "/api/health") return { ok: true, bot: true, authRequired: true, telegramAuth: true };
    if (p === "/api/auth/status") return { enabled: true, botUsername: "treyler_kattabot", reason: null };
    if (p === "/api/auth/me") return user;
    if (p === "/api/config")
      return {
        thresholds: { warningHours: 48, criticalHours: 120, staleHours: 24, radiusMeters: 300 },
        poll: { intervalMinutes: 15 },
        timezone: "America/Chicago",
        timezoneSecondary: "Asia/Tashkent",
        bot: { enabled: true, dailyTimes: ["08:00"], timezone: "Asia/Tashkent" },
      };
    if (p === "/api/stats") return stats();
    if (p === "/api/trailers") return { items: trailers, count: trailers.length };
    const m = p.match(/^\/api\/trailers\/([^/]+)(\/(history|dwell))?$/);
    if (m) {
      const tr = trailers.find((x) => x.id === decodeURIComponent(m[1])) || trailers[0];
      if (m[3] === "history") {
        const points = Array.from({ length: 40 }, (_, k) => ({
          ts: tr.anchorTs - (40 - k) * 3 * 3600000,
          lat: tr.lat + (40 - k) * 0.035,
          lon: tr.lon - (40 - k) * 0.05,
          speedKph: 88,
          address: null,
          motion: "moving",
        })).concat([{ ts: tr.anchorTs, lat: tr.lat, lon: tr.lon, speedKph: 0, address: tr.address, motion: "stopped" }]);
        return { points };
      }
      if (m[3] === "dwell")
        return {
          events: [
            { id: 3, startTs: tr.anchorTs - 9 * 86400000, endTs: tr.anchorTs - 6 * 86400000, durationS: 3 * 86400, lat: tr.lat + 1.2, lon: tr.lon - 1.6, address: "Oklahoma City, OK" },
            { id: 2, startTs: tr.anchorTs - 15 * 86400000, endTs: tr.anchorTs - 13 * 86400000, durationS: 2 * 86400 + 7200, lat: tr.lat + 2, lon: tr.lon - 2, address: "Kansas City, MO" },
          ],
        };
      return tr;
    }
    if (p === "/api/connectors")
      return {
        connectors: SOURCES.map(([id, label]) => ({ id, label, configured: true, status: "ready", missing: [] })),
        sync: SOURCES.map(([id], k) => ({ connector: id, lastSuccessTs: NOW - (3 + k * 2) * 60000, lastAttemptTs: NOW - (3 + k * 2) * 60000, lastError: null, consecutiveFailures: 0, staleMinutes: 3 + k * 2 })),
      };
    if (p === "/api/settings")
      return {
        chatIds: ["-1002345678901"],
        botLang: "en",
        botEnabled: true,
        app: { dailyReportEnabled: true, dailyReportTimes: ["08:00", "17:30"], reportTimezone: "Asia/Tashkent", pollIntervalMinutes: 15, instantAlerts: true, reportLimit: 20, warningHours: 48, criticalHours: 120, staleHours: 24, inactiveDays: 45 },
      };
    if (p === "/api/server/info") return { startedAt: NOW - 5 * 86400000, canRestart: true };
    if (p === "/api/users") return { items: [user, { id: 2, telegramId: "100200301", fullName: "Dilnoza Rahimova", username: null, role: "viewer", isActive: true, canWrite: false }] };
    return { ok: true };
  };
}

async function captureTreyler(browser) {
  console.log("treyler:");
  const trailers = makeTrailers();
  for (const theme of THEMES) {
    const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
    await context.addInitScript(([th]) => {
      localStorage.setItem("treyler.theme", th);
      localStorage.setItem("treyler.lang", "en");
    }, [theme]);
    await serve(context, "http://treyler.demo", TREYLER_DIST, treylerApi(trailers));
    const page = await context.newPage();
    await page.clock.setFixedTime(NOW);
    await page.goto("http://treyler.demo/");

    // 1 — kirish bilanoq chiqadigan "eng uzoq turganlar" oynasi
    await page.waitForSelector(".modal .alert-row", { timeout: 20000 });
    await page.waitForTimeout(2500); // xarita qatlamlari
    await shoot(page, "treyler-1", theme);

    // 2 — ro'yxat va xarita
    await page.click(".modal-foot .btn-ghost");
    await page.waitForTimeout(1500);
    await shoot(page, "treyler-2", theme);

    // 3 — treyler kartasi
    await page.click(".list-scroll .row >> nth=1");
    await page.waitForTimeout(2500);
    await shoot(page, "treyler-3", theme);

    // 4 — sozlamalar (Telegram hisobotlari)
    await page.click(".sidebar-nav .nav-item >> nth=2");
    await page.waitForTimeout(1500);
    await shoot(page, "treyler-4", theme);
    await context.close();
  }
}

// ================================================================ TIME (FaceID)

const PEOPLE = [
  ["Aziz Karimov", "Office"], ["Dilnoza Rahimova", "Office"], ["Jasur Aliyev", "Warehouse"],
  ["Malika Yusupova", "Warehouse"], ["Sardor Tursunov", "IT"], ["Nodira Ismoilova", "Sales"],
  ["Bekzod Nazarov", "Warehouse"], ["Otabek Rashidov", "Security"], ["Kamola Saidova", "Office"],
  ["Rustam Qodirov", "IT"], ["Shahnoza Ergasheva", "Sales"], ["Farrux Usmonov", "Warehouse"],
  ["Madina Hakimova", "Office"], ["Timur Sobirov", "Security"], ["Gulnora Abdullayeva", "Sales"],
  ["Javlon Mirzayev", "Warehouse"], ["Zarina Tolipova", "Office"], ["Sherzod Xolmatov", "IT"],
];
const DEPARTMENTS = ["Office", "Warehouse", "IT", "Sales", "Security"].map((name, i) => ({ id: i + 1, name }));
const hm = (m) => `${String(Math.floor((((m % 1440) + 1440) % 1440) / 60)).padStart(2, "0")}:${String((((m % 1440) + 1440) % 1440) % 60).padStart(2, "0")}`;

function shiftDay(date, delta) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function attendanceRows() {
  const r = rng(1809);
  const nowMin = 15 * 60 + 40;
  return PEOPLE.map(([name, dept], i) => {
    const security = dept === "Security";
    const base = { id: 1000 + i, employee_id: i + 1, name, date: TODAY, carried: false, inside: false, department: dept, confirmed: true, is_manual: false, comment: "", overtime_minutes: 0, early_minutes: 0, marks: [] };
    if (security) {
      // Tunki smena: kecha 20:00 dan bugun 08:00 gacha
      return { ...base, date: shiftDay(TODAY, -1), carried: true, shift: "Night 20:00–08:00", plan: { start: -240, end: 480 }, segments: [{ start: -252, end: 486, minutes: 738, open: false }], check_in: "19:48", check_out: "08:06", worked_minutes: 738, required_minutes: 720, late_minutes: 0, calc_minutes: 18, status: "ok" };
    }
    const plan = dept === "Warehouse" ? { start: 480, end: 1020 } : { start: 540, end: 1080 };
    const shift = dept === "Warehouse" ? "Day 08:00–17:00" : "Office 09:00–18:00";
    if (i === 6 || i === 14) {
      return { ...base, shift, plan, segments: [], check_in: null, check_out: null, worked_minutes: 0, required_minutes: 480, late_minutes: 0, calc_minutes: -480, status: "absent" };
    }
    const late = [1, 5, 11, 16].includes(i) ? Math.round(8 + r() * 30) : 0;
    const start = plan.start + (late ? late : -Math.round(3 + r() * 20));
    const lunch = i % 3 === 0;
    const segments = lunch
      ? [{ start, end: 780, minutes: 780 - start, open: false }, { start: 832, end: null, minutes: nowMin - 832, open: true }]
      : [{ start, end: null, minutes: nowMin - start, open: true }];
    if (i === 12) segments[segments.length - 1] = { start: segments.at(-1).start, end: 905, minutes: 905 - segments.at(-1).start, open: false };
    const worked = segments.reduce((s, x) => s + x.minutes, 0);
    const open = segments.some((x) => x.open);
    return {
      ...base,
      inside: open,
      shift,
      plan,
      segments,
      check_in: hm(start),
      check_out: open ? null : hm(segments.at(-1).end),
      worked_minutes: worked,
      required_minutes: 480,
      late_minutes: late,
      calc_minutes: worked - 480,
      status: i === 12 ? "incomplete" : late ? "late" : "running",
    };
  });
}

function timeApi() {
  const r = rng(2026);
  const rows = attendanceRows();
  const company = { id: 1, name: "KattaBaza Demo", slug: "demo", is_active: true, telegram_chat_id: null, timezone: "Asia/Tashkent", utc_offset: "+05:00" };
  const sites = [
    { id: 1, name: "Tashkent · Head office", connected: true, client_version: "1.8.0", last_seen: `${TODAY} 15:39`, devices: [
      { id: 1, name: "Main entrance", device_key: "DS-K1T343", model: "DS-K1T343EFWX", direction: "IN/OUT", online: true, last_event: `${TODAY} 15:31` },
      { id: 2, name: "Reception", device_key: "DS-K1T671", model: "DS-K1T671TM", direction: "IN/OUT", online: true, last_event: `${TODAY} 15:12` } ] },
    { id: 2, name: "Chirchiq · Warehouse", connected: true, client_version: "1.8.0", last_seen: `${TODAY} 15:38`, devices: [
      { id: 3, name: "Warehouse gate", device_key: "DS-K1T341", model: "DS-K1T341AMF", direction: "IN/OUT", online: true, last_event: `${TODAY} 15:25` },
      { id: 4, name: "Loading dock", device_key: "DS-K1A802", model: "DS-K1A802AMF", direction: "OUT", online: false, last_event: `${TODAY} 09:02` } ] },
  ];
  const feed = Array.from({ length: 25 }, (_, k) => {
    const person = PEOPLE[(k * 5) % PEOPLE.length][0];
    const minute = 15 * 60 + 38 - k * 11 - Math.floor(r() * 6);
    return { id: 5000 - k, time: `${TODAY} ${hm(minute)}:${String(Math.floor(r() * 60)).padStart(2, "0")}`, name: person, employee_no: String(100 + k), direction: k % 4 === 1 ? "OUT" : k % 7 === 3 ? "BREAK_OUT" : "IN", device: ["Main entrance", "Warehouse gate", "Reception"][k % 3], linked: true };
  });
  const kunlar = Array.from({ length: 30 }, (_, k) => {
    const date = shiftDay(TODAY, k - 29);
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const jami = weekend ? 4 : 18;
    const kelgan = weekend ? 4 : 14 + Math.round(r() * 3);
    return { date, jami, kelgan, kechikkan: weekend ? 0 : Math.round(r() * 5), kelmagan: jami - kelgan, ishlangan_daqiqa: kelgan * 470 };
  });
  kunlar[29] = { date: TODAY, jami: 18, kelgan: 16, kechikkan: 4, kelmagan: 2, ishlangan_daqiqa: 16 * 390 };
  const hours = Array.from({ length: 24 }, (_, k) => {
    const hour = (16 + k) % 24;
    const count = hour >= 9 && hour <= 17 ? 12 + Math.round(r() * 4) : hour === 8 ? 9 : hour === 18 ? 7 : hour >= 20 || hour < 8 ? 2 : 4;
    return { hour, count, date: hour >= 16 ? shiftDay(TODAY, -1) : TODAY, now: k === 23 };
  });
  // Rasmda chiplar ikki qatorga sig'sin — ro'yxatdan faqat birinchi 8 tasi
  const inside = rows.filter((x) => x.inside).map((x) => ({ employee_id: x.employee_id, name: x.name, since: x.check_in })).slice(0, 8);

  const shifts = [
    { id: 1, name: "Office 09:00–18:00", shift_type: "fixed", start_time: "09:00", end_time: "18:00", work_minutes: 480, break_minutes: 60, auto_deduct_break: true, late_grace_minutes: 5, early_grace_minutes: 5, match_window_minutes: 180, weekdays: "12345", rotation_on: 0, rotation_off: 0, rotation_start: null, is_active: true },
    { id: 2, name: "Day 08:00–17:00", shift_type: "fixed", start_time: "08:00", end_time: "17:00", work_minutes: 480, break_minutes: 60, auto_deduct_break: true, late_grace_minutes: 10, early_grace_minutes: 5, match_window_minutes: 180, weekdays: "123456", rotation_on: 0, rotation_off: 0, rotation_start: null, is_active: true },
    { id: 3, name: "Night 20:00–08:00", shift_type: "night", start_time: "20:00", end_time: "08:00", work_minutes: 720, break_minutes: 0, auto_deduct_break: false, late_grace_minutes: 10, early_grace_minutes: 10, match_window_minutes: 240, weekdays: "", rotation_on: 2, rotation_off: 2, rotation_start: "2026-09-01", is_active: true },
    { id: 4, name: "Flexible 8h", shift_type: "flexible", start_time: "08:00", end_time: "20:00", work_minutes: 480, break_minutes: 30, auto_deduct_break: true, late_grace_minutes: 0, early_grace_minutes: 0, match_window_minutes: 240, weekdays: "12345", rotation_on: 0, rotation_off: 0, rotation_start: null, is_active: true },
  ];
  const shiftOf = (dept) => (dept === "Warehouse" ? shifts[1] : dept === "Security" ? shifts[2] : shifts[0]);
  const employees = PEOPLE.map(([full_name, dept], i) => ({
    id: i + 1, full_name, department_id: DEPARTMENTS.find((d) => d.name === dept).id, department: dept,
    position: null, phone: null, telegram_id: null, telegram_topic_id: null, notify_self: false, is_active: true,
    terminal_numbers: [String(100 + i)], terminals: [], sites: [dept === "Warehouse" ? 2 : 1],
    shift: { id: shiftOf(dept).id, name: shiftOf(dept).name, start_date: "2026-09-01", end_date: null, via_department: true },
  }));
  const assignments = [
    { id: 1, shift_id: 1, shift: shifts[0].name, target: "Office", is_department: true, start_date: "2026-09-01", end_date: null },
    { id: 2, shift_id: 2, shift: shifts[1].name, target: "Warehouse", is_department: true, start_date: "2026-09-01", end_date: null },
    { id: 3, shift_id: 3, shift: shifts[2].name, target: "Security", is_department: true, start_date: "2026-09-01", end_date: null },
    { id: 4, shift_id: 1, shift: shifts[0].name, target: "IT", is_department: true, start_date: "2026-09-01", end_date: null },
    { id: 5, shift_id: 4, shift: shifts[3].name, target: "Sales", is_department: true, start_date: "2026-09-15", end_date: null },
  ];

  return (url) => {
    const p = url.pathname;
    if (p === "/api/auth/me")
      return { id: 1, telegram_id: 100200300, full_name: "Aziz Karimov", role: "admin", language: "en", can_write: true, employee_id: null, companies: [{ id: 1, name: company.name }], timezone: "Asia/Tashkent", server_date: TODAY, server_time: "15:40" };
    if (p === "/api/companies") return [company];
    if (p === "/api/sites") return sites;
    if (p === "/api/events/recent") return feed;
    if (p === "/api/stats/trend")
      return {
        kunlar,
        bolimlar: DEPARTMENTS.map((d, k) => ({ bolim: d.name, jami: 3 + k, kechikkan: k % 3, ishlangan_daqiqa: [9400, 13800, 5600, 6900, 4300][k] * 10 })),
        kechikish_reytingi: [["Dilnoza Rahimova", 142, 6], ["Shahnoza Ergasheva", 118, 5], ["Nodira Ismoilova", 97, 4], ["Zarina Tolipova", 64, 3], ["Farrux Usmonov", 41, 2]].map(([name, daqiqa, marta], k) => ({ employee_id: k + 2, name, daqiqa, marta })),
        kelish_soatlari: [6, 7, 8, 9, 10, 11, 19, 20].map((soat) => ({ soat, soni: { 6: 3, 7: 21, 8: 128, 9: 176, 10: 24, 11: 8, 19: 17, 20: 9 }[soat] })),
      };
    if (p === "/api/stats/presence")
      return { rolling: true, date: TODAY, from: `${shiftDay(TODAY, -1)}T16:00`, to: `${TODAY}T15:40`, timezone: "Asia/Tashkent", hours, peak: { hour: 11, count: 16 }, now_inside: inside.length, inside };
    if (p === "/api/attendance") {
      const count = (s) => rows.filter((x) => x.status === s).length;
      return {
        date: TODAY,
        timezone: "Asia/Tashkent",
        axis: { start: `${TODAY}T00:00:00+05:00`, hours: 36, minutes: 2160 },
        rows,
        summary: { jami: rows.length, holatlar: { ok: count("ok"), late: count("late"), absent: count("absent") }, kechikkanlar: count("late"), kelmaganlar: count("absent"), toliqmas: count("incomplete"), otgan_kundan: rows.filter((x) => x.carried).length, hozir_ichkarida: inside.length },
        sync: { day: TODAY, cacheable: false, cached: false, can_fetch: false, pending: 0, devices: sites.flatMap((s) => s.devices.map((d) => ({ device_id: d.id, device: d.name, site_id: s.id, site: s.name, online: d.online, fetched: false, fetched_at: null, found: 0, error: "" }))) },
      };
    }
    if (p === "/api/departments") return DEPARTMENTS;
    if (p === "/api/shifts") return shifts;
    if (p === "/api/employees") return employees;
    if (p === "/api/shift-assignments") return assignments;
    if (p === "/api/cameras") return [];
    return p.startsWith("/api/auth/") ? { ok: true } : [];
  };
}

async function captureTime(browser) {
  console.log("time:");
  if (!existsSync(path.join(FACEID_DIST, "index.html"))) {
    console.log(`  frontend yig'ilmoqda -> ${FACEID_DIST}`);
    execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["vite", "build", "--outDir", FACEID_DIST, "--emptyOutDir"], { cwd: FACEID_SRC, stdio: "ignore", shell: true });
  }
  // "Platforma yangilanmoqda" vaqtinchalik yozuvi reklama rasmida kerak emas
  const hideNotice =
    ".notice-bar{display:none!important}" +
    ".shell .sidebar{top:0!important;height:100vh!important}" +
    ".shell .main>.topbar{top:0!important}" +
    ".login-wrap-notice{min-height:100vh!important}";

  for (const theme of THEMES) {
    // 1-3 — ichki sahifalar
    const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
    await context.addInitScript(([th]) => {
      localStorage.setItem("faceid.theme", th);
      localStorage.setItem("faceid.language", "en");
      localStorage.setItem("faceid.company", "1");
    }, [theme]);
    await serve(context, "http://time.demo", FACEID_DIST, timeApi());
    const page = await context.newPage();
    await page.clock.setFixedTime(NOW);

    for (const [id, route] of [["time-1", "/dashboard"], ["time-2", "/attendance"], ["time-3", "/shifts"]]) {
      await page.goto(`http://time.demo${route}`);
      await page.addStyleTag({ content: hideNotice });
      await page.waitForTimeout(1800);
      await shoot(page, id, theme);
    }
    await context.close();

    // 4 — Telegram orqali kirish sahifasi (xarita foni bilan)
    const login = await browser.newContext({ viewport: VIEWPORT, colorScheme: theme });
    await login.addInitScript(([th]) => {
      localStorage.setItem("faceid.theme", th);
      localStorage.setItem("faceid.language", "en");
    }, [theme]);
    await login.route("http://time.demo/api/**", (route) => route.fulfill({ status: 401, contentType: "application/json", body: '{"detail":"401"}' }));
    await serve(login, "http://time.demo", FACEID_DIST, () => undefined);
    const lp = await login.newPage();
    await lp.goto("http://time.demo/");
    await lp.addStyleTag({ content: hideNotice });
    await lp.waitForTimeout(1500);
    await shoot(lp, "time-4", theme);
    await login.close();
  }
}

// ================================================================ MED (o'zimizning slaydlar)

async function captureMed(browser) {
  console.log("med:");
  const html = path.join(ROOT, "tools", "slides", "slides.html");
  for (const theme of THEMES) {
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    for (const id of ["med-1", "med-2"]) {
      await page.goto(`file:///${html.replaceAll("\\", "/")}?theme=${theme}#${id}`);
      await page.waitForTimeout(800);
      await shoot(page, id, theme);
    }
    await context.close();
  }
}

// ================================================================

if (!CHROME) throw new Error("Chrome yoki Edge topilmadi (CHROME_PATH bilan ko'rsating)");
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const only = process.argv[2];
try {
  if (!only || only === "treyler") await captureTreyler(browser);
  if (!only || only === "time") await captureTime(browser);
  if (!only || only === "med") await captureMed(browser);
} finally {
  await browser.close();
}
