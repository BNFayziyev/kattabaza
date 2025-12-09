import React, { useState, useEffect } from "react";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("uz");
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState("");

  const isDark = theme === "dark";

  const SHEET_ID = "1z7O8XlQ5WNBVRa4SlEyTU4qPW6O3tEcefsg5O5y1y5g";
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

  useEffect(() => {
    fetch(SHEET_URL)
      .then((res) => res.text())
      .then((data) => {
        const json = JSON.parse(data.substr(47).slice(0, -2));
        const rows = json.table.rows;

        const parsed = rows
          .map((r) => r.c)
          .filter((c) => c[0] && c[1]) // id + title mavjud
          .map((c) => ({
            id: c[0]?.v,
            title: c[1]?.v,
            description: c[2]?.v,
            categories: c[3]?.v?.split(",") || [],
            file_url: c[4]?.v,
            file_type: c[5]?.v,
            size_mb: c[6]?.v,
            version: c[7]?.v,
            preview_url: c[8]?.v,
            gallery_urls: c[9]?.v,
            post_link: c[10]?.v,
            platform: c[11]?.v,
            tags: c[12]?.v,
          }));

        setMaterials(parsed);
      })
      .catch((err) => console.error("Sheets error:", err));
  }, []);

  // Tillar
  const t = {
    uz: {
      search: "Qidirish...",
      version: "Versiya",
      download: "Yuklab olish",
      open: "Ochish",
      home: "Home",
      categories: "Kategoriyalar",
      saved: "Saqlanganlar",
      profile: "Profil",
      categoriesTitle: "Kategoriyalar:",
      noData: "Hozircha material yo'q.",
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

  const filtered = materials.filter((m) =>
    (m.title + m.description).toLowerCase().includes(search.toLowerCase())
  );

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
            className={`px-2 py-1 rounded-full text-sm font-bold transition ${
              theme === "light"
                ? "bg-orange-400 text-white"
                : "text-gray-500 bg-transparent"
            }`}
          >
            ☀️
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-2 py-1 rounded-full text-sm font-bold transition ${
              theme === "dark"
                ? "bg-indigo-500 text-white"
                : "text-gray-500 bg-transparent"
            }`}
          >
            🌙
          </button>
        </div>

        <div className="text-xl font-extrabold tracking-wide">KattaBaza</div>

        {/* Language */}
        <div className="flex items-center bg-white shadow-md rounded-full px-3 py-2 gap-2 text-sm font-semibold">
          <button
            onClick={() => setLang("uz")}
            className={`px-2 py-1 rounded-full ${
              lang === "uz" ? "bg-orange-400 text-white shadow" : "text-gray-500"
            }`}
          >
            UZ
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

      {/* Qidiruv */}
      <div className="max-w-[420px] w-full px-4 mb-3">
        <div className="flex items-center bg-white rounded-full shadow-md border px-4 py-2">
          <span className="mr-2 text-xl">🔍</span>
          <input
            type="text"
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none bg-transparent"
          />
        </div>
      </div>

      {/* MATERIAL LIST */}
      <div className="max-w-[420px] w-full px-4 space-y-4 mt-3">
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-10">
            {t.noData}
          </div>
        )}

        {filtered.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3"
          >
            {/* Preview image */}
            {m.preview_url && (
              <img
                src={m.preview_url}
                alt={m.title}
                className="w-16 h-16 rounded-lg object-cover border"
              />
            )}

            <div className="flex-1">
              <div className="font-bold text-sm">{m.title}</div>
              <div className="text-xs text-gray-500">{m.description}</div>

              {m.version && (
                <div className="text-xs text-gray-400 mt-1">
                  {t.version}: {m.version}
                </div>
              )}
            </div>

            {/* Action button */}
            <a
              href={m.file_url || m.post_link}
              target="_blank"
              className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-orange-500 shadow"
            >
              {m.file_type === "apk" ||
              m.file_type === "exe" ||
              m.file_type === "zip"
                ? t.download
                : t.open}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
