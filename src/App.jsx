import React, { useState, useEffect } from "react";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark";

  const API_URL = "https://med-backend-vmgf.onrender.com/materials";

  // 🌐 MATERIALS FETCH QILAMIZ
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setMaterials(data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  // 🌙 TELEGRAM WEBAPP SUPPORT
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.ready();
    }
  }, []);

  const t = {
    en: {
      search: "Search...",
      version: "Version",
      download: "Download",
      open: "Open",
      home: "Home",
      categories: "Categories",
      saved: "Saved",
      profile: "Profile",
      categoriesTitle: "Categories:",
    },
    ru: {
      search: "Поиск...",
      version: "Версия",
      download: "Скачать",
      open: "Открыть",
      home: "Главная",
      categories: "Категории",
      saved: "Сохранённые",
      profile: "Профиль",
      categoriesTitle: "Категории:",
    },
  }[lang];

  const openHandler = (url) => window.open(url, "_blank");

  return (
    <div
      className={`min-h-screen flex flex-col items-center pb-24 transition-colors ${
        isDark ? "bg-[#0F172A] text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* HEADER */}
      <div className="w-full max-w-[420px] flex justify-between items-center px-6 py-4 select-none">
        {/* Theme toggle */}
        <div className="flex items-center bg-white shadow-md rounded-full px-3 py-2 gap-2">
          <button
            onClick={() => setTheme("light")}
            className={`px-2 py-1 rounded-full text-sm font-bold shadow-sm transition ${
              theme === "light"
                ? "bg-orange-400 text-white"
                : "text-gray-500 bg-transparent"
            }`}
          >
            ☀️
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-2 py-1 rounded-full text-sm font-bold shadow-sm transition ${
              theme === "dark"
                ? "bg-indigo-500 text-white"
                : "text-gray-500 bg-transparent"
            }`}
          >
            🌙
          </button>
        </div>

        {/* Title */}
        <div className="text-xl font-extrabold tracking-wide">KattaBaza</div>

        {/* Language Toggle */}
        <div className="flex items-center bg-white shadow-md rounded-full px-3 py-2 gap-2 text-sm font-semibold">
          <button
            onClick={() => setLang("en")}
            className={`px-2 py-1 rounded-full transition ${
              lang === "en" ? "bg-orange-400 text-white shadow" : "text-gray-500"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("ru")}
            className={`px-2 py-1 rounded-full transition ${
              lang === "ru" ? "bg-orange-400 text-white shadow" : "text-gray-500"
            }`}
          >
            RU
          </button>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="max-w-[420px] w-full px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-sm">{t.categoriesTitle}</div>
          <div className="px-3 py-1 bg-white rounded-full shadow text-xs border">
            View all &gt;
          </div>
        </div>

        {/* STATIC CATEGORY CARDS (o‘zgarmaydi) */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: "🌐", title: "Webs", list: ["Speedtest", "Fast.com"] },
            { icon: "📁", title: "Apps", list: ["Telegram", "Chrome"] },
            { icon: "🤖", title: "Bots", list: ["FaceID", "MiniApp"] },
            { icon: "🛡️", title: "VPNs", list: ["Outline", "v2rayN"] },
          ].map((cat, i) => (
            <div
              key={i}
              className="p-3 bg-white rounded-2xl shadow-sm border flex flex-col"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{cat.icon}</span>
                <span className="font-bold text-sm text-blue-600">{cat.title}</span>
              </div>
              <div className="text-xs text-gray-500 leading-tight">
                {cat.list.join("\n")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH BOX */}
      <div className="max-w-[420px] w-full px-4 mb-3">
        <div className="flex items-center bg-white rounded-full shadow-md border px-4 py-2 text-sm text-gray-500">
          <span className="mr-2 text-xl">🔍</span>
          <input
            type="text"
            placeholder={t.search}
            className="w-full outline-none bg-transparent"
          />
        </div>
      </div>

      {/* 🔥 MATERIAL CARDS — BACKENDDAN KELGAN MA'LUMOTLAR */}
      <div className="max-w-[420px] w-full px-4 mt-1 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Yuklanmoqda...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Hozircha material yo‘q.</div>
        ) : (
          materials.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-[999px] shadow-sm border px-5 py-3 flex items-center gap-4 justify-between"
            >
              <div className="flex-1">
                <a
                  onClick={() => openHandler(item.post_link)}
                  className="text-sm font-semibold text-blue-700 underline cursor-pointer"
                >
                  {index + 1}. {item.title}
                </a>
              </div>

              {/* VERSION */}
              <div className="text-xs text-gray-500 whitespace-nowrap mr-2">
                {t.version} {item.version || "—"}
              </div>

              {/* DOWNLOAD button */}
              <button
                onClick={() => openHandler(item.post_link)}
                className="px-4 py-1 rounded-full text-xs font-semibold text-white shadow-md bg-gradient-to-r from-orange-400 to-orange-500"
              >
                {t.download}
              </button>
            </div>
          ))
        )}
      </div>

      {/* BOTTOM NAVBAR */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[92%] max-w-[420px]">
        <div className="bg-white rounded-full shadow-lg border flex justify-around py-3 px-4">
          <button className="flex flex-col items-center -mt-4">
            <div className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg flex flex-col items-center text-center">
              <span className="text-lg">🏠</span>
              <span className="text-xs font-semibold mt-1">{t.home}</span>
            </div>
          </button>

          <button className="flex flex-col items-center text-gray-600 text-xs">
            <span className="text-lg">📂</span>
            {t.categories}
          </button>

          <button className="flex flex-col items-center text-gray-600 text-xs">
            <span className="text-lg">❤️</span>
            {t.saved}
          </button>

          <button className="flex flex-col items-center text-gray-600 text-xs">
            <span className="text-lg">👤</span>
            {t.profile}
          </button>
        </div>
      </div>
    </div>
  );
}
