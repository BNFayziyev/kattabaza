import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("uz");
  const [materials, setMaterials] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const t = {
    uz: {
      search: "Qidirish...",
      home: "Bosh sahifa",
      categories: "Kategoriyalar",
      saved: "Saqlanganlar",
      profile: "Profil",
    },
    ru: {
      search: "Поиск...",
      home: "Главная",
      categories: "Категории",
      saved: "Сохранённые",
      profile: "Профиль",
    },
  }[lang];

  const openHandler = (url) => window.open(url, "_blank");

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
      className={`min-h-screen flex flex-col items-center pb-24 transition-colors ${
        isDark ? "bg-[#0F172A] text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* HEADER */}
      <div className="w-full max-w-[420px] flex justify-between items-center px-6 py-4 select-none">
        <div className="flex items-center bg-white shadow-md rounded-full px-3 py-2 gap-2">
          <button
            onClick={() => setTheme("light")}
            className={`px-2 py-1 rounded-full text-sm font-bold ${
              theme === "light"
                ? "bg-[#f76400] text-white"
                : "text-gray-500 bg-transparent"
            }`}
          >
            ☀️
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-2 py-1 rounded-full text-sm font-bold ${
              theme === "dark"
                ? "bg-[#f76400] text-white"
                : "text-gray-500 bg-transparent"
            }`}
          >
            🌙
          </button>
        </div>

        <div className="text-xl font-extrabold tracking-wide">KattaBaza</div>

        <div className="flex items-center bg-white shadow-md rounded-full px-3 py-2 gap-2 text-sm font-semibold">
          <button
            onClick={() => setLang("uz")}
            className={`px-2 py-1 rounded-full ${
              lang === "uz" ? "bg-[#f76400] text-white" : "text-gray-500"
            }`}
          >
            UZ
          </button>
          <button
            onClick={() => setLang("ru")}
            className={`px-2 py-1 rounded-full ${
              lang === "ru" ? "bg-[#f76400] text-white" : "text-gray-500"
            }`}
          >
            RU
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="max-w-[420px] w-full px-4 mb-3">
        <div className="flex items-center bg-white rounded-full shadow-md border px-4 py-2">
          <span className="mr-2 text-xl">🔍</span>
          <input
            type="text"
            placeholder={t.search}
            className="w-full outline-none bg-transparent"
          />
        </div>
      </div>

      {/* CONTENT (o‘zgarmagan) */}
      <div className="max-w-[420px] w-full px-4 mt-1 space-y-3">
        {/* ... bu yerda sening contenting 100% o‘sha ... */}
      </div>

      {/* 🔥 BOTTOM NAV — ACTIVE QILINDI */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px]">
        <div className="bg-white rounded-full shadow-lg border flex justify-around py-3 px-4 items-center">

          {/* HOME */}
          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => {
              setView("home");
              setActiveTab("home");
              navigate("/home");
            }}
          >
            {activeTab === "home" ? (
              <div className="bg-[#f76400] text-white px-5 py-2 rounded-full shadow-md flex items-center gap-1">
                <span className="text-lg">🏠</span>
                <span className="text-xs">{t.home}</span>
              </div>
            ) : (
              <>
                <span className="text-lg">🏠</span>
                <span className="text-xs text-gray-600">{t.home}</span>
              </>
            )}
          </div>

          {/* CATEGORIES */}
          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => {
              setView("categories");
              setActiveTab("categories");
              navigate("/categories");
            }}
          >
            {activeTab === "categories" ? (
              <div className="bg-[#f76400] text-white px-5 py-2 rounded-full shadow-md flex items-center gap-1">
                <span className="text-lg">📂</span>
                <span className="text-xs">{t.categories}</span>
              </div>
            ) : (
              <>
                <span className="text-lg">📂</span>
                <span className="text-xs text-gray-600">{t.categories}</span>
              </>
            )}
          </div>

          {/* SAVED */}
          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => setActiveTab("saved")}
          >
            {activeTab === "saved" ? (
              <div className="bg-[#f76400] text-white px-5 py-2 rounded-full shadow-md flex items-center gap-1">
                <span className="text-lg">❤️</span>
                <span className="text-xs">{t.saved}</span>
              </div>
            ) : (
              <>
                <span className="text-lg">❤️</span>
                <span className="text-xs text-gray-600">{t.saved}</span>
              </>
            )}
          </div>

          {/* PROFILE */}
          <div
            className="flex flex-col items-center cursor-pointer"
            onClick={() => setActiveTab("profile")}
          >
            {activeTab === "profile" ? (
              <div className="bg-[#f76400] text-white px-5 py-2 rounded-full shadow-md flex items-center gap-1">
                <span className="text-lg">👤</span>
                <span className="text-xs">{t.profile}</span>
              </div>
            ) : (
              <>
                <span className="text-lg">👤</span>
                <span className="text-xs text-gray-600">{t.profile}</span>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
