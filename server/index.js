// KattaBaza server: yig'ilgan saytni (dist/) beradi va /api so'rovlariga javob qaytaradi.
// Tashqi bog'liqlik yo'q — faqat Node.js (24+).
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { config } from "./config.js";
import { clientIp, lookup } from "./ip.js";
import { checkPassword, getKeys, issueToken, verifyToken } from "./keys.js";
import { getCatalog } from "./sheets.js";

// ---------- Yordamchilar ----------

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

function json(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
}

async function readJson(req, limit = 4096) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("too large"), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || "{}");
  } catch {
    throw Object.assign(new Error("bad json"), { status: 400 });
  }
}

// Oddiy so'rov cheklovchi: har bir IP uchun oynada N ta so'rov
function limiter(max, windowMs) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
  }, windowMs).unref();
  return (key) => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return 0;
    }
    entry.count += 1;
    return entry.count > max ? Math.ceil((entry.start + windowMs - now) / 1000) : 0;
  };
}

const ipLimit = limiter(40, 60_000);
const unlockLimit = limiter(8, 10 * 60_000);

// ---------- API ----------

async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  const who = clientIp(req);

  if (route === "GET /api/health") return json(res, 200, { ok: true });

  if (route === "GET /api/catalog") {
    try {
      return json(res, 200, await getCatalog(), { "Cache-Control": "public, max-age=60" });
    } catch (err) {
      console.error("[catalog]", err.message);
      return json(res, 502, { error: "catalog_unavailable" });
    }
  }

  if (route === "GET /api/ip") {
    const wait = ipLimit(who);
    if (wait) return json(res, 429, { error: "rate_limited", retryAfter: wait }, { "Retry-After": String(wait) });
    const q = url.searchParams.get("q") || who;
    try {
      return json(res, 200, await lookup(q));
    } catch (err) {
      return json(res, err.status || 502, { error: err.status ? err.message : "lookup_failed" });
    }
  }

  if (route === "POST /api/keys/unlock") {
    const wait = unlockLimit(who);
    if (wait) return json(res, 429, { error: "rate_limited", retryAfter: wait }, { "Retry-After": String(wait) });
    const { password } = await readJson(req);
    if (!checkPassword(password)) return json(res, 401, { error: "wrong_password" });
    const session = issueToken();
    return json(res, 200, { ...session, keys: await getKeys() });
  }

  if (route === "GET /api/keys") {
    const auth = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const session = verifyToken(auth);
    if (!session) return json(res, 401, { error: "session_expired" });
    return json(res, 200, { expiresAt: session.expiresAt, keys: await getKeys() });
  }

  return json(res, 404, { error: "not_found" });
}

// ---------- Statik fayllar (SPA) ----------

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

async function fileAt(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const full = path.resolve(config.distDir, "." + path.posix.normalize(decoded));
  if (!full.startsWith(config.distDir + path.sep) && full !== config.distDir) return null;
  try {
    const info = await stat(full);
    return info.isFile() ? { full, info } : null;
  } catch {
    return null;
  }
}

function stream(req, res, { full, info }, cache) {
  const headers = {
    ...SECURITY_HEADERS,
    "Content-Type": TYPES[path.extname(full).toLowerCase()] || "application/octet-stream",
    "Content-Length": info.size,
    "Cache-Control": cache,
  };
  res.writeHead(200, headers);
  if (req.method === "HEAD") return res.end();
  createReadStream(full).pipe(res);
}

async function handleStatic(req, res, url) {
  const file = await fileAt(url.pathname);
  if (file) {
    // Vite fayl nomiga hash qo'shadi — /assets/ abadiy keshlanadi
    const immutable = url.pathname.startsWith("/assets/");
    return stream(req, res, file, immutable ? "public, max-age=31536000, immutable" : "public, max-age=300");
  }
  // Kengaytmali fayl topilmasa — 404; qolgani React marshrutlari
  if (path.extname(url.pathname)) return send(res, 404, "Not found", { "Content-Type": "text/plain" });
  const index = await fileAt("/index.html");
  if (!index) return send(res, 503, "Sayt hali yig'ilmagan: npm run build", { "Content-Type": "text/plain; charset=utf-8" });
  return stream(req, res, index, "no-cache");
}

// ---------- Server ----------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed");
    return await handleStatic(req, res, url);
  } catch (err) {
    console.error(`[server] ${req.method} ${url.pathname}:`, err);
    if (!res.headersSent) json(res, err.status || 500, { error: err.status ? err.message : "server_error" });
    else res.end();
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`[server] ${config.port}-port band — server allaqachon ishlayapti.`);
    process.exit(2);
  }
  throw err;
});

server.listen(config.port, config.host, () => {
  console.log(`[server] KattaBaza: http://${config.host}:${config.port}`);
});
