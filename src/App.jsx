import React, { useState } from "react";

export default function App() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("en");

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

  const links = [
    
    {
      name: "v2rayN",
      version: "7.16.4",
      type: "download",
      openLink: "https://github.com/2dust/v2rayN",
      downloadLink:
        "https://github.com/2dust/v2rayN/releases/download/7.16.4/v2rayN-windows-64-SelfContained.zip",
    },
    {
      name: "Net_Monitor_",
      version: "21",
      type: "download",
      openLink: "https://networklookout.com/",
      downloadLink: "https://networklookout.com/dwn/nmemplpro.exe",
    },
    {
      name: "Outline VPN",
      version: "2.5.1",
      type: "download",
      openLink: "https://getoutline.org/",
    },
    {
      name: "AnyDesk",
      version: "8.0",
      type: "download",
      openLink: "https://anydesk.com/en",
      downloadLink: "https://download.anydesk.com/AnyDesk.exe",
    },
    {
      name: "Speedtest.uz",
      version: "Web",
      type: "open",
      openLink: "https://www.speedtest.uz/",
    },
    {
      name: "Steam",
      version: "3.1",
      type: "download",
      openLink: "https://store.steampowered.com/",
      downloadLink:
        "https://cdn.cloudflare.steamstatic.com/client/installer/SteamSetup.exe",
    },
    {
      name: "Fast.com",
      version: "Web",
      type: "open",
      openLink: "https://fast.com",
    },
    {
      name: "Telegram Desktop",
      version: "1.2.3",
      type: "download",
      openLink: "https://desktop.telegram.org/",
      downloadLink: "https://telegram.org/dl/desktop/win64",
    },
    {
      name: "Chrome",
      version: "1.2.3",
      type: "download",
      openLink: "https://www.google.com/chrome/",
    },
    {
      name: "TeamViewer",
      version: "15",
      type: "download",
      openLink: "https://www.teamviewer.com/en/",
      downloadLink: "https://download.teamviewer.com/download/TeamViewer_Setup.exe",
    },
  ];

  const openHandler = (item) => {
    window.open(item.openLink, "_blank");
  };

  const downloadHandler = (item) => {
    window.open(item.downloadLink || item.openLink, "_blank");
  };

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

        {/* Language Toggle EN/RU */}
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

      {/* Kategoriya */}
      <div className="max-w-[420px] w-full px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-sm">{t.categoriesTitle}</div>
          <div className="px-3 py-1 bg-white rounded-full shadow text-xs border">
            View all &gt;
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: "🌐", title: "Webs", list: ["Speedtest.uz", "Fast.com"] },
            { icon: "➕", title: "Apps", list: ["Telegram", "Chrome"] },
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

      {/* Qidiruv */}
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

      {/* LINK CARDS */}
      <div className="max-w-[420px] w-full px-4 mt-1 space-y-3">
        {links.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-[999px] shadow-sm border px-5 py-3 flex items-center gap-4"
          >
            <div className="flex-1">
              <a
                onClick={() => openHandler(item)}
                className="text-sm font-semibold text-blue-700 underline cursor-pointer"
              >
                {index + 1}. {item.name}
              </a>
            </div>

            <button
              onClick={() =>
                item.type === "download"
                  ? downloadHandler(item)
                  : openHandler(item)
              }
              className={`px-4 py-1 rounded-full text-xs font-semibold text-white shadow-md ${
                item.type === "download"
                  ? "bg-gradient-to-r from-orange-400 to-orange-500"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`}
            >
              {item.type === "download" ? t.download : t.open}
            </button>

            <div className="ml-2 text-xs text-gray-500 whitespace-nowrap">
              {t.version} {item.version}
            </div>
          </div>
        ))}
      </div>

      {/* FLOATING BOTTOM NAVBAR — RESTORED */}
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
