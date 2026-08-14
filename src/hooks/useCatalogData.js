import { useEffect, useState } from "react";

const SHEET_BASE =
  "https://opensheet.elk.sh/1z7O8Xlq5WN3VRv45lEyTu4QpW6O3tEcefsg5O5y1y5g/";
const MATERIALS_URL = `${SHEET_BASE}Materials`;
const CHANNELS_URL = `${SHEET_BASE}Channels`;
const KEY_LIST_URLS = [
  `${SHEET_BASE}key_list`,
  `${SHEET_BASE}${encodeURIComponent("key list")}`,
  `${SHEET_BASE}Key%20list`,
  `${SHEET_BASE}materials_db`,
];

export function useCatalogData() {
  const [materials, setMaterials] = useState([]);
  const [channels, setChannels] = useState([]);
  const [dbRows, setDbRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function tryFetch(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    }

    async function load() {
      try {
        const [mData, cData] = await Promise.all([
          tryFetch(MATERIALS_URL),
          tryFetch(CHANNELS_URL),
        ]);

        let dbList = [];
        for (const url of KEY_LIST_URLS) {
          const rows = await tryFetch(url);
          if (rows.length > 0) {
            dbList = rows;
            break;
          }
        }
        if (dbList.length === 0) {
          dbList = await tryFetch(`${SHEET_BASE}Materials_db`);
        }
        setDbRows(dbList);

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

  return { materials, channels, dbRows, loading };
}
