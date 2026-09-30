// Sozlamalar faqat .env dan o'qiladi — kodda maxfiy narsa saqlanmaydi.
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const envFile = path.join(ROOT, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const env = process.env;
const list = (value, fallback) =>
  value ? value.split(",").map((s) => s.trim()).filter(Boolean) : fallback;

if (!env.SECRET_KEY) {
  console.warn("[config] SECRET_KEY yo'q — har ishga tushishda yangisi yaratiladi (kalit sessiyalari uziladi).");
}

export const config = {
  port: Number(env.PORT) || 8090,
  // cloudflared shu kompyuterda ishlaydi, shuning uchun tashqariga ochish shart emas
  host: env.HOST || "127.0.0.1",
  distDir: path.join(ROOT, "dist"),
  dataDir: path.join(ROOT, "data"),

  sheetId: env.SHEET_ID || "",
  materialsTab: env.MATERIALS_TAB || "Materials",
  channelsTab: env.CHANNELS_TAB || "Channels",
  cacheSeconds: Number(env.CACHE_SECONDS) || 120,

  keysSheetId: env.KEYS_SHEET_ID || env.SHEET_ID || "",
  keysTabs: list(env.KEYS_TABS, ["key_list"]),
  // KEYS_PASSWORD berilsa — doimiy parol; bo'sh bo'lsa — vaqtga bog'liq parol
  keysPassword: env.KEYS_PASSWORD || "",
  keysPrefix: env.KEYS_PASSWORD_PREFIX ?? "Kitob",
  keysOffsetMin: Number(env.KEYS_PASSWORD_OFFSET_MIN ?? 71),
  keysTimezone: env.KEYS_TIMEZONE || "Asia/Tashkent",
  keysSessionMin: Number(env.KEYS_SESSION_MINUTES) || 30,

  secret: env.SECRET_KEY || crypto.randomBytes(32).toString("hex"),
};
