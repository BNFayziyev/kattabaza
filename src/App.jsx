import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function App() {
  const PRIMARY_COLOR = "#1f6b4a";
  const ACCENT_ORANGE = "#f97316";
  const ACCENT_RED = "#dc2626";
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");
  const [helpAdminOpen, setHelpAdminOpen] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ipInfo, setIpInfo] = useState({
    loading: true,
    ipv4: "",
    ipv6: "",
    ipv4Location: "",
    ipv6Location: "",
    countryCode: "",
    countryName: "",
  });
  const [copiedIp, setCopiedIp] = useState("");
  const [keysPassword, setKeysPassword] = useState("");
  const [isKeysUnlocked, setIsKeysUnlocked] = useState(false);
  const [keyCopyState, setKeyCopyState] = useState("");
  const [keysPasswordError, setKeysPasswordError] = useState("");
  const [keysDrawerOpen, setKeysDrawerOpen] = useState(false);
  const [dbRows, setDbRows] = useState([]);

  useEffect(() => {
    if (!keysDrawerOpen) setHelpAdminOpen(false);
  }, [keysDrawerOpen]);

  // 🔹 NAV STATE (o‘zgarmagan mantiq)
  const [view, setView] = useState("home"); // home | categories | channel | category
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ✅ QO‘SHILDI — bottom nav active uchun
  const [activeTab, setActiveTab] = useState("home");

  // ✅ ROUTING
  const location = useLocation();
  const navigate = useNavigate();

  const isDark = theme === "dark";

  const MATERIALS_URL =
    "https://opensheet.elk.sh/1z7O8Xlq5WN3VRv45lEyTu4QpW6O3tEcefsg5O5y1y5g/Materials";
  const CHANNELS_URL =
    "https://opensheet.elk.sh/1z7O8Xlq5WN3VRv45lEyTu4QpW6O3tEcefsg5O5y1y5g/Channels";
  const SHEET_BASE =
    "https://opensheet.elk.sh/1z7O8Xlq5WN3VRv45lEyTu4QpW6O3tEcefsg5O5y1y5g/";
  const KEY_LIST_URLS = [
    `${SHEET_BASE}key_list`,
    `${SHEET_BASE}${encodeURIComponent("key list")}`,
    `${SHEET_BASE}Key%20list`,
    `${SHEET_BASE}materials_db`,
  ];

  // 🟦 GOOGLE SHEETSDAN O‘QISH
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function load() {
      try {
        const [mRes, cRes] = await Promise.all([
          fetch(MATERIALS_URL),
          fetch(CHANNELS_URL),
        ]);

        const mData = await mRes.json();
        const cData = await cRes.json();

        const tryDb = async (url) => {
          try {
            const r = await fetch(url);
            if (!r.ok) return [];
            const d = await r.json();
            return Array.isArray(d) ? d : [];
          } catch {
            return [];
          }
        };
        let dbList = [];
        for (const url of KEY_LIST_URLS) {
          const rows = await tryDb(url);
          if (rows.length > 0) {
            dbList = rows;
            break;
          }
        }
        if (dbList.length === 0) {
          dbList = await tryDb(`${SHEET_BASE}Materials_db`);
        }
        setDbRows(dbList);

        const fixedMaterials = mData.map((item) => ({
          ...item,
          categories: item.categories
            ? item.categories.split(",").map((c) => c.trim())
            : [],
        }));

        setMaterials(fixedMaterials);
        setChannels(cData);
      } catch (err) {
        console.error("Sheet fetch error:", err);
      }
      setLoading(false);
    }

    load();
  }, []);

  // ✅ URL -> STATE sync (o‘zgarmagan, faqat activeTab sync qo‘shildi)
  useEffect(() => {
    if (!channels || channels.length === 0) return;

    const raw = (location.pathname || "/").replace(/^\/+|\/+$/g, "");
    const parts = raw ? raw.split("/") : [];

    if (parts.length === 0 || parts[0] === "home") {
      setView("home");
      setActiveTab("home");
      setSelectedChannel(null);
      setSelectedCategory(null);
      return;
    }

    if (parts[0] === "categories") {
      setActiveTab("categories");
      if (parts.length === 1) {
        setView("categories");
        setSelectedChannel(null);
        setSelectedCategory(null);
        return;
      }

      const cat = decodeURIComponent(parts[1]);
      setView("category");
      setSelectedCategory(cat);
      return;
    }

    const chName = decodeURIComponent(parts[0]);
    const foundChannel =
      channels.find((c) => String(c.Name) === String(chName)) || null;

    if (foundChannel && parts.length === 1) {
      setView("channel");
      setSelectedChannel(foundChannel);
      setSelectedCategory(null);
      return;
    }

    if (foundChannel && parts.length >= 2) {
      const cat = decodeURIComponent(parts[1]);
      setView("category");
      setSelectedChannel(foundChannel);
      setSelectedCategory(cat);
      return;
    }

    setView("categories");
    setActiveTab("categories");
  }, [location.pathname, channels]);

  useEffect(() => {
    async function resolveLocation(ip) {
      if (!ip) return { location: "", countryCode: "", countryName: "" };
      try {
        const res = await fetch(`https://ipwho.is/${ip}`);
        const data = await res.json();
        if (data?.success) {
          return {
            location: [data.city, data.country].filter(Boolean).join(", "),
            countryCode: data.country_code || "",
            countryName: data.country || "",
          };
        }
      } catch {}

      try {
        const fallbackRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const fallback = await fallbackRes.json();
        return {
          location: [fallback.city, fallback.country_name].filter(Boolean).join(", "),
          countryCode: fallback.country_code || "",
          countryName: fallback.country_name || "",
        };
      } catch {}

      try {
        const infoRes = await fetch(`https://ipinfo.io/${ip}/json`);
        const info = await infoRes.json();
        return {
          location: [info.city, info.country].filter(Boolean).join(", "),
          countryCode: info.country || "",
          countryName: info.country || "",
        };
      } catch {
        return { location: "", countryCode: "", countryName: "" };
      }
    }

    async function loadIpInfo() {
      try {
        const [selfResult, v4Result, v6Result] = await Promise.allSettled([
          fetch("https://ipapi.co/json/"),
          fetch("https://api.ipify.org?format=json"),
          fetch("https://api64.ipify.org?format=json"),
        ]);

        const selfData =
          selfResult.status === "fulfilled" ? await selfResult.value.json() : {};
        const v4Data =
          v4Result.status === "fulfilled" ? await v4Result.value.json() : {};
        const v6Data =
          v6Result.status === "fulfilled" ? await v6Result.value.json() : {};

        const ipapiIp = typeof selfData?.ip === "string" ? selfData.ip : "";
        const ipv4 =
          v4Data?.ip ||
          (selfData?.version === "IPv4" ? ipapiIp : "") ||
          (!ipapiIp.includes(":") ? ipapiIp : "");
        const ipv6 =
          v6Data?.ip ||
          (selfData?.version === "IPv6" ? ipapiIp : "") ||
          (ipapiIp.includes(":") ? ipapiIp : "");
        const [ipv4Meta, ipv6Meta] = await Promise.all([
          resolveLocation(ipv4),
          resolveLocation(ipv6),
        ]);

        setIpInfo({
          loading: false,
          ipv4,
          ipv6,
          ipv4Location: ipv4Meta.location,
          ipv6Location: ipv6Meta.location,
          countryCode: ipv4Meta.countryCode || ipv6Meta.countryCode || selfData?.country || selfData?.country_code || "",
          countryName:
            ipv4Meta.countryName ||
            ipv6Meta.countryName ||
            selfData?.country_name ||
            selfData?.country_name_native ||
            "",
        });
      } catch {
        setIpInfo((prev) => ({ ...prev, loading: false }));
      }
    }

    loadIpInfo();
  }, []);

  const t = {
    en: {
      search: "Search...",
      yourConnection: "Your connection",
      ipv4: "IPv4",
      ipv6: "IPv6",
      checking: "Checking...",
      unknown: "Unknown",
      home: "Home",
      categories: "Categories",
      saved: "Settings",
      profile: "Profile",
      helpAdmin: "Help admin",
      contactPanel: "Contact & keys",
      close: "Close",
      keysAccess: "Keys access",
      enterPassword: "Enter password",
      open: "Open",
      confirmed: "Confirmed",
      wrongPassword: "Wrong password. Try again.",
      keysEmpty: "No keys in the key-list sheet yet.",
      channels: "Channels",
      popularCategories: "Popular categories",
      loading: "Loading...",
      noMaterials: "No materials yet.",
      copy: "Copy",
      copied: "Copied",
      hideDetails: "Hide",
    },
    ru: {
      search: "Поиск...",
      yourConnection: "Ваше подключение",
      ipv4: "IPv4",
      ipv6: "IPv6",
      checking: "Проверка...",
      unknown: "Не определено",
      home: "Главная",
      categories: "Категории",
      saved: "Настройки",
      profile: "Профиль",
      helpAdmin: "Помощь админу",
      contactPanel: "Контакты и ключи",
      close: "Закрыть",
      keysAccess: "Доступ к ключам",
      enterPassword: "Введите пароль",
      open: "Открыть",
      confirmed: "Подтверждено",
      wrongPassword: "Неверный пароль. Попробуйте снова.",
      keysEmpty: "В листе ключей пока нет данных.",
      channels: "Каналы",
      popularCategories: "Популярные категории",
      loading: "Загрузка...",
      noMaterials: "Пока нет материалов.",
      copy: "Копировать",
      copied: "Скопировано",
      hideDetails: "Скрыть",
    },
  }[lang];

  const openHandler = (url) => window.open(url, "_blank");

  const countryFlagUrl = (code) => {
    if (!code || code.length !== 2) return "";
    return `https://flagcdn.com/w320/${code.toLowerCase()}.png`;
  };

  const getFileType = (item) => {
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
  };

  const getCountryName = (nameOrCode) => {
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
  };

  const copyText = async (value, key) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIp(key);
      setTimeout(() => setCopiedIp(""), 1400);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const getTashkentPassword = () => {
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
  };

  const getKeyRecords = (db) => {
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
      const t = String(s || "").trim();
      if (t.length < 8) return false;
      if (/(^https?:\/\/)|^\d+\s*MB$/i.test(t)) return false;
      return /[A-Za-z0-9]/.test(t);
    };

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
      let best = "";
      for (const [col, val] of Object.entries(row)) {
        if (skip.has(col)) continue;
        const t = String(val ?? "").trim();
        if (!t || t.length < 8) continue;
        if (col.toLowerCase().includes("key") && looksLikeKey(t)) return t;
        if (t.length >= best.length && looksLikeKey(t) && t.length > 20) best = t;
      }
      return best;
    };

    const fromRow = (item, index, source) => {
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
      const id = item.id ?? item.ID ?? `k-${source}-${index}`;
      return { id, domain, keyName, keyValue };
    };

    const list = db.map((row, i) => fromRow(row, i, "db")).filter(Boolean);
    return [...list].reverse();
  };

  const keyRecords = getKeyRecords(dbRows);

  const unlockKeys = () => {
    const expected = getTashkentPassword();
    const entered = keysPassword.trim();
    if (entered === expected) {
      setIsKeysUnlocked(true);
      setKeysPasswordError("");
    } else {
      setIsKeysUnlocked(false);
      setKeysPasswordError(t.wrongPassword);
    }
  };

  const copyKey = async (value, id) => {
    if (!isKeysUnlocked || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setKeyCopyState(id);
      setTimeout(() => setKeyCopyState(""), 1200);
    } catch (err) {
      console.error("Key copy failed", err);
    }
  };

  const renderKeysBlock = ({ showHeaderClose, onClose } = {}) => (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      {showHeaderClose && (
        <div className="flex justify-between items-center shrink-0 pr-0">
          <span className="text-sm font-bold text-gray-800">{t.contactPanel}</span>
          <button
            type="button"
            className="text-sm text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100"
            onClick={onClose}
          >
            {t.close}
          </button>
        </div>
      )}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-[#f8fafc] to-[#eef2ff] p-4 flex flex-col items-center gap-3 shrink-0">
        <img
          src="https://github.com/BNFayziyev.png"
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
        />
        {!helpAdminOpen ? (
          <button
            type="button"
            onClick={() => setHelpAdminOpen(true)}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {t.helpAdmin}
          </button>
        ) : (
          <div className="w-full space-y-3 text-left">
            <div className="text-sm font-bold text-gray-900">+998995267403</div>
            <div className="text-xs text-gray-600">@BNFayziyev</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="tel:+998995267403"
                className="px-2 py-1 rounded-full bg-gray-900 text-white"
              >
                Call
              </a>
              <a
                href="https://t.me/BNFayziyev"
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-full bg-blue-600 text-white"
              >
                Telegram
              </a>
              <a
                href="https://instagram.com/BNFayziyev"
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-full bg-pink-600 text-white"
              >
                Instagram
              </a>
            </div>
            <button
              type="button"
              onClick={() => setHelpAdminOpen(false)}
              className="text-xs text-gray-500 underline"
            >
              {t.hideDetails}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shrink-0">
        <div className="text-sm font-bold text-gray-900 mb-2">{t.keysAccess}</div>
        <div className="flex gap-2">
          <input
            type="password"
            value={keysPassword}
            onChange={(e) => {
              setKeysPassword(e.target.value);
              setKeysPasswordError("");
            }}
            placeholder={t.enterPassword}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#1f6b4a]/30"
          />
          <button
            type="button"
            onClick={unlockKeys}
            className="px-3 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            {t.open}
          </button>
        </div>
        {keysPasswordError && (
          <p className="text-xs text-red-600 mt-2">{keysPasswordError}</p>
        )}
        {isKeysUnlocked && !keysPasswordError && (
          <p className="text-xs text-emerald-600 mt-2">{t.confirmed}</p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1 space-y-2">
        {keyRecords.length === 0 ? (
          <div className="text-xs text-gray-500 px-1">{t.keysEmpty}</div>
        ) : (
          keyRecords.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className={`space-y-1 ${isKeysUnlocked ? "" : "blur-sm select-none"}`}>
                <div className="text-[11px] uppercase text-gray-400">Domain</div>
                <div className="text-sm font-semibold text-gray-900 break-all">
                  {row.domain || "—"}
                </div>
                <div className="text-[11px] uppercase text-gray-400 mt-2">Key Name</div>
                <div className="text-sm font-medium text-gray-700 break-all">
                  {row.keyName || "—"}
                </div>
                <div className="text-[11px] uppercase text-gray-400 mt-2">Key</div>
                <button
                  type="button"
                  onClick={() => copyKey(row.keyValue, row.id)}
                  className={`w-full text-left text-sm font-mono rounded-xl px-2 py-1 border ${
                    isKeysUnlocked
                      ? "border-[#1f6b4a]/30 bg-[#f2fbf6] hover:bg-[#eaf8f1] text-[#145c3d]"
                      : "border-gray-200 bg-gray-100 text-gray-500 cursor-default"
                  }`}
                >
                  {row.keyValue}
                </button>
              </div>
              {isKeysUnlocked && keyCopyState === row.id && (
                <div className="text-xs text-green-600 mt-2">{t.copied}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // 🔹 KATEGORIYALAR STATISTIKASI
  const categoryStats = {};
  materials.forEach((m) =>
    m.categories.forEach((c) => {
      categoryStats[c] = (categoryStats[c] || 0) + 1;
    })
  );

  const popularCategories = Object.keys(categoryStats);

  let visibleMaterials = materials;

  if (view === "channel" && selectedChannel) {
    visibleMaterials = materials.filter(
      (m) => m.channel_ID === selectedChannel.channel_ID
    );
  }

  if (view === "category" && selectedCategory) {
    visibleMaterials = materials.filter((m) => {
      if (selectedChannel) {
        return (
          m.channel_ID === selectedChannel.channel_ID &&
          m.categories.includes(selectedCategory)
        );
      }
      return m.categories.includes(selectedCategory);
    });
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center lg:items-stretch w-full pb-6 pl-14 lg:pl-64 pr-0 lg:pr-[26rem] lg:pb-8 transition-colors ${
        isDark
          ? "bg-[radial-gradient(circle_at_top,#1e5f44,#103527)] text-gray-100"
          : "bg-[radial-gradient(circle_at_top,#2b8f64,#1f6b4a)] text-gray-100"
      }`}
    >
      {/* Kichik ekran: faqat iconlar + pastda profil — kalit paneli alohida drawer */}
      <nav
        className="lg:hidden fixed left-0 top-0 bottom-0 z-40 w-14 flex flex-col items-center py-3 gap-1 bg-white/95 backdrop-blur-md border-r border-white/60 shadow-lg"
        aria-label="Asosiy menyu"
      >
        <div className="text-[10px] font-extrabold text-gray-800 mb-1 px-0.5 text-center leading-tight">
          KB
        </div>
        <button
          type="button"
          title={t.home}
          onClick={() => {
            setView("home");
            setActiveTab("home");
            navigate("/home");
          }}
          className={`w-11 h-11 rounded-xl text-lg flex items-center justify-center ${
            activeTab === "home" ? "text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
          style={{ backgroundColor: activeTab === "home" ? PRIMARY_COLOR : "transparent" }}
        >
          🏠
        </button>
        <button
          type="button"
          title={t.categories}
          onClick={() => {
            setView("categories");
            setActiveTab("categories");
            navigate("/categories");
          }}
          className={`w-11 h-11 rounded-xl text-lg flex items-center justify-center ${
            activeTab === "categories" ? "text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
          style={{ backgroundColor: activeTab === "categories" ? PRIMARY_COLOR : "transparent" }}
        >
          📂
        </button>
        <button
          type="button"
          title={t.saved}
          onClick={() => setActiveTab("saved")}
          className={`w-11 h-11 rounded-xl text-lg flex items-center justify-center ${
            activeTab === "saved" ? "text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
          style={{ backgroundColor: activeTab === "saved" ? PRIMARY_COLOR : "transparent" }}
        >
          ⚙️
        </button>
        <div className="flex-1" />
        <button
          type="button"
          title={t.contactPanel}
          onClick={() => setKeysDrawerOpen(true)}
          className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#1f6b4a] shadow-md mb-1"
        >
          <img
            src="https://github.com/BNFayziyev.png"
            alt="Profil"
            className="w-full h-full object-cover"
          />
        </button>
      </nav>

      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-56 rounded-3xl bg-white/95 backdrop-blur-md border border-white/70 shadow-2xl p-3 flex-col z-30">
        <div className="px-3 py-2 text-gray-800 text-lg font-extrabold tracking-wide">
          KattaBaza
        </div>
        <div className="mt-2 space-y-2">
          <button
            type="button"
            onClick={() => {
              setView("home");
              setActiveTab("home");
              navigate("/home");
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "home" ? "text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
            style={{ backgroundColor: activeTab === "home" ? PRIMARY_COLOR : "transparent" }}
          >
            🏠 {t.home}
          </button>
          <button
            type="button"
            onClick={() => {
              setView("categories");
              setActiveTab("categories");
              navigate("/categories");
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "categories"
                ? "text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            style={{
              backgroundColor:
                activeTab === "categories" ? PRIMARY_COLOR : "transparent",
            }}
          >
            📂 {t.categories}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "saved" ? "text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
            style={{ backgroundColor: activeTab === "saved" ? PRIMARY_COLOR : "transparent" }}
          >
            ⚙️ {t.saved}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === "profile" ? "text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
            style={{ backgroundColor: activeTab === "profile" ? PRIMARY_COLOR : "transparent" }}
          >
            👤 {t.profile}
          </button>
        </div>
      </aside>

      <aside className="hidden lg:flex fixed right-4 top-4 bottom-4 w-[24rem] rounded-3xl bg-white/95 backdrop-blur-md border border-white/70 shadow-2xl p-3 z-30 flex-col">
        {renderKeysBlock({ showHeaderClose: false })}
      </aside>

      {keysDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 border-0 w-full h-full cursor-default"
            aria-label={t.close}
            onClick={() => setKeysDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white p-3 shadow-2xl flex flex-col overflow-hidden">
            {renderKeysBlock({
              showHeaderClose: true,
              onClose: () => setKeysDrawerOpen(false),
            })}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="sticky top-0 z-20 w-full max-w-[420px] md:max-w-6xl px-3 md:px-6 pt-3">
        <div className="backdrop-blur-md bg-white/95 rounded-2xl border border-white/70 shadow-xl flex justify-between items-center px-4 py-3 select-none gap-3">
        <div className="flex items-center bg-gray-100 shadow-sm rounded-full px-2 py-1 gap-1">
          <button
            onClick={() => setTheme("light")}
            className={`px-2 py-1 rounded-full text-sm font-bold ${
              theme === "light"
                ? "text-white"
                : "text-gray-500 bg-transparent"
            }`}
            style={{ backgroundColor: theme === "light" ? PRIMARY_COLOR : "transparent" }}
          >
            ☀️
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-2 py-1 rounded-full text-sm font-bold ${
              theme === "dark"
                ? "text-white"
                : "text-gray-500 bg-transparent"
            }`}
            style={{ backgroundColor: theme === "dark" ? PRIMARY_COLOR : "transparent" }}
          >
            🌙
          </button>
        </div>

        <div className="text-xl font-extrabold tracking-wide text-gray-800">KattaBaza</div>

        <div className="flex items-center bg-gray-100 shadow-sm rounded-full px-2 py-1 gap-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-2 py-1 rounded-full ${
              lang === "en" ? "bg-[#f76400] text-white" : "text-gray-500"
            }`}
            style={{ backgroundColor: lang === "en" ? PRIMARY_COLOR : "transparent" }}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("ru")}
            className={`px-2 py-1 rounded-full ${
              lang === "ru" ? "bg-[#f76400] text-white" : "text-gray-500"
            }`}
            style={{ backgroundColor: lang === "ru" ? PRIMARY_COLOR : "transparent" }}
          >
            RU
          </button>
        </div>
      </div>
      </div>

      <div className="max-w-[420px] md:max-w-6xl w-full px-4 md:px-6 mt-3 mb-3">
        <div className="bg-gradient-to-r from-white via-[#f5fff9] to-[#e8f8ef] text-gray-800 rounded-3xl shadow-2xl border border-white/70 px-4 md:px-6 py-4">
          <div className="font-bold text-sm mb-3">{t.yourConnection}</div>
          <div className="relative overflow-hidden rounded-2xl bg-white/90 border border-[#d8efe4] px-4 py-4">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-800">
                    {ipInfo.countryCode || "--"}
                  </span>
                  <span className="text-base font-semibold" style={{ color: ACCENT_RED }}>
                    {ipInfo.loading
                      ? t.checking
                      : getCountryName(ipInfo.countryName || ipInfo.countryCode) || t.unknown}
                  </span>
                </div>
                <div className="mt-1 text-sm" style={{ color: ACCENT_RED }}>
                  {ipInfo.loading
                    ? ""
                    : ipInfo.ipv4Location || ipInfo.ipv6Location || t.unknown}
                </div>

                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t.ipv4}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="text-2xl md:text-4xl leading-tight font-extrabold tracking-tight break-all"
                    style={{ color: ACCENT_ORANGE }}
                  >
                    {ipInfo.loading ? t.checking : ipInfo.ipv4 || t.unknown}
                  </div>
                  <button
                    onClick={() => copyText(ipInfo.ipv4, "ipv4")}
                    className="px-3 py-1 text-xs rounded-full bg-gray-900 text-white hover:bg-black transition-colors"
                  >
                    {copiedIp === "ipv4" ? t.copied : t.copy}
                  </button>
                </div>

                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t.ipv6}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm text-gray-500 break-all">
                    {ipInfo.loading ? t.checking : ipInfo.ipv6 || t.unknown}
                  </div>
                  <button
                    onClick={() => copyText(ipInfo.ipv6, "ipv6")}
                    className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    {copiedIp === "ipv6" ? t.copied : t.copy}
                  </button>
                </div>
              </div>

              <div className="relative hidden md:flex justify-end">
                {ipInfo.countryCode ? (
                  <img
                    src={countryFlagUrl(ipInfo.countryCode)}
                    alt={`${ipInfo.countryCode} flag`}
                    className="flag-bg-wave w-52 h-32 rounded-2xl object-cover shadow-lg border border-white/80"
                  />
                ) : (
                  <div className="w-52 h-32 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                    No flag
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="max-w-[420px] md:max-w-6xl w-full px-4 md:px-6 mb-3">
        <div className="flex items-center bg-white rounded-2xl shadow-xl border border-white/70 px-4 py-3">
          <span className="mr-2 text-xl text-gray-500">🔍</span>
          <input
            type="text"
            placeholder={t.search}
            className="w-full outline-none bg-transparent"
          />
        </div>
      </div>

      <div className="max-w-[420px] md:max-w-6xl w-full px-4 md:px-6 mt-1 space-y-3">
        {/* 📂 KATEGORIYALAR VIEW → KANALLAR */}
        {view === "categories" && (
          <>
            <div className="font-bold text-white/95 mb-2">{t.channels}</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-5xl mx-auto w-full">
            {channels.map((ch) => (
              <div
                key={ch.channel_ID}
                className="bg-white rounded-2xl shadow-md border border-white/80 px-5 py-3 cursor-pointer hover:shadow-xl transition-all"
                onClick={() => {
                  setSelectedChannel(ch);
                  setView("channel");
                  // ✅ URL (FAKAT QO‘SHILDI)
                  navigate("/" + encodeURIComponent(ch.Name));
                }}
              >
                📢 {ch.Name}
              </div>
            ))}
            </div>

            <div className="font-bold text-white/95 mt-4 mb-2">{t.popularCategories}</div>
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((cat) => (
                <div
                  key={cat}
                  className="px-3 py-1 text-white rounded-full text-xs cursor-pointer"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setView("category");
                    // ✅ URL (FAKAT QO‘SHILDI)
                    if (selectedChannel?.Name) {
                      navigate(
                        "/" +
                          encodeURIComponent(selectedChannel.Name) +
                          "/" +
                          encodeURIComponent(cat)
                      );
                    } else {
                      navigate("/categories/" + encodeURIComponent(cat));
                    }
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>
          </>
        )}

        {/* 📄 MATERIALS — OLDINGIDAY */}
        {(view === "home" || view === "channel" || view === "category") &&
          (loading ? (
            <div className="text-center py-10 text-gray-400">
              {t.loading}
            </div>
          ) : visibleMaterials.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {t.noMaterials}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto w-full">
            {visibleMaterials.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl shadow-md border border-white/80 px-5 py-4 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 w-full">
                    {item.preview_url ? (
                      <img
                        src={item.preview_url}
                        className="w-12 h-12 rounded-md object-cover border mt-1"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-md mt-1"></div>
                    )}

                    <div className="flex flex-col min-w-0">
                      <a
                        className="text-sm font-semibold text-blue-700 underline cursor-pointer break-words hover:text-blue-800"
                        onClick={() => openHandler(item.post_link)}
                      >
                        {item.title
                          ? item.title.replace(/\.[^/.]+$/, "")
                          : ""}
                      </a>

                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 break-words overflow-hidden">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 min-w-[86px] max-w-[100px] shrink-0">
                    <div className="w-full px-2 py-0.5 text-[10px] rounded-full bg-gray-100 border border-gray-200 font-semibold text-center whitespace-nowrap">
                      {getFileType(item)}
                    </div>

                    <div className="w-full px-2 py-0.5 text-[10px] rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-center whitespace-nowrap">
                      {item.size_mb ? item.size_mb + " MB" : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openHandler(item.post_link)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex-1 justify-center transition-colors shadow-sm"
                  >
                    <img src="/pic/icontg128.png" className="w-4 h-4" />
                    Download
                  </button>

                  <button
                    onClick={() => item.file_url && openHandler(item.file_url)}
                    disabled={!item.file_url}
                    className={
                      "flex items-center gap-2 px-3 py-2.5 rounded-full text-white text-xs font-semibold flex-1 justify-center transition-colors shadow-sm" +
                      (item.file_url ? "" : " opacity-50 cursor-not-allowed")
                    }
                    style={{ backgroundColor: PRIMARY_COLOR }}
                  >
                    <img src="/pic/icondw128.png" className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            ))
            }
            </div>
          ))}
      </div>

    </div>
  );
}
