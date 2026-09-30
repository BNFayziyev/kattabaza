// Kalitlar: parol serverda tekshiriladi, kalitlar faqat to'g'ri paroldan
// keyin yuboriladi. Brauzerga parol formulasi ham, kalitlar ham oldindan tushmaydi.
import crypto from "node:crypto";
import { config } from "./config.js";
import { readTab } from "./sheets.js";

// ---------- Parol ----------

function timeCode(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: config.keysTimezone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const total = (((hour * 60 + minute + config.keysOffsetMin) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${config.keysPrefix}${hh}${mm}`;
}

// Vaqtli parol daqiqa almashganda ham o'tishi uchun ±1 daqiqa qabul qilinadi
function acceptedPasswords(now = Date.now()) {
  if (config.keysPassword) return [config.keysPassword];
  return [-1, 0, 1].map((d) => timeCode(new Date(now + d * 60_000)));
}

const digest = (s) => crypto.createHash("sha256").update(String(s)).digest();

export function checkPassword(entered) {
  const got = digest(String(entered || "").trim());
  return acceptedPasswords().some((p) => crypto.timingSafeEqual(got, digest(p)));
}

// ---------- Sessiya tokeni (bazasiz, imzolangan) ----------

const sign = (payload) =>
  crypto.createHmac("sha256", config.secret).update(payload).digest("base64url");

export function issueToken() {
  const expiresAt = Date.now() + config.keysSessionMin * 60_000;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export function verifyToken(token) {
  const [payload, mac] = String(token || "").split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return exp > Date.now() ? { expiresAt: exp } : null;
  } catch {
    return null;
  }
}

// ---------- Kalitlar ro'yxati ----------
// Jadval ustunlari har xil nomlangan bo'lishi mumkin, shuning uchun
// qiymat bir nechta ehtimoliy ustundan qidiriladi (eski mantiq saqlangan).

const pick = (row, names) => {
  for (const n of names) {
    const v = row[n];
    if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
  }
  return "";
};

const looksLikeKey = (s) => {
  const t = String(s || "").trim();
  if (t.length < 8) return false;
  if (/(^https?:\/\/)|^\d+\s*MB$/i.test(t)) return false;
  return /[A-Za-z0-9]/.test(t);
};

const KEY_FIELDS = ["key", "Key", "KEY", "value", "license_key", "api_key", "serial", "kalit", "Kalit", "kod", "Kod", "shifr", "license", "material_key", "secret"];
const DOMAIN_FIELDS = ["A", "domain", "Domain", "DOMAIN", "domen", "Domen", "site", "website", "url", "host", "sayt"];
const NAME_FIELDS = ["B", "key_name", "keyName", "Key name", "key nomi", "name", "label", "nomi", "title"];
const SKIP = new Set(["categories", "preview_url", "post_link", "file_url", "description", "size_mb", "file_type", "id", "channel_ID", "image", "Image"]);

function keyValueOf(row) {
  const direct = pick(row, KEY_FIELDS);
  if (direct && looksLikeKey(direct)) return direct;
  let best = "";
  for (const [col, val] of Object.entries(row)) {
    if (SKIP.has(col)) continue;
    const t = String(val ?? "").trim();
    if (t.length < 8) continue;
    if (col.toLowerCase().includes("key") && looksLikeKey(t)) return t;
    if (t.length > 20 && t.length >= best.length && looksLikeKey(t)) best = t;
  }
  return best;
}

export async function getKeys() {
  let rows = [];
  for (const tab of config.keysTabs) {
    try {
      rows = await readTab(config.keysSheetId, tab, { persist: false });
      if (rows.length) break;
    } catch {}
  }
  return rows
    .map((row, i) => {
      const value = keyValueOf(row);
      if (!value) return null;
      return {
        id: String(row.id ?? row.ID ?? `k-${i}`),
        domain: pick(row, DOMAIN_FIELDS),
        label: pick(row, NAME_FIELDS),
        secret: value,
      };
    })
    .filter(Boolean)
    .reverse();
}
