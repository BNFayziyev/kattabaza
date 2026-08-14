import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getTranslations } from "./lib/i18n";
import { useCatalogData } from "./hooks/useCatalogData";
import { useIpInfo } from "./hooks/useIpInfo";

import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import KeysModal from "./components/KeysModal";
import ConnectionCard from "./components/ConnectionCard";
import LocationMap from "./components/LocationMap";
import SearchBar from "./components/SearchBar";
import MaterialsGrid from "./components/MaterialsGrid";
import ChannelsCategoriesView from "./components/ChannelsCategoriesView";

function initialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("kb-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initialLang() {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("kb-lang");
  return stored === "ru" ? "ru" : "en";
}

export default function App() {
  const [theme, setTheme] = useState(initialTheme);
  const [lang, setLang] = useState(initialLang);
  const [copiedIp, setCopiedIp] = useState("");
  const [keysOpen, setKeysOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [view, setView] = useState("home"); // home | categories | channel | category
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  const location = useLocation();
  const navigate = useNavigate();

  const t = getTranslations(lang);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("kb-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("kb-lang", lang);
  }, [lang]);

  const { materials, channels, dbRows, loading } = useCatalogData();
  const ipInfo = useIpInfo();

  // URL -> STATE sync
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
      setView("category");
      setSelectedCategory(decodeURIComponent(parts[1]));
      return;
    }

    const chName = decodeURIComponent(parts[0]);
    const foundChannel = channels.find((c) => String(c.Name) === String(chName)) || null;

    if (foundChannel && parts.length === 1) {
      setView("channel");
      setSelectedChannel(foundChannel);
      setSelectedCategory(null);
      return;
    }

    if (foundChannel && parts.length >= 2) {
      setView("category");
      setSelectedChannel(foundChannel);
      setSelectedCategory(decodeURIComponent(parts[1]));
      return;
    }

    setView("categories");
    setActiveTab("categories");
  }, [location.pathname, channels]);

  const openHandler = (url) => url && window.open(url, "_blank");

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

  const handleNavigate = (tab) => {
    if (tab === "home") {
      setView("home");
      setActiveTab("home");
      navigate("/home");
      return;
    }
    if (tab === "categories") {
      setView("categories");
      setActiveTab("categories");
      navigate("/categories");
      return;
    }
    setActiveTab(tab);
  };

  const handleSelectChannel = (ch) => {
    setSelectedChannel(ch);
    setView("channel");
    navigate("/" + encodeURIComponent(ch.Name));
  };

  const handleSelectCategory = (cat, channel) => {
    setSelectedCategory(cat);
    setView("category");
    if (channel?.Name) {
      navigate("/" + encodeURIComponent(channel.Name) + "/" + encodeURIComponent(cat));
    } else {
      navigate("/categories/" + encodeURIComponent(cat));
    }
  };

  const popularCategories = useMemo(() => {
    const stats = {};
    materials.forEach((m) => m.categories.forEach((c) => (stats[c] = (stats[c] || 0) + 1)));
    return Object.keys(stats);
  }, [materials]);

  const visibleMaterials = useMemo(() => {
    let list = materials;

    if (view === "channel" && selectedChannel) {
      list = list.filter((m) => m.channel_ID === selectedChannel.channel_ID);
    }

    if (view === "category" && selectedCategory) {
      list = list.filter((m) => {
        if (selectedChannel) {
          return (
            m.channel_ID === selectedChannel.channel_ID &&
            m.categories.includes(selectedCategory)
          );
        }
        return m.categories.includes(selectedCategory);
      });
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((m) =>
        [m.title, m.description].filter(Boolean).some((field) =>
          String(field).toLowerCase().includes(query)
        )
      );
    }

    return list;
  }, [materials, view, selectedChannel, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col text-text transition-colors lg:pl-64">
      <LocationMap
        latitude={ipInfo.latitude}
        longitude={ipInfo.longitude}
        label={ipInfo.city || ipInfo.region}
        theme={theme}
      />

      <Sidebar
        t={t}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        setLang={setLang}
        activeTab={activeTab}
        channels={channels}
        selectedChannel={selectedChannel}
        onNavigate={handleNavigate}
        onSelectChannel={handleSelectChannel}
        onOpenKeys={() => setKeysOpen(true)}
      />

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-5">
        <ConnectionCard t={t} ipInfo={ipInfo} copiedIp={copiedIp} onCopy={copyText} />
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t.search} />

        {view === "categories" && (
          <ChannelsCategoriesView
            t={t}
            channels={channels}
            popularCategories={popularCategories}
            selectedChannel={selectedChannel}
            onSelectChannel={handleSelectChannel}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {(view === "home" || view === "channel" || view === "category") && (
          <MaterialsGrid
            t={t}
            materials={visibleMaterials}
            loading={loading}
            emptyMessage={searchQuery.trim() ? t.noSearchResults : t.noMaterials}
            onOpen={openHandler}
          />
        )}
      </main>

      <Footer t={t} />

      <KeysModal open={keysOpen} onClose={() => setKeysOpen(false)} t={t} dbRows={dbRows} />
    </div>
  );
}
