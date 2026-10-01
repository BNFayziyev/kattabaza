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

// Jadvaldagi nomlar fayl nomi ("Chrome.exe") — kengaytma olib tashlanadi.
// Qo'shimcha katalogda esa haqiqiy nomlar ("Paint.NET", "Node.js") — tegilmaydi.
export function displayTitle(item) {
  if (!item.title) return "";
  return item.source === "extra" ? item.title : item.title.replace(/\.[^/.]+$/, "");
}

// Telegram tugmasi faqat post haqiqatan Telegram'da bo'lsa chiqadi
export function telegramLink(item) {
  return item.file_url && /^https?:\/\/t\.me\//i.test(item.post_link || "") ? item.post_link : "";
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
