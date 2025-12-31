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
            {/* CONTENT */}
      <div className="max-w-[420px] w-full px-4 mt-1 space-y-3">
        {/* 📂 KATEGORIYALAR VIEW → KANALLAR */}
        {view === "categories" && (
          <>
            <div className="font-bold mb-2">Kanallar</div>
            {channels.map((ch) => (
              <div
                key={ch.channel_ID}
                className="bg-white rounded-2xl shadow-sm border px-5 py-3 cursor-pointer"
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

            <div className="font-bold mt-4 mb-2">Mashhur kategoriyalar</div>
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((cat) => (
                <div
                  key={cat}
                  className="px-3 py-1 bg-[#f76400] text-white rounded-full text-xs cursor-pointer"
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
              Yuklanmoqda...
            </div>
          ) : visibleMaterials.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Hozircha material yo‘q.
            </div>
          ) : (
            visibleMaterials.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl shadow-sm border px-5 py-4 flex flex-col gap-3"
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

                    <div className="flex flex-col">
                      <a
                        className="text-sm font-semibold text-blue-700 underline cursor-pointer"
                        onClick={() => openHandler(item.post_link)}
                      >
                        {item.title
                          ? item.title.replace(/\.[^/.]+$/, "")
                          : ""}
                      </a>

                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 max-w-[220px]">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 min-w-[60px]">
                    <div className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 border font-semibold text-center">
                      {item.file_type || "—"}
                    </div>

                    <div className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 border text-gray-600 text-center">
                      {item.size_mb ? item.size_mb + " MB" : "—"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openHandler(item.post_link)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold flex-1 justify-center"
                  >
                    <img src="/pic/icontg128.png" className="w-4 h-4" />
                    Download
                  </button>

                  <button
                    onClick={() => item.file_url && openHandler(item.file_url)}
                    disabled={!item.file_url}
                    className={
                      "flex items-center gap-2 px-3 py-2 rounded-full text-white text-xs font-semibold flex-1 justify-center" +
                      (item.file_url ? "" : " opacity-50 cursor-not-allowed")
                    }
                    style={{ backgroundColor: "#f76400" }}
                  >
                    <img src="/pic/icondw128.png" className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            ))
          ))}
      </div>

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
