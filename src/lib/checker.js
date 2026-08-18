/**
 * KattaBaza — Security checker (email / domain / link)
 *
 * Runs entirely IN THE BROWSER, no server needed:
 *  • DNS via DNS-over-HTTPS (Cloudflare, falling back to Google) — free, no key
 *  • Link/scam analysis via rules + brand-impersonation detection
 *
 * ⚠️ LIMITATION: a browser cannot fetch an arbitrary third-party page (CORS),
 * so the link check never OPENS the target. It analyses the address structure
 * and DNS only. Useful for spotting phishing, but NOT a guarantee.
 *
 * All findings are returned as `{ level, code, params }` so the UI can render
 * them in any language. Never return user-facing prose from this file.
 */

// Cloudflare REQUIRES the `accept: application/dns-json` header (400 without it
// — verified). Google works with no headers, so it is the fallback.
const DOH_PROVIDERS = [
  { url: "https://cloudflare-dns.com/dns-query", headers: { accept: "application/dns-json" } },
  { url: "https://dns.google/resolve", headers: {} },
];

export async function dnsQuery(name, type = "A") {
  const qs = `?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  for (const p of DOH_PROVIDERS) {
    try {
      const res = await fetch(p.url + qs, { headers: p.headers });
      if (!res.ok) continue;
      const json = await res.json();
      if (json && typeof json.Status === "number") return json;
    } catch {
      /* try next provider */
    }
  }
  return null;
}

/**
 * Sort MX by numeric priority.
 * ⚠️ Plain .sort() compares as text: "10","20","5" — the primary server (5)
 * would end up last.
 */
export function sortMx(records) {
  return [...records].sort((a, b) => {
    const pa = parseInt(a, 10);
    const pb = parseInt(b, 10);
    if (Number.isNaN(pa) || Number.isNaN(pb)) return a.localeCompare(b);
    return pa - pb;
  });
}

// ---------------------------------------------------------------
// Data
// ---------------------------------------------------------------

export const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "throwawaymail.com", "yopmail.com", "trashmail.com",
  "getnada.com", "maildrop.cc", "sharklasers.com", "grr.la", "dispostable.com",
  "fakeinbox.com", "mytemp.email", "mohmal.com", "emailondeck.com",
  "tempail.com", "moakt.com", "tempmailo.com", "1secmail.com", "inboxkitten.com",
]);

const POPULAR_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "mail.ru",
  "yandex.ru", "yandex.com", "icloud.com", "proton.me", "protonmail.com",
  "inbox.uz", "umail.uz", "bk.ru", "list.ru", "internet.ru",
];

const ROLE_LOCALS = new Set([
  "admin", "info", "support", "sales", "contact", "help", "no-reply",
  "noreply", "webmaster", "postmaster", "abuse", "office", "hello",
]);

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly",
  "cutt.ly", "shorturl.at", "rb.gy", "rebrand.ly", "s.id", "clck.ru",
  "vk.cc", "tiny.cc", "shorte.st", "adf.ly", "bc.vc",
]);

const RISKY_TLD = new Set([
  "zip", "mov", "xyz", "top", "click", "link", "gq", "cf", "ml", "ga", "tk",
  "work", "country", "kim", "loan", "download", "racing", "win", "review",
  "cam", "rest", "quest", "cfd", "sbs",
]);

const PHISHY_WORDS = [
  "login", "signin", "verify", "verification", "account", "update", "secure",
  "security", "confirm", "password", "unlock", "suspended", "recovery",
  "invoice", "payment",
];

/** Money / crypto / lottery scam vocabulary */
const SCAM_WORDS = [
  "airdrop", "giveaway", "free-crypto", "guaranteed", "investment",
  "profit", "lottery", "jackpot", "congratulation", "you-won", "youwon",
  "winner", "prize", "claim-now", "claimnow", "limited-time",
  "act-now", "bonus", "casino", "betting", "forex", "quick-money",
  "earn-money", "easy-money", "work-from-home", "crypto-gift", "reward",
];

/**
 * Well-known brands and their legitimate registrable domains.
 * If a brand name appears in the host but the registrable domain is NOT in the
 * list, that is a strong impersonation signal.
 */
const BRANDS = {
  paypal: ["paypal.com"],
  google: ["google.com", "google.uz", "google.ru", "youtube.com", "goo.gl"],
  apple: ["apple.com", "icloud.com"],
  microsoft: ["microsoft.com", "live.com", "office.com", "outlook.com"],
  amazon: ["amazon.com"],
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  telegram: ["telegram.org", "telegram.me", "t.me"],
  whatsapp: ["whatsapp.com"],
  netflix: ["netflix.com"],
  binance: ["binance.com"],
  coinbase: ["coinbase.com"],
  metamask: ["metamask.io"],
  sberbank: ["sberbank.ru", "sber.ru"],
  tinkoff: ["tinkoff.ru", "tbank.ru"],
  alfabank: ["alfabank.ru"],
  uzcard: ["uzcard.uz"],
  humo: ["humo.uz"],
  payme: ["payme.uz"],
  uzum: ["uzum.uz"],
  beeline: ["beeline.uz", "beeline.ru"],
  ucell: ["ucell.uz"],
  wildberries: ["wildberries.ru"],
  ozon: ["ozon.ru"],
  steam: ["steampowered.com", "steamcommunity.com"],
  discord: ["discord.com", "discord.gg"],
};

/** Two-level public suffixes we care about */
const MULTI_TLD = new Set([
  "co.uk", "org.uk", "ac.uk", "co.jp", "com.au", "com.br", "com.tr",
  "com.uz", "org.uz", "net.uz", "gov.uz", "co.in", "com.cn", "com.ua",
]);

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

export function suggestDomain(domain) {
  if (!domain || POPULAR_DOMAINS.includes(domain)) return null;
  let best = null;
  let bestDist = Infinity;
  for (const d of POPULAR_DOMAINS) {
    const dist = levenshtein(domain, d);
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return bestDist > 0 && bestDist <= 2 ? best : null;
}

export function isIpHost(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return host.split(".").every((o) => Number(o) <= 255);
  }
  return host.startsWith("[") && host.endsWith("]");
}

export function tldOf(host) {
  const parts = host.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/** "a.b.example.co.uk" -> "example.co.uk" */
export function registrableDomain(host) {
  const parts = String(host || "").toLowerCase().split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_TLD.has(lastTwo)) return parts.slice(-3).join(".");
  return lastTwo;
}

export function hasIdnRisk(host) {
  if (host.toLowerCase().includes("xn--")) return true;
  return /[^\x00-\x7F]/.test(host);
}

/** Brand name present in host but registrable domain is not the brand's? */
export function detectImpersonation(host) {
  const h = String(host || "").toLowerCase();
  const reg = registrableDomain(h);
  for (const [brand, legit] of Object.entries(BRANDS)) {
    if (!h.includes(brand)) continue;
    if (legit.includes(reg)) return null;      // genuine
    return { brand, actual: reg };
  }
  return null;
}

const note = (level, code, params) => ({ level, code, ...(params ? { params } : {}) });

// ---------------------------------------------------------------
// 1. EMAIL
// ---------------------------------------------------------------

const EMAIL_RE =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@([A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export function checkEmailSyntax(input) {
  const value = String(input || "").trim();
  const notes = [];

  if (!value) return { ok: false, notes: [note("error", "empty")] };
  if (value.length > 254) notes.push(note("error", "tooLong"));

  const at = value.lastIndexOf("@");
  if (at < 1) return { ok: false, notes: [note("error", "noAt")] };

  const local = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();

  const valid = EMAIL_RE.test(value);
  if (!valid) notes.push(note("error", "badFormat"));
  if (local.length > 64) notes.push(note("error", "localTooLong"));
  if (/\.\./.test(value)) notes.push(note("error", "doubleDots"));
  if (DISPOSABLE.has(domain)) notes.push(note("warn", "disposable"));
  if (ROLE_LOCALS.has(local.toLowerCase())) notes.push(note("info", "roleAccount"));
  if (hasIdnRisk(domain)) notes.push(note("warn", "idnDomain"));

  const suggestion = suggestDomain(domain);
  if (suggestion) notes.push(note("warn", "typo", { domain: suggestion }));

  return {
    ok: valid && local.length <= 64 && value.length <= 254,
    local, domain, suggestion, notes,
  };
}

export async function checkEmailDns(domain) {
  const [mx, a] = await Promise.all([dnsQuery(domain, "MX"), dnsQuery(domain, "A")]);
  if (!mx && !a) return { reachable: null, records: [], code: "dnsFailed" };

  const mxRecords = sortMx((mx?.Answer || []).filter((r) => r.type === 15).map((r) => r.data));
  if (mxRecords.length) return { reachable: true, records: mxRecords, via: "MX" };

  const aRecords = (a?.Answer || []).filter((r) => r.type === 1).map((r) => r.data);
  if (aRecords.length) return { reachable: true, records: aRecords, via: "A" };

  const nx = mx?.Status === 3 || a?.Status === 3;
  return { reachable: false, records: [], code: nx ? "notRegistered" : "noMailServer" };
}

// ---------------------------------------------------------------
// 2. DOMAIN
// ---------------------------------------------------------------

export function normalizeDomain(input) {
  let s = String(input || "").trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, "");
  s = s.split("/")[0].split("?")[0].split("#")[0];
  s = s.replace(/^www\./, "").replace(/\.$/, "");
  return s;
}

export function isValidDomain(domain) {
  if (!domain || domain.length > 253) return false;
  return /^([a-z0-9¡-￿](?:[a-z0-9¡-￿-]{0,61}[a-z0-9¡-￿])?\.)+[a-z¡-￿]{2,}$/i.test(domain);
}

export async function checkDomain(input) {
  const domain = normalizeDomain(input);
  if (!isValidDomain(domain)) {
    return { domain, valid: false, notes: [note("error", "invalidDomain")] };
  }

  const [a, aaaa, mx, ns, txt] = await Promise.all([
    dnsQuery(domain, "A"), dnsQuery(domain, "AAAA"), dnsQuery(domain, "MX"),
    dnsQuery(domain, "NS"), dnsQuery(domain, "TXT"),
  ]);

  const pick = (r, type) => (r?.Answer || []).filter((x) => x.type === type).map((x) => x.data);
  const txtRecords = pick(txt, 16).map((s) => s.replace(/^"|"$/g, ""));
  const spf = txtRecords.find((r) => r.toLowerCase().startsWith("v=spf1")) || null;

  const dmarcRes = await dnsQuery(`_dmarc.${domain}`, "TXT");
  const dmarc = (dmarcRes?.Answer || [])
    .filter((x) => x.type === 16)
    .map((x) => x.data.replace(/^"|"$/g, ""))
    .find((r) => r.toLowerCase().startsWith("v=dmarc1")) || null;

  const notes = [];
  const registered = ns?.Status !== 3 && (pick(ns, 2).length > 0 || pick(a, 1).length > 0);
  const imp = detectImpersonation(domain);

  if (!registered) notes.push(note("warn", "notRegistered"));
  if (RISKY_TLD.has(tldOf(domain))) notes.push(note("warn", "riskyTld", { tld: tldOf(domain) }));
  if (hasIdnRisk(domain)) notes.push(note("warn", "idnDomain"));
  if (imp) notes.push(note("error", "impersonation", imp));
  if (pick(mx, 15).length && !spf) notes.push(note("warn", "noSpf"));
  if (pick(mx, 15).length && !dmarc) notes.push(note("info", "noDmarc"));
  if (a?.AD) notes.push(note("good", "dnssec"));

  return {
    domain, valid: true, registered, impersonation: imp,
    records: {
      A: pick(a, 1), AAAA: pick(aaaa, 28), MX: sortMx(pick(mx, 15)),
      NS: pick(ns, 2).sort(), TXT: txtRecords,
    },
    spf, dmarc, notes,
  };
}

// ---------------------------------------------------------------
// 3. LINK / SCAM
// ---------------------------------------------------------------

export function parseUrl(input) {
  let s = String(input || "").trim();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

/**
 * Analyse a link. Returns a 0–100 risk score and a verdict.
 * Higher score = more suspicious.
 */
export function analyzeUrl(input) {
  const url = parseUrl(input);
  if (!url) return { valid: false, notes: [note("error", "badUrl")], risk: 0, verdict: "unknown" };

  const host = url.hostname.toLowerCase();
  const notes = [];
  let risk = 0;
  const add = (level, code, points = 0, params) => {
    notes.push(note(level, code, params));
    risk += points;
  };

  // --- Brand impersonation: the strongest scam signal ---
  const imp = detectImpersonation(host);
  if (imp) add("error", "impersonation", 45, imp);

  if (url.protocol === "https:") add("good", "httpsOk");
  else add("warn", "noHttps", 20);

  if (url.username || url.password) add("error", "credsInUrl", 40);
  if (isIpHost(host)) add("warn", "ipHost", 30);
  if (hasIdnRisk(host)) add("error", "idnRisk", 45);
  if (SHORTENERS.has(host)) add("warn", "shortener", 20);
  if (RISKY_TLD.has(tldOf(host))) add("warn", "riskyTld", 15, { tld: tldOf(host) });

  const labels = host.split(".");
  if (labels.length >= 5) add("warn", "manyLabels", 15, { count: labels.length });
  if (host.length > 40) add("info", "longHost", 5);
  if ((host.match(/-/g) || []).length >= 3) add("warn", "manyHyphens", 10);
  if (url.port && !["80", "443", ""].includes(url.port)) {
    add("warn", "oddPort", 10, { port: url.port });
  }

  const full = (url.pathname + url.search).toLowerCase();
  const haystack = host + full;

  const phishy = PHISHY_WORDS.filter((w) => haystack.includes(w));
  if (phishy.length) {
    add("warn", "phishyWords", Math.min(20, phishy.length * 7), { words: phishy.slice(0, 4) });
  }

  const scam = SCAM_WORDS.filter((w) => haystack.includes(w));
  if (scam.length) {
    add("error", "scamWords", Math.min(35, scam.length * 12), { words: scam.slice(0, 4) });
  }

  if (/\.(exe|scr|bat|cmd|apk|msi|jar|vbs|ps1)$/i.test(url.pathname)) {
    add("warn", "executable", 20);
  }
  if (url.pathname.length > 100) add("info", "longPath", 5);

  // Combined signals are worse than isolated ones
  if (phishy.length && (isIpHost(host) || url.protocol !== "https:")) {
    add("error", "riskyCombo", 15);
  }
  if (scam.length && RISKY_TLD.has(tldOf(host))) add("error", "scamCombo", 15);

  risk = Math.max(0, Math.min(100, risk));
  return {
    valid: true, url, host, registrable: registrableDomain(host), impersonation: imp,
    protocol: url.protocol.replace(":", ""), risk, verdict: verdictOf(risk), notes,
  };
}

/** risk score -> verdict key (the UI translates it) */
export function verdictOf(risk) {
  if (risk >= 60) return "dangerous";
  if (risk >= 30) return "suspicious";
  if (risk > 0) return "minor";
  return "clean";
}

export async function checkUrlDns(host) {
  if (!host || isIpHost(host)) return null;
  const a = await dnsQuery(host, "A");
  if (!a) return null;
  if (a.Status === 3) return { exists: false };
  const ips = (a.Answer || []).filter((r) => r.type === 1).map((r) => r.data);
  return { exists: ips.length > 0, ips };
}

// ===============================================================
// 4. DEEP LINK ANALYSIS
// ===============================================================

/**
 * RDAP — the modern replacement for WHOIS. Gives the registration date,
 * which is one of the strongest scam signals: almost every phishing domain
 * is only days or weeks old.
 *
 * rdap.org bootstraps to the right registry for any TLD. Verisign is a direct
 * fallback for .com/.net. If every endpoint fails we return null and the UI
 * simply omits the age section — the check must never crash on this.
 */
export async function rdapLookup(domain) {
  const tld = tldOf(domain);
  const endpoints = [`https://rdap.org/domain/${encodeURIComponent(domain)}`];
  if (tld === "com" || tld === "net") {
    endpoints.push(`https://rdap.verisign.com/${tld}/v1/domain/${encodeURIComponent(domain)}`);
  }

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { accept: "application/rdap+json" } });
      if (res.status === 404) return { found: false };
      if (!res.ok) continue;
      const j = await res.json();

      const ev = {};
      for (const e of j.events || []) {
        if (e.eventAction && e.eventDate) ev[e.eventAction] = e.eventDate;
      }
      const created = ev.registration || ev["registration"] || null;
      const ageDays = created
        ? Math.floor((Date.now() - new Date(created).getTime()) / 86400000)
        : null;

      // Registrar sits in an entity with the "registrar" role
      let registrar = null;
      for (const en of j.entities || []) {
        if ((en.roles || []).includes("registrar")) {
          const v = (en.vcardArray?.[1] || []).find((x) => x[0] === "fn");
          registrar = v?.[3] || en.handle || null;
          break;
        }
      }

      return {
        found: true,
        domain: j.ldhName || domain,
        created,
        expires: ev.expiration || null,
        updated: ev["last changed"] || null,
        ageDays,
        registrar,
        statuses: j.status || [],
      };
    } catch {
      /* try next endpoint */
    }
  }
  return null;
}

