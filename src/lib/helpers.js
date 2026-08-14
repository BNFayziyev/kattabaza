export function getFileType(item) {
  const candidateFields = [
    item.file_type,
    item.type,
    item.format,
    item.extension,
    item.ext,
    item.mime_type,
  ];
  const directValue = candidateFields.find(
    (value) => typeof value === "string" && value.trim()
  );

  if (directValue) {
    const normalized = directValue.replace(/^\./, "").trim();
    const fromMime = normalized.includes("/")
      ? normalized.split("/").pop()
      : normalized;
    if (fromMime) return fromMime.toUpperCase();
  }

  const source = decodeURIComponent(
    String(item.file_url || item.post_link || item.title || "")
  );
  const ext = source.match(/\.([a-zA-Z0-9]{2,8})(?:$|[?#/&\s])/i);
  return ext?.[1] ? ext[1].toUpperCase() : "FILE";
}

export function getCountryName(nameOrCode) {
  if (!nameOrCode) return "";
  const value = String(nameOrCode).trim();
  if (value.length !== 2) return value;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(
      value.toUpperCase()
    );
  } catch {
    return value.toUpperCase();
  }
}

export function countryFlagUrl(code) {
  if (!code || code.length !== 2) return "";
  return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
}

// NOTE: this "password" is computed entirely in client-side JS from the
// current time, and the key data itself is fetched from a publicly
// readable Google Sheet URL that also ships in the client bundle. That
// means this check can only deter casual snooping in the UI — it is not
// a real access-control boundary. Anyone who reads the source or the
// network response can already see the underlying data. Real protection
// requires moving both the key data and the password check behind a
// server that the client cannot bypass.
export function getTashkentPassword() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");
  const total = hour * 60 + minute + 71;
  const hh = String(Math.floor((total % 1440) / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `Kitob${hh}${mm}`;
}

export function getKeyRecords(db) {
  if (!db || db.length === 0) return [];
  const pick = (obj, keys) => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim()) {
        return String(obj[k]).trim();
      }
    }
    return "";
  };

  const looksLikeKey = (s) => {
    const value = String(s || "").trim();
    if (value.length < 8) return false;
    if (/(^https?:\/\/)|^\d+\s*MB$/i.test(value)) return false;
    return /[A-Za-z0-9]/.test(value);
  };

  const skip = new Set([
    "categories",
    "preview_url",
    "post_link",
    "file_url",
    "description",
    "size_mb",
    "file_type",
    "id",
    "channel_ID",
    "image",
    "Image",
  ]);

  const sniffKeyValue = (row) => {
    const direct = pick(row, [
      "key",
      "Key",
      "KEY",
      "value",
      "license_key",
      "api_key",
      "serial",
      "kalit",
      "Kalit",
      "kod",
      "Kod",
      "shifr",
      "license",
      "material_key",
      "secret",
    ]);
    if (direct && looksLikeKey(direct)) return direct;

    let best = "";
    for (const [col, val] of Object.entries(row)) {
      if (skip.has(col)) continue;
      const value = String(val ?? "").trim();
      if (!value || value.length < 8) continue;
      if (col.toLowerCase().includes("key") && looksLikeKey(value)) return value;
      if (value.length >= best.length && looksLikeKey(value) && value.length > 20) {
        best = value;
      }
    }
    return best;
  };

  const fromRow = (item, index) => {
    const keyValue = sniffKeyValue(item);
    if (!keyValue) return null;
    const domain = pick(item, [
      "domain",
      "Domain",
      "DOMAIN",
      "domen",
      "Domen",
      "site",
      "website",
      "url",
      "host",
      "sayt",
    ]);
    const keyName = pick(item, [
      "key_name",
      "keyName",
      "Key name",
      "key nomi",
      "name",
      "label",
      "nomi",
      "title",
    ]);
    const id = item.id ?? item.ID ?? `k-db-${index}`;
    return { id, domain, keyName, keyValue };
  };

  const list = db.map((row, i) => fromRow(row, i)).filter(Boolean);
  return [...list].reverse();
}
