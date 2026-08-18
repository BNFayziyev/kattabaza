import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Catalog data source.
 *
 * VITE_DATA_SOURCE:
 *   "sheet"    — Google Sheets only            (default for now)
 *   "supabase" — Supabase only
 *   "auto"     — try Supabase, fall back to the Sheet if it returns nothing
 *
 * ⚠️ TEMPORARY: the Sheet path is here only until the bot fills the database.
 * To remove it later, delete `loadFromSheet` and this comment, then set
 * VITE_DATA_SOURCE=supabase.
 *
 * ⚠️ KEYS ARE NOT READ FROM THE SHEET. The VLESS configs used to be loaded
 * into the browser from the public sheet before any password check, which made
 * them world-readable. They now live in Postgres behind `unlock_keys()`.
 * Do not re-add them here.
 */

const SOURCE = import.meta.env.VITE_DATA_SOURCE || "sheet";

const SHEET_ID =
  import.meta.env.VITE_SHEET_ID || "1z7O8Xlq5WN3VRv45lEyTu4QpW6O3tEcefsg5O5y1y5g";
const SHEET_BASE = `https://opensheet.elk.sh/${SHEET_ID}`;

const splitList = (v) =>
  v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : [];

async function fetchTab(tab) {
  try {
    const res = await fetch(`${SHEET_BASE}/${encodeURIComponent(tab)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Google Sheets -> UI shape */
async function loadFromSheet() {
  const [mData, cData] = await Promise.all([fetchTab("Materials"), fetchTab("Channels")]);

  const materials = mData
    .filter((m) => m && (m.title || "").trim())
    .map((m) => ({
      ...m,
      categories: splitList(m.categories),
      tags: splitList(m.tags),
      gallery_urls: splitList(m.gallery_urls),
    }));

  return { materials, channels: cData };
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

      if (!alive) return;
      setMaterials(result.materials);
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
    // Keys are never loaded here — KeysPanel fetches them via unlock_keys().
    dbRows: [],
  };
}