/** Reverse DNS (PTR) — hints at the hosting provider behind an IP. */
export async function reverseDns(ip) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return null;
  const arpa = ip.split(".").reverse().join(".") + ".in-addr.arpa";
  const r = await dnsQuery(arpa, "PTR");
  const ptr = (r?.Answer || []).filter((x) => x.type === 12).map((x) => x.data);
  return ptr[0] ? ptr[0].replace(/\.$/, "") : null;
}

/** Query params commonly used for open redirects */
const REDIRECT_PARAMS = [
  "url", "redirect", "redirect_uri", "redirect_url", "next", "goto", "target",
  "dest", "destination", "return", "returnurl", "return_to", "continue",
  "r", "u", "link", "out", "to", "forward",
];

/**
 * Pull embedded destination links out of the query string.
 * `safe.com/go?url=https://evil.xyz` looks harmless until you read the param.
 */
export function extractRedirects(url) {
  const found = [];
  try {
    for (const [key, raw] of url.searchParams.entries()) {
      if (!REDIRECT_PARAMS.includes(key.toLowerCase())) continue;
      let v = raw;
      // params are often double-encoded
      for (let i = 0; i < 2; i++) {
        try {
          const dec = decodeURIComponent(v);
          if (dec === v) break;
          v = dec;
        } catch { break; }
      }
      if (/^https?:\/\//i.test(v) || /^\/\//.test(v)) {
        found.push({ param: key, url: v.replace(/^\/\//, "https://") });
      }
    }
  } catch { /* ignore */ }
  return found;
}

/** Base64 / hex blobs in the query often hide a payload or tracking id. */
export function detectEncoded(url) {
  const hits = [];
  try {
    for (const [key, val] of url.searchParams.entries()) {
      if (val.length < 16) continue;
      if (/^[A-Za-z0-9+/]{16,}={0,2}$/.test(val)) hits.push({ param: key, kind: "base64" });
      else if (/^[0-9a-fA-F]{32,}$/.test(val)) hits.push({ param: key, kind: "hex" });
    }
  } catch { /* ignore */ }
  return hits;
}

/** Break the address into its parts so the user can see what it really is. */
export function urlAnatomy(url) {
  const host = url.hostname.toLowerCase();
  const reg = registrableDomain(host);
  const sub = host.endsWith(reg) ? host.slice(0, Math.max(0, host.length - reg.length - 1)) : "";
  const params = [];
  try {
    for (const [k, v] of url.searchParams.entries()) {
      params.push({ key: k, value: v.length > 120 ? v.slice(0, 120) + "…" : v });
    }
  } catch { /* ignore */ }

  return {
    scheme: url.protocol.replace(":", ""),
    subdomain: sub || null,
    registrable: reg,
    tld: tldOf(host),
    port: url.port || (url.protocol === "https:" ? "443" : "80"),
    path: url.pathname || "/",
    params,
    fragment: url.hash ? url.hash.slice(1) : null,
    hasUnicode: /[^\x00-\x7F]/.test(url.href),
  };
}

/**
 * Full link check: structure + DNS + hosting + domain age + redirects.
 * Builds on analyzeUrl() and adds the network-backed signals.
 */
export async function analyzeUrlDeep(input) {
  const base = analyzeUrl(input);
  if (!base.valid) return { ...base, deep: null };

  const { url, host } = base;
  const anatomy = urlAnatomy(url);
  const redirects = extractRedirects(url);
  const encoded = detectEncoded(url);

  const notes = [...base.notes];
  let risk = base.risk;
  const add = (level, code, points = 0, params) => {
    notes.push({ level, code, ...(params ? { params } : {}) });
    risk += points;
  };

  // --- Open redirect: the embedded target matters more than the wrapper ---
  const redirectChecks = [];
  for (const r of redirects) {
    const inner = analyzeUrl(r.url);
    redirectChecks.push({ ...r, verdict: inner.verdict, risk: inner.risk, host: inner.host });
    add("warn", "redirectParam", 15, { param: r.param, target: inner.host || r.url });
    if (inner.risk >= 30) {
      add("error", "redirectDangerous", Math.min(30, inner.risk / 2), { target: inner.host });
    }
  }
  // A wrapper link is at least as dangerous as where it actually takes you:
  // safe.com/go?url=<phishing> lands the user on the phishing page all the same.
  const innerMax = Math.max(0, ...redirectChecks.map((x) => x.risk));
  if (innerMax > risk) risk = innerMax;

  if (encoded.length) {
    add("info", "encodedParam", 5, { params: encoded.map((e) => `${e.param} (${e.kind})`) });
  }

  // --- DNS + hosting ---
  const [aRes, aaaaRes, nsRes, cnameRes, mxRes, caaRes] = await Promise.all([
    isIpHost(host) ? null : dnsQuery(host, "A"),
    isIpHost(host) ? null : dnsQuery(host, "AAAA"),
    dnsQuery(anatomy.registrable, "NS"),
    isIpHost(host) ? null : dnsQuery(host, "CNAME"),
    dnsQuery(anatomy.registrable, "MX"),
    dnsQuery(anatomy.registrable, "CAA"),
  ]);

  const pick = (r, type) => (r?.Answer || []).filter((x) => x.type === type).map((x) => x.data);
  const ips = isIpHost(host) ? [host] : pick(aRes, 1);

  if (!isIpHost(host) && aRes?.Status === 3) add("error", "domainNotExist", 25);

  // Hosting provider via reverse DNS of the first two IPs
  const hosting = (await Promise.all(ips.slice(0, 2).map(reverseDns))).filter(Boolean);

  // --- Domain age (RDAP) ---
  const rdap = isIpHost(host) ? null : await rdapLookup(anatomy.registrable);
  if (rdap?.found && rdap.ageDays != null) {
    if (rdap.ageDays < 30) add("error", "brandNewDomain", 30, { days: rdap.ageDays });
    else if (rdap.ageDays < 90) add("warn", "veryNewDomain", 20, { days: rdap.ageDays });
    else if (rdap.ageDays < 365) add("info", "newDomain", 8, { days: rdap.ageDays });
    else add("good", "establishedDomain", 0, { years: Math.floor(rdap.ageDays / 365) });
  } else if (rdap?.found === false) {
    add("warn", "notRegistered", 10);
  }

  risk = Math.max(0, Math.min(100, risk));

  return {
    ...base,
    risk,
    verdict: verdictOf(risk),
    notes,
    deep: {
      anatomy,
      redirects: redirectChecks,
      encoded,
      dns: {
        A: ips,
        AAAA: pick(aaaaRes, 28),
        CNAME: pick(cnameRes, 5),
        NS: pick(nsRes, 2).sort(),
        MX: sortMx(pick(mxRes, 15)),
        CAA: pick(caaRes, 257),
        dnssec: Boolean(aRes?.AD),
      },
      hosting,
      rdap,
    },
  };
}
