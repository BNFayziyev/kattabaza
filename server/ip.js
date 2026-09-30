// IP / domen bo'yicha to'liq ma'lumot: joylashuv, provayder, ASN, vaqt zonasi, rDNS.
import dns from "node:dns/promises";
import net from "node:net";

const cache = new Map(); // ip -> { at, data }
const TTL = 6 * 60 * 60 * 1000;
const MAX_ENTRIES = 1000;

const HOST_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

// "https://example.com/path" yoki "[2001:db8::1]:443" kabi kiritmalarni tozalaydi
export function parseQuery(raw) {
  let q = String(raw || "").trim();
  if (!q) return null;
  q = q.replace(/^[a-z]+:\/\//i, "").split(/[/?#]/)[0];
  if (q.startsWith("[")) q = q.slice(1, q.indexOf("]") > 0 ? q.indexOf("]") : undefined);
  if (net.isIP(q)) return { kind: "ip", value: q };
  q = q.replace(/:\d+$/, "").toLowerCase();
  if (net.isIP(q)) return { kind: "ip", value: q };
  if (HOST_RE.test(q)) return { kind: "host", value: q };
  return null;
}

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

async function fromIpwho(ip) {
  const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(8000) });
  const d = await res.json();
  if (!d?.success) {
    const err = new Error(d?.message || "lookup failed");
    err.reserved = /reserved|private|bogon/i.test(d?.message || "");
    throw err;
  }
  return {
    ip: d.ip,
    type: d.type,
    continent: d.continent,
    continentCode: d.continent_code,
    country: d.country,
    countryCode: d.country_code,
    region: d.region,
    regionCode: d.region_code,
    city: d.city,
    postal: d.postal,
    latitude: d.latitude,
    longitude: d.longitude,
    isEu: d.is_eu,
    callingCode: d.calling_code,
    capital: d.capital,
    borders: d.borders,
    connection: {
      asn: d.connection?.asn,
      org: d.connection?.org,
      isp: d.connection?.isp,
      domain: d.connection?.domain,
    },
    timezone: {
      id: d.timezone?.id,
      abbr: d.timezone?.abbr,
      utc: d.timezone?.utc,
      isDst: d.timezone?.is_dst,
      currentTime: d.timezone?.current_time,
    },
    source: "ipwho.is",
  };
}

async function fromIpapi(ip) {
  const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { signal: AbortSignal.timeout(8000) });
  const d = await res.json();
  if (d?.error) {
    const err = new Error(d.reason || "lookup failed");
    err.reserved = /reserved|private/i.test(d.reason || "");
    throw err;
  }
  return {
    ip: d.ip,
    type: d.version,
    continent: "",
    continentCode: d.continent_code,
    country: d.country_name,
    countryCode: d.country_code,
    region: d.region,
    regionCode: d.region_code,
    city: d.city,
    postal: d.postal,
    latitude: d.latitude,
    longitude: d.longitude,
    isEu: d.in_eu,
    callingCode: String(d.country_calling_code || "").replace(/^\+/, ""),
    capital: d.country_capital,
    borders: "",
    connection: { asn: String(d.asn || "").replace(/^AS/i, ""), org: d.org, isp: d.org, domain: "" },
    timezone: { id: d.timezone, abbr: "", utc: d.utc_offset, isDst: null, currentTime: "" },
    currency: d.currency_name ? `${d.currency_name} (${d.currency})` : "",
    languages: d.languages,
    source: "ipapi.co",
  };
}

async function lookupIpOnly(ip) {
  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  let data;
  try {
    data = await fromIpwho(ip);
  } catch (err) {
    if (err.reserved) return { ip, type: net.isIPv6(ip) ? "IPv6" : "IPv4", reserved: true };
    data = await fromIpapi(ip);
  }
  data.hostnames = await withTimeout(dns.reverse(ip), 3000).catch(() => []);

  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(ip, { at: Date.now(), data });
  return data;
}

export async function lookup(raw) {
  const q = parseQuery(raw);
  if (!q) {
    const err = new Error("invalid query");
    err.status = 400;
    throw err;
  }
  if (q.kind === "ip") return { query: q.value, ...(await lookupIpOnly(q.value)) };

  const records = await withTimeout(dns.lookup(q.value, { all: true }), 5000).catch(() => []);
  if (!records.length) {
    const err = new Error("host not found");
    err.status = 404;
    throw err;
  }
  const addresses = [...new Set(records.map((r) => r.address))];
  const primary = records.find((r) => r.family === 4)?.address || addresses[0];
  return { query: q.value, resolvedFrom: q.value, addresses, ...(await lookupIpOnly(primary)) };
}

export function clientIp(req) {
  const cf = req.headers["cf-connecting-ip"];
  if (cf) return String(cf).trim();
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return (req.socket.remoteAddress || "").replace(/^::ffff:/, "");
}
