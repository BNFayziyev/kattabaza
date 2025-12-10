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
      <div className="max-w-[420px] w-full px-4 mt-1 space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Yuklanmoqda...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Hozircha material yo‘q.
          </div>
        ) : (
          materials.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl shadow-sm border px-5 py-4 flex flex-col gap-3"
            >
              {/* ROW: IMAGE + TITLE + FILE INFO */}
              <div className="flex items-center justify-between gap-3">

                {/* LEFT: Preview + Title */}
                {/* LEFT: Preview + Title + Description */}
                <div className="flex items-start gap-3 w-full">

                  {item.preview_url ? (
                    <img
                      src={item.preview_url}
                      alt="preview"
                      className="w-12 h-12 rounded-md object-cover border mt-1"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-md mt-1"></div>
                  )}

                  <div className="flex flex-col">
                    {/* CLEAN TITLE */}
                    <a
                      className="text-sm font-semibold text-blue-700 underline cursor-pointer"
                      onClick={() => openHandler(item.post_link)}
                    >
                      {item.title.replace(/\.[^/.]+$/, "")}
                    </a>

                    {/* DESCRIPTION (ONE LINE) */}
                    {item.descrip && (
                      <p className="text-xs text-gray-500 truncate max-w-[220px]">
                        {item.descrip}
                      </p>
                    )}
                  </div>

                </div>

                {/* RIGHT: FILE FORMAT + SIZE */}
                {/* RIGHT: FILE FORMAT + SIZE */}
                <div className="flex flex-col items-end gap-1 min-w-[55px]">
                  <div className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 border font-semibold">
                    {item.file_type || "—"}
                  </div>

                  <div className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 border text-gray-600">
                    {item.size_mb ? item.size_mb + " MB" : "—"}
                  </div>
                </div>


              </div>

              {/* DOWNLOAD BUTTONS */}
              <div className="flex gap-3">
                <button
                  onClick={() => openHandler(item.post_link)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold flex-1 justify-center"
                >
                  <img src="/pic/icontg128.png" className="w-4 h-4" />
                  Download
                </button>

                <button
                  onClick={() => openHandler(item.file_url)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full text-white text-xs font-semibold flex-1 justify-center"
                  style={{ backgroundColor: "#f76400" }}
                >
                  <img src="/pic/icondw128.png" className="w-4 h-4" />
                  Download
                </button>
              </div>

            </div>

          ))
        )}
      </div>

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
