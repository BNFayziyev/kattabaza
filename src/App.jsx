import React, { useState, useEffect } from "react";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark";

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
      noData: "No materials yet.",
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
      noData: "Материалов пока нет.",
    },
  }[lang];

  // 🔥 MATERIALS FETCH
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("https://med-backend-vmgf.onrender.com/materials");
        const data = await res.json();
        setMaterials(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col items-center pb-24 ${
        isDark ? "bg-[#0F172A] text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* HEADER */}
      <div className="w-full max-w-[420px] flex justify-between items-center px-6 py-4">
        <div className="flex items-center bg-white shadow-md rounded-full px-3 py-2 gap-2">
          <button
            onClick={() => setTheme("light")}
            className={`px-2 py-1 rounded-full text-sm font-bold ${
              theme === "light" ? "bg-orange-400 text-white" : "text-gray-500"
            }`}
          >
            ☀️
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-2 py-1 rounded-full text-sm font-bold ${
              theme === "dark" ? "bg-indigo-500 text-white" : "text-gray-500"
            }`}
          >
            🌙
          </button>
        </div>

        <div className="text-xl font-extrabold tracking-wide">KattaBaza</div>

        <div className="flex items-center bg-white shadow-md rounded-full px-3 py-2 gap-2 text-sm font-semibold">
          <button
            onClick={() => setLang("en")}
            className={`px-2 py-1 rounded-full ${
              lang === "en" ? "bg-orange-400 text-white shadow" : "text-gray-500"
            }`}
          >
            EN
          </button>

          <button
            onClick={() => setLang("ru")}
            className={`px-2 py-1 rounded-full ${
              lang === "ru" ? "bg-orange-400 text-white shadow" : "text-gray-500"
            }`}
          >
            RU
          </button>
        </div>
      </div>

      {/* Kategoriya */}
      <div className="max-w-[420px] w-full px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-sm">{t.categoriesTitle}</div>
          <div className="px-3 py-1 bg-white rounded-full shadow text-xs border">
            View all &gt;
          </div>
        </div>
      </div>

      {/* Qidiruv */}
      <div className="max-w-[420px] w-full px-4 mb-3">
        <div className="flex items-center bg-white rounded-full shadow-md border px-4 py-2 text-sm">
          <span className="mr-2 text-xl">🔍</span>
          <input
            type="text"
            placeholder={t.search}
            className="w-full outline-none bg-transparent"
          />
        </div>
      </div>

      {/* MATERIAL CARDS */}
      <div className="max-w-[420px] w-full px-4 mt-2 space-y-3">

        {loading && (
          <div className="text-center text-gray-500 py-10">Loading...</div>
        )}

        {!loading && materials.length === 0 && (
          <div className="text-center text-gray-500 py-10">{t.noData}</div>
        )}

        {materials.map((m, index) => (
          <div
            key={m.id}
            className="bg-white rounded-2xl shadow-md border p-4 flex flex-col"
          >
            <div className="font-bold">{m.title}</div>
            <div className="text-xs text-gray-500">{m.description}</div>

            {m.preview_url && (
              <img
                src={m.preview_url}
                className="rounded-xl mt-2 w-full"
                alt="preview"
              />
            )}

            <div className="flex justify-between items-center mt-3">
              <div className="text-xs text-gray-600">
                {t.version}: {m.version || "—"}
              </div>

              <button
                onClick={() => window.open(m.post_link, "_blank")}
                className="px-4 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[92%] max-w-[420px]">
        <div className="bg-white rounded-full shadow-lg border flex justify-around py-3 px-4">
          <button className="flex flex-col items-center -mt-4">
            <div className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg text-center">
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
