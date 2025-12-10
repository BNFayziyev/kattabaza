import React, { useState, useEffect } from "react";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("uz");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === "dark";

  const SHEET_URL =
    "https://opensheet.elk.sh/1z7O8Xlq5WN3VRv45lEyTu4QpW6O3tEcefsg5O5y1y5g/Materials";

  // 🟦 GOOGLE SHEETSDAN O‘QISH
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(SHEET_URL);
        const data = await res.json();

        // Google Sheetsdan keladigan kategoriyalarni massivga aylantiramiz
        const fixed = data.map((item) => ({
          ...item,
          categories: item.categories
            ? item.categories.split(",").map((c) => c.trim())
            : [],
        }));

        setMaterials(fixed);
      } catch (err) {
        console.error("Sheet fetch error:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const t = {
    uz: {
      search: "Qidirish...",
      version: "Versiya",
      download: "Yuklash",
      open: "Ochish",
      home: "Bosh sahifa",
      categories: "Kategoriyalar",
      saved: "Saqlanganlar",
      profile: "Profil",
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
        {/* Theme */}
        <div className="flex items-center bg-white shadow-md rounded-full px-3 py-2 gap-2">
          <button
            onClick={() => setTheme("light")}
            className={`px-2 py-1 rounded-full text-sm font-bold ${
              theme === "light"
                ? "bg-orange-400 text-white"
                : "text-gray-500 bg-transparent"
            }`}
          >
            ☀️
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-2 py-1 rounded-full text-sm font-bold ${
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

        {/* Language */}
        <div className="flex items-center bg-white shadow-md rounded-full px-3 py-2 gap-2 text-sm font-semibold">
          <button
            onClick={() => setLang("uz")}
            className={`px-2 py-1 rounded-full ${
              lang === "uz" ? "bg-orange-400 text-white" : "text-gray-500"
            }`}
          >
            UZ
          </button>
          <button
            onClick={() => setLang("ru")}
            className={`px-2 py-1 rounded-full ${
              lang === "ru" ? "bg-orange-400 text-white" : "text-gray-500"
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
      {/* MATERIALS */}
      import clsx from "clsx";

      export default function MaterialCard({ item }) {
        const openHandler = (url) => {
          if (url) window.open(url, "_blank");
        };

        return (
          <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-2 w-full mb-4">
            {/* MEDIA PREVIEW */}
            <div className="flex items-center gap-3">
              <img
                src={item.preview_url || "/pic/default_preview.png"}
                alt="preview"
                className="w-12 h-12 rounded-lg object-cover"
              />

              <div className="flex flex-col">
                {/* FILE NAME (without extension) */}
                <span className="font-semibold text-sm text-gray-900">
                  {item.title.replace(/\.[^/.]+$/, "")}
                </span>

                {/* DESCRIPTION */}
                <span className="text-xs text-gray-600 truncate w-40">
                  {item.description}
                </span>
              </div>

              {/* FILE TYPE + SIZE */}
              <div className="ml-auto flex flex-col items-end">
                <div className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {item.file_type}
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {item.size_mb ? item.size_mb + " MB" : ""}
                </div>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-2 mt-2">
              {/* DOWNLOAD FROM TELEGRAM */}
              <button
                onClick={() => openHandler(item.post_link)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold flex-1 justify-center"
              >
                <img src="/pic/icontg128.png" className="w-4 h-4" />
                Download from Telegram
              </button>

              {/* DIRECT DOWNLOAD (file_url required) */}
              <button
                onClick={() => item.file_url && openHandler(item.file_url)}
                disabled={!item.file_url}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-semibold flex-1 justify-center transition",
                  item.file_url
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-orange-300 opacity-50 cursor-not-allowed"
                )}
              >
                <img src="/pic/icondw128.png" className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        );
      }

      {/* BOTTOM NAV */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px]">
        <div className="bg-white rounded-full shadow-lg border flex justify-around py-3 px-4">
          <div className="flex flex-col items-center -mt-4">
            <div className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg">
              🏠 <div className="text-xs">{t.home}</div>
            </div>
          </div>
          <div className="text-xs text-gray-600 flex flex-col items-center">
            📂 {t.categories}
          </div>
          <div className="text-xs text-gray-600 flex flex-col items-center">
            ❤️ {t.saved}
          </div>
          <div className="text-xs text-gray-600 flex flex-col items-center">
            👤 {t.profile}
          </div>
        </div>
      </div>
    </div>
  );
}
