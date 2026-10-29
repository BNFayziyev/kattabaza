// Tashrif statistikasi: har bir ko'rilgan sahifa data/visits.jsonl ga yoziladi,
// hisob-kitob xotiradagi ro'yxatdan qilinadi. Tashqi bog'liqlik yo'q.
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";
import { getSite } from "./site.js";

const FILE = path.join(config.dataDir, "visits.jsonl");
const MAX_EVENTS = 300_000;
const ONLINE_MS = 5 * 60_000;
const TZ = "Asia/Tashkent";

const CLICKS_FILE = path.join(config.dataDir, "clicks.jsonl");

let events = [];
let clicks = [];
const ready = (async () => {
  try {
    for (const line of (await readFile(CLICKS_FILE, "utf8")).split("\n")) {
      if (!line) continue;
      try {
        clicks.push(JSON.parse(line));
      } catch {}
    }
    clicks = clicks.slice(-MAX_EVENTS);
  } catch {}
  try {
    for (const line of (await readFile(FILE, "utf8")).split("\n")) {
      if (!line) continue;
      try {
        events.push(JSON.parse(line));
      } catch {}
    }
    events = events.slice(-MAX_EVENTS);
  } catch {}
})();

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python|node-fetch|headless/i;

function parseUa(ua) {
  const device = /ipad|tablet/i.test(ua) ? "Planshet" : /mobi|android|iphone/i.test(ua) ? "Telefon" : "Kompyuter";
  const browser =
    /edg\//i.test(ua) ? "Edge" :
    /opr\/|opera/i.test(ua) ? "Opera" :
    /yabrowser/i.test(ua) ? "Yandex" :
    /samsungbrowser/i.test(ua) ? "Samsung" :
    /chrome|crios/i.test(ua) ? "Chrome" :
    /firefox|fxios/i.test(ua) ? "Firefox" :
    /safari/i.test(ua) ? "Safari" : "Boshqa";
  const os =
    /windows/i.test(ua) ? "Windows" :
    /android/i.test(ua) ? "Android" :
    /iphone|ipad|ios/i.test(ua) ? "iOS" :
    /mac os/i.test(ua) ? "macOS" :
    /linux/i.test(ua) ? "Linux" : "Boshqa";
  return { device, browser, os };
}

function refHost(ref) {
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    return h.endsWith("kattabaza.uz") ? "" : h;
  } catch {
    return "";
  }
}

export function track(req, ip, body) {
  const ua = String(req.headers["user-agent"] || "");
  const p = String(body.path || "").slice(0, 200);
  if (!p.startsWith("/") || p.startsWith("/admin") || BOT_RE.test(ua) || getSite().ignoreIps.includes(ip)) return;
  const ev = {
    t: Date.now(),
    sid: String(body.sid || "").slice(0, 40),
    ip,
    cc: String(req.headers["cf-ipcountry"] || "").toUpperCase().slice(0, 2),
    path: p,
    ref: refHost(String(body.ref || "")),
    ...parseUa(ua),
  };
  events.push(ev);
  if (events.length > MAX_EVENTS) events = events.slice(-MAX_EVENTS);
  ready
    .then(() => mkdir(config.dataDir, { recursive: true }))
    .then(() => appendFile(FILE, JSON.stringify(ev) + "\n"))
    .catch((err) => console.error("[stats]", err.message));
}

// Yuklab olish / ochish bosilishlari (ilova kartalaridan)
export function trackClick(req, ip, body) {
  const ua = String(req.headers["user-agent"] || "");
  const url = String(body.url || "").slice(0, 500);
  if (!url || BOT_RE.test(ua) || getSite().ignoreIps.includes(ip)) return;
  const ev = {
    t: Date.now(),
    sid: String(body.sid || "").slice(0, 40),
    ip,
    cc: String(req.headers["cf-ipcountry"] || "").toUpperCase().slice(0, 2),
    id: String(body.id || "").slice(0, 80),
    title: String(body.title || "").slice(0, 120),
    url,
  };
  clicks.push(ev);
  if (clicks.length > MAX_EVENTS) clicks = clicks.slice(-MAX_EVENTS);
  ready
    .then(() => mkdir(config.dataDir, { recursive: true }))
    .then(() => appendFile(CLICKS_FILE, JSON.stringify(ev) + "\n"))
    .catch((err) => console.error("[stats]", err.message));
}

export function exportCsv() {
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = events.map((e) => [new Date(e.t).toISOString(), e.ip, e.cc, e.path, e.ref, e.device, e.browser, e.os].map(q).join(","));
  return ["time,ip,country,path,referrer,device,browser,os", ...rows].join("\n");
}

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const day = (t) => dayFmt.format(t);

const countBy = (list, key, limit = 10) => {
  const m = new Map();
  for (const e of list) if (e[key]) m.set(e[key], (m.get(e[key]) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));
};

export function buildStats(days) {
  days = Math.min(Math.max(days, 1), 365);
  const now = Date.now();
  const list = events.filter((e) => e.t >= now - days * 86_400_000);
  const uniq = (l) => new Set(l.map((e) => e.sid || e.ip)).size;

  const byDay = new Map();
  for (let i = days - 1; i >= 0; i--) byDay.set(day(now - i * 86_400_000), []);
  for (const e of list) byDay.get(day(e.t))?.push(e);

  const today = byDay.get(day(now)) || [];
  const online = events.filter((e) => now - e.t < ONLINE_MS);

  // Har tashrifchining oxirgi harakati
  const last = new Map();
  for (const e of events.slice(-5000)) last.set(e.sid || e.ip, e);

  const from = now - days * 86_400_000;
  const dl = clicks.filter((c) => c.t >= from);
  const dlDay = new Map([...byDay.keys()].map((d) => [d, 0]));
  for (const c of dl) if (dlDay.has(day(c.t))) dlDay.set(day(c.t), dlDay.get(day(c.t)) + 1);
  const perApp = new Map();
  for (const c of clicks) {
    const key = c.id || c.url;
    const a = perApp.get(key) || { id: c.id, title: c.title || c.url, all: 0, period: 0, last: 0 };
    a.all += 1;
    if (c.t >= from) a.period += 1;
    a.last = Math.max(a.last, c.t);
    perApp.set(key, a);
  }

  return {
    days,
    downloads: {
      total: dl.length,
      today: dlDay.get(day(now)) || 0,
      allTime: clicks.length,
      series: [...dlDay].map(([date, count]) => ({ date, count })),
      apps: [...perApp.values()].sort((a, b) => b.period - a.period || b.all - a.all).slice(0, 500),
      recent: clicks.slice(-30).reverse().map((c) => ({ t: c.t, title: c.title || c.url, ip: c.ip, cc: c.cc, url: c.url })),
    },
    totals: {
      views: list.length,
      visitors: uniq(list),
      viewsToday: today.length,
      visitorsToday: uniq(today),
      online: uniq(online),
      allTime: events.length,
    },
    series: [...byDay].map(([date, l]) => ({ date, views: l.length, visitors: uniq(l) })),
    pages: countBy(list, "path", 12),
    countries: countBy(list, "cc"),
    devices: countBy(list, "device"),
    browsers: countBy(list, "browser"),
    systems: countBy(list, "os"),
    referrers: countBy(list, "ref"),
    recent: [...last.values()]
      .sort((a, b) => b.t - a.t)
      .slice(0, 40)
      .map((e) => ({
        t: e.t, ip: e.ip, cc: e.cc, path: e.path, ref: e.ref,
        device: e.device, browser: e.browser, os: e.os,
        online: now - e.t < ONLINE_MS,
      })),
  };
}
