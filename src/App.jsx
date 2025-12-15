import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("uz");
  const [materials, setMaterials] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 NAV STATE (oldingi mantiq saqlanadi)
  const [view, setView] = useState("home"); // home | categories | channel | category
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const navigate = useNavigate();
  const isDark = theme === "dark";

  const MATERIALS_URL =
    "https://opensheet.elk.sh/1z7O8Xlq5WN3VRv45lEyTu4QpW6O3tEcefsg5O5y1y5g/Materials";
  const CHANNELS_URL =
    "https://opensheet.elk.sh/1z7O8Xlq5WN3VRv45lEyTu4QpW6O3tEcefsg5O5y1y5g/Channels";

  // 🟦 DATA LOAD (o‘zgarmagan)
  useEffect(() => {
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
      } catch (e) {
        console.error("Load error:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

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

  // 🔹 CATEGORY STATS (oldingi)
  const categoryStats = {};
  materials.forEach((m) =>
    m.categories.forEach((c) => {
      categoryStats[c] = (categoryStats[c] || 0) + 1;
    })
  );
  const popularCategories = Object.keys(categoryStats);

  // 🔹 FILTER (oldingi FIX bilan)
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
    <>
      {/* ROUTES — VIEW ↔ URL */}
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={null} />
        <Route path="/categories" element={null} />
        <Route
          path="/:channelName"
          element={
            <ChannelResolver
              channels={channels}
              setSelectedChannel={setSelectedChannel}
              setView={setView}
            />
          }
        />
      </Routes>

      {/* UI — QUYIDAN BOSHLAB 100% OLDINGIDAY */}
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
              className={`px-2 py-1 rounded-full ${
                theme === "light"
                  ? "bg-[#f76400] text-white"
                  : "text-gray-500"
              }`}
            >
              ☀️
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`px-2 py-1 rounded-full ${
                theme === "dark"
                  ? "bg-[#f76400] text-white"
                  : "text-gray-500"
              }`}
            >
              🌙
            </button>
          </div>

          <div className="text-xl font-extrabold">KattaBaza</div>

          <div className="flex gap-2">
            <button onClick={() => setLang("uz")}>UZ</button>
            <button onClick={() => setLang("ru")}>RU</button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="max-w-[420px] w-full px-4 mb-3">
          <div className="flex items-center bg-white rounded-full shadow-md border px-4 py-2">
            🔍
            <input
              type="text"
              placeholder={t.search}
              className="w-full outline-none bg-transparent ml-2"
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-w-[420px] w-full px-4 mt-1 space-y-3">
          {/* CATEGORIES */}
          {view === "categories" && (
            <>
              <div className="font-bold mb-2">Kanallar</div>
              {channels.map((ch) => (
                <div
                  key={ch.channel_ID}
                  className="bg-white rounded-2xl border px-5 py-3 cursor-pointer"
                  onClick={() => {
                    setSelectedChannel(ch);
                    setView("channel");
                    navigate(`/${ch.Name}`);
                  }}
                >
                  📢 {ch.Name}
                </div>
              ))}

              <div className="font-bold mt-4 mb-2">
                Mashhur kategoriyalar
              </div>
              <div className="flex flex-wrap gap-2">
                {popularCategories.map((cat) => (
                  <div
                    key={cat}
                    className="px-3 py-1 bg-[#f76400] text-white rounded-full text-xs cursor-pointer"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setView("category");
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* MATERIALS — OLDINGIDAY */}
          {(view === "home" ||
            view === "channel" ||
            view === "category") &&
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
                  <div className="flex justify-between gap-3">
                    <div>
                      <div
                        className="text-sm font-semibold text-blue-700 underline cursor-pointer"
                        onClick={() => openHandler(item.post_link)}
                      >
                        {item.title}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-xs">{item.size_mb} MB</div>
                  </div>
                </div>
              ))
            ))}
        </div>

        {/* BOTTOM NAV */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px]">
          <div className="bg-white rounded-full shadow-lg border flex justify-around py-3">
            <div
              onClick={() => {
                setView("home");
                navigate("/home");
              }}
              className="cursor-pointer"
            >
              🏠
            </div>
            <div
              onClick={() => {
                setView("categories");
                navigate("/categories");
              }}
              className="cursor-pointer"
            >
              📂
            </div>
            <div>❤️</div>
            <div>👤</div>
          </div>
        </div>
      </div>
    </>
  );
}

/* 🔹 URL → CHANNEL */
function ChannelResolver({ channels, setSelectedChannel, setView }) {
  const { channelName } = useParams();

  useEffect(() => {
    const ch = channels.find((c) => c.Name === channelName);
    if (ch) {
      setSelectedChannel(ch);
      setView("channel");
    }
  }, [channelName, channels]);

  return null;
}
