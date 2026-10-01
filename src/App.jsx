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
import AppsCatalog from "./components/AppsCatalog";
import ProfileView from "./components/ProfileView";
import ChannelsCategoriesView from "./components/ChannelsCategoriesView";
import CheckerPanel from "./components/CheckerPanel";
import IpLookup from "./components/IpLookup";
import AppsBlock from "./components/AppsBlock";
import ServiceBlock from "./components/ServiceBlock";
import AssistantPanel from "./components/AssistantPanel";
import { LANGS } from "./lib/i18n";
import { SERVICES } from "./lib/site";
import { APP_SECTIONS, sectionOf } from "./lib/appCatalog";

function initialTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("kb-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initialLang() {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("kb-lang");
  return LANGS.includes(stored) ? stored : "en";
}

export default function App() {
  const [theme, setTheme] = useState(initialTheme);
  const [lang, setLang] = useState(initialLang);
  const [copiedIp, setCopiedIp] = useState("");
  const [keysOpen, setKeysOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // IP qidiruvda topilgan joy — orqa fondagi xarita shu yerga uchadi
  const [lookupFocus, setLookupFocus] = useState(null);
  // Har oshganda xaritada samolyot uchadi (refresh yoki qidiruv bosilganda)
  const [flightId, setFlightId] = useState(0);

  const [view, setView] = useState("home"); // home | apps | categories | channel | category | checker | profile
  // /apps/<bo'lim> — null bo'lsa "Hammasi"
  const [appSection, setAppSection] = useState(null);
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

  const { materials, channels, loading } = useCatalogData();
  const ipInfo = useIpInfo();

  // URL -> STATE sync
  useEffect(() => {
    const raw = (location.pathname || "/").replace(/^\/+|\/+$/g, "");
    const parts = raw ? raw.split("/") : [];

    // ⚠️ Tekshiruv sahifasi kanallarga BOG'LIQ EMAS — shuning uchun u
    // quyidagi "kanallar yuklanmagan" tekshiruvidan OLDIN turadi.
    // Aks holda kattabaza.uz/checker ni to'g'ridan-to'g'ri ochganda
    // (yoki sahifani yangilaganda) bo'sh ekran chiqardi.
    if (parts[0] === "checker") {
      setView("checker");
      setActiveTab("checker");
      setSelectedChannel(null);
      setSelectedCategory(null);
      return;
    }

    // Profil sahifasi ham kanallarga bog'liq emas
    if (parts[0] === "profile") {
      setView("profile");
      setActiveTab("profile");
      setSelectedChannel(null);
      setSelectedCategory(null);
      return;
    }

    // Barcha ilovalar ro'yxati ham kanallarga bog'liq emas
    if (parts[0] === "apps") {
      const sec = parts[1] && APP_SECTIONS.some((s) => s.id === parts[1]) ? parts[1] : null;
      setView("apps");
      setActiveTab("apps");
      setAppSection(sec);
      setSelectedChannel(null);
      setSelectedCategory(null);
      return;
    }

    if (!channels || channels.length === 0) return;

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
    if (tab === "checker") {
      setView("checker");
      setActiveTab("checker");
      navigate("/checker");
      return;
    }
    if (tab === "profile") {
      setView("profile");
      setActiveTab("profile");
      navigate("/profile");
      return;
    }
    setActiveTab(tab);
  };

  const handleSelectAppSection = (id) => navigate(id ? `/apps/${id}` : "/apps");

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
        [m.title, m.description, ...Object.values(m.descriptions || {})].filter(Boolean).some((field) =>
          String(field).toLowerCase().includes(query)
        )
      );
    }

    return list;
  }, [materials, view, selectedChannel, selectedCategory, searchQuery]);

  const homeServices = SERVICES.filter((s) => s.home);
  const showBlocks = view === "home" && !searchQuery.trim();
  // Chap menyudagi "Ilovalar" bo'limlari va ulardagi soni
  const appGroups = useMemo(
    () =>
      APP_SECTIONS.map((s) => ({
        ...s,
        count: materials.filter((m) => sectionOf(m) === s.id).length,
      })).filter((g) => loading || g.count > 0),
    [materials, loading]
  );
  const mapTarget = lookupFocus || {
    latitude: ipInfo.latitude,
    longitude: ipInfo.longitude,
    label: ipInfo.city || ipInfo.region,
  };

  return (
    <div className="min-h-screen flex flex-col text-text transition-colors lg:pl-64 xl:pr-80">
      <LocationMap
        latitude={mapTarget.latitude}
        longitude={mapTarget.longitude}
        label={mapTarget.label}
        theme={theme}
        flightId={flightId}
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
        appGroups={appGroups}
        appsTotal={materials.length}
        appSection={appSection}
        onOpenApps={() => navigate("/apps")}
        onSelectAppSection={handleSelectAppSection}
      />

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-5">
        <ConnectionCard
          t={t}
          ipInfo={ipInfo}
          copiedIp={copiedIp}
          onCopy={copyText}
          onRefresh={() => {
            setLookupFocus(null);
            setFlightId((n) => n + 1);
            ipInfo.refresh();
          }}
        />
        <IpLookup
          t={t}
          onLocate={(target) => {
            // Xato bo'lganda (joy topilmadi) samolyot bekorga uchmasin
            if (!target && !lookupFocus) return;
            setLookupFocus(target);
            setFlightId((n) => n + 1);
          }}
        />
        {view !== "checker" && view !== "profile" && (
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t.search} />
        )}

        {/* Bosh sahifa: 2 ustunli bloklar (kichik ekranda 1 ustun) */}
        {showBlocks && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AppsBlock
              t={t}
              materials={materials}
              loading={loading}
              popularCategories={popularCategories}
              onOpen={openHandler}
              onViewAll={() => navigate("/apps")}
              onSelectCategory={(cat) => handleSelectCategory(cat, null)}
            />
            {homeServices.map((s) => (
              <ServiceBlock key={s.id} t={t} service={s} theme={theme} />
            ))}
          </div>
        )}

        {view === "checker" && <CheckerPanel lang={lang} />}

        {view === "profile" && <ProfileView t={t} />}

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

        {view === "apps" && (
          <AppsCatalog
            t={t}
            lang={lang}
            materials={visibleMaterials}
            loading={loading}
            section={appSection}
            emptyMessage={searchQuery.trim() ? t.noSearchResults : t.noMaterials}
            onSelectSection={handleSelectAppSection}
            onOpen={openHandler}
          />
        )}

        {((view === "home" && !showBlocks) || view === "channel" || view === "category") && (
          <MaterialsGrid
            t={t}
            lang={lang}
            materials={visibleMaterials}
            loading={loading}
            emptyMessage={searchQuery.trim() ? t.noSearchResults : t.noMaterials}
            onOpen={openHandler}
          />
        )}
      </main>

      <Footer t={t} />

      <KeysModal
        open={keysOpen}
        onClose={() => setKeysOpen(false)}
        onOpenProfile={() => {
          setKeysOpen(false);
          navigate("/profile");
        }}
        t={t}
      />

      <AssistantPanel t={t} />
    </div>
  );
}
