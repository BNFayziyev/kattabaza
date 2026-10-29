import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { EXTRA_APPS, setLockedUrls } from "../lib/appCatalog";
import { applyServiceConfig } from "../lib/site";

/**
 * Catalog data source.
 *
 * VITE_DATA_SOURCE:
 *   "sheet"    — Google Sheets, lokal server orqali (/api/catalog)  (default for now)
 *   "supabase" — Supabase only
 *   "auto"     — try Supabase, fall back to the Sheet if it returns nothing
 *
 * Sheet endi brauzerdan to'g'ridan-to'g'ri o'qilmaydi: server/sheets.js uni
 * keshlab, faqat kerakli maydonlarni beradi — Sheet ID brauzerga tushmaydi,
 * opensheet ishlamay qolsa oxirgi nusxa ko'rsatiladi.
 *
 * ⚠️ KEYS ARE NOT READ HERE. They come only from POST /api/keys/unlock after
 * the password is checked on the server. Do not re-add them here.
 */

const SOURCE = import.meta.env.VITE_DATA_SOURCE || "sheet";

/** Local server (Google Sheets cache) -> UI shape */
async function loadFromSheet() {
  const res = await fetch("/api/catalog");
  if (!res.ok) throw new Error(`catalog: HTTP ${res.status}`);
  const data = await res.json();
  return { materials: data.materials || [], channels: data.channels || [] };
}

/** Supabase -> the same UI shape, so components need no changes */
async function loadFromSupabase() {
  const [{ data: mats, error: mErr }, { data: chans }] = await Promise.all([
    supabase.rpc("search_materials", { q: "", p_limit: 100, p_offset: 0 }),
    supabase.from("v_channels_public").select("tg_chat_id, username, title, topic"),
  ]);

  if (mErr) throw new Error(mErr.message);

  const materials = (mats || []).map((r) => ({
    ...r,
    file_url: r.external_url ?? "",
    channel_ID: r.target_chat_id != null ? String(r.target_chat_id) : "",
    categories: Array.isArray(r.categories) ? r.categories : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    gallery_urls: Array.isArray(r.gallery_urls) ? r.gallery_urls : [],
  }));

  const channels = (chans || []).map((c) => ({
    channel_ID: String(c.tg_chat_id),
    Name: c.title || c.username || String(c.tg_chat_id),
    username: c.username,
    topic: c.topic,
  }));

  return { materials, channels };
}

export function useCatalogData() {
  const [materials, setMaterials] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null);
  const [site, setSite] = useState({ banner: "", maintenance: "" });

  useEffect(() => {
    let alive = true;

    (async () => {
      let result = { materials: [], channels: [] };
      let used = SOURCE;

      try {
        if (SOURCE === "supabase") {
          result = await loadFromSupabase();
        } else if (SOURCE === "auto") {
          try {
            result = await loadFromSupabase();
            used = "supabase";
          } catch {
            result = { materials: [], channels: [] };
          }
          if (result.materials.length === 0) {
            result = await loadFromSheet();
            used = "sheet";
          }
        } else {
          result = await loadFromSheet();
        }
      } catch (err) {
        console.error("[KattaBaza] catalog load failed:", err);
      }

      // Admin sozlamalari: yashirilgan/o'zgartirilgan va qo'shilgan ilovalar, servislar, e'lon
      let cfg = {};
      try {
        const r = await fetch("/api/site");
        if (r.ok) cfg = await r.json();
      } catch {}
      applyServiceConfig(cfg.services);

      if (!alive) return;
      const overrides = cfg.overrides || {};
      const custom = (cfg.customApps || []).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        categories: a.categories?.length ? a.categories : ["windows"],
        tags: [],
        gallery_urls: [],
        file_url: a.file_url,
        file_type: a.file_type || "WEB",
        size_mb: a.size_mb,
        version: a.version,
        platform: "",
        author: "",
        preview_url: a.preview_url,
        post_link: "",
        channel_ID: "",
        created_at: "",
        section: a.section,
        locked: a.locked,
      }));
      setLockedUrls(custom.filter((a) => a.locked).map((a) => a.file_url));
      const merged = [...result.materials, ...EXTRA_APPS, ...custom]
        .filter((m) => !overrides[m.id]?.hidden)
        .map((m) => {
          const o = overrides[m.id];
          if (!o) return m;
          const { hidden, ...rest } = o;
          const next = { ...m, ...rest };
          // Havola o'zgargan bo'lsa — versiyalar ro'yxati ham shunga ko'rsatsin
          if (rest.file_url && m.versions) next.versions = [{ ...m.versions[0], url: rest.file_url }, ...m.versions.slice(1)];
          if (rest.description) next.descriptions = undefined;
          return next;
        });
      setSite({ banner: cfg.banner || "", maintenance: cfg.maintenance || "" });
      setMaterials(merged);
      setChannels(result.channels);
      setSource(used);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return {
    materials,
    channels,
    loading,
    source,
    site,
    // Keys are never loaded here — KeysPanel fetches them via unlock_keys().
    dbRows: [],
  };
}
