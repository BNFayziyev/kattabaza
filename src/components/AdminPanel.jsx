import { useCallback, useEffect, useMemo, useState } from "react";
import { APP_SECTIONS, EXTRA_APPS } from "../lib/appCatalog";
import { SERVICES_ALL } from "../lib/site";

const card = "rounded-lg border border-line bg-surface/30 backdrop-blur-md p-4";
const input =
  "w-full px-3 py-2 rounded-md border border-line bg-transparent text-sm text-text outline-none focus:border-primary";
const btn = "px-3 py-1.5 rounded-md text-xs font-semibold border border-line text-muted hover:text-primary hover:border-primary/60 transition-colors";
const btnPrimary = "px-3.5 py-2 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors";
const RANGES = [1, 7, 30, 90];
const tokenKey = "kb-admin-token";
const TABS = [
  ["stats", "Statistika"],
  ["apps", "Ilovalar"],
  ["pages", "Sahifalar"],
  ["settings", "Sozlamalar"],
];

const fmt = (n) => Number(n || 0).toLocaleString("ru-RU");
const time = (t) =>
  new Date(t).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// ---------- Kichik bo'laklar ----------

function Stat({ label, value, hint, accent }) {
  return (
    <div className={card}>
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`text-2xl font-extrabold ${accent ? "text-primary" : "text-text"}`}>{fmt(value)}</div>
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

function Bars({ title, rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className={card}>
      <h3 className="text-sm font-bold text-text mb-3">{title}</h3>
      {rows.length === 0 && <div className="text-xs text-muted">Hali ma'lumot yo'q</div>}
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.name} className="text-xs">
            <div className="flex justify-between gap-2 mb-0.5">
              <span className="truncate text-text">{r.name}</span>
              <span className="font-mono text-muted">{fmt(r.count)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-line/50">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chart({ title, series, field = "views", unit = "ko'rish" }) {
  const max = Math.max(1, ...series.map((s) => s[field]));
  return (
    <div className={card}>
      <h3 className="text-sm font-bold text-text mb-3">{title}</h3>
      <div className="flex items-end gap-px h-32">
        {series.map((s) => (
          <div key={s.date} className="flex-1 min-w-0 h-full flex flex-col justify-end group" title={`${s.date}: ${s[field]} ${unit}`}>
            <div className="w-full rounded-t bg-primary/70 group-hover:bg-primary" style={{ height: `${(s[field] / max) * 100}%`, minHeight: s[field] ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1 font-mono">
        <span>{series[0]?.date.slice(5)}</span>
        <span>{series[series.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-muted">
      {label}
      {children}
    </label>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-text cursor-pointer select-none">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="accent-[var(--color-primary,#2563eb)]" />
      {label}
    </label>
  );
}

function Login({ onToken }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) onToken(data.token);
      else if (res.status === 503) setError("Admin o'chiq: serverdagi .env ga ADMIN_PASSWORD qo'ying");
      else if (res.status === 429) setError("Juda ko'p urinish, keyinroq qayta urining");
      else setError("Parol noto'g'ri");
    } catch {
      setError("Server bilan aloqa yo'q");
    }
  };
  return (
    <form onSubmit={submit} className={`${card} max-w-sm w-full mx-auto flex flex-col gap-3`}>
      <h2 className="text-base font-bold text-text">Admin panel</h2>
      <input type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" className={input} />
      {error && <div className="text-xs text-red-500">{error}</div>}
      <button className={btnPrimary}>Kirish</button>
    </form>
  );
}

// ---------- Statistika ----------

function StatsTab({ data, days }) {
  const { totals, downloads } = data;
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Hozir saytda" value={totals.online} hint="so'nggi 5 daqiqa" accent />
        <Stat label="Bugun" value={totals.visitorsToday} hint={`${fmt(totals.viewsToday)} ko'rish · ${fmt(downloads.today)} yuklash`} />
        <Stat label={`${days} kun: tashrifchi`} value={totals.visitors} hint={`${fmt(totals.views)} ko'rish`} />
        <Stat label={`${days} kun: yuklash`} value={downloads.total} hint={`jami: ${fmt(downloads.allTime)}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Chart title="Ko'rishlar (kunlar bo'yicha)" series={data.series} />
        <Chart title="Yuklashlar (kunlar bo'yicha)" series={downloads.series} field="count" unit="yuklash" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Bars title="Eng ko'p yuklangan ilovalar" rows={downloads.apps.filter((a) => a.period).slice(0, 10).map((a) => ({ name: a.title, count: a.period }))} />
        <Bars title="Mashhur sahifalar" rows={data.pages} />
        <Bars title="Davlatlar" rows={data.countries} />
        <Bars title="Qayerdan kelgan" rows={data.referrers} />
        <Bars title="Qurilma" rows={data.devices} />
        <Bars title="Brauzer" rows={data.browsers} />
        <Bars title="Tizim" rows={data.systems} />
      </div>

      <div className={`${card} overflow-x-auto`}>
        <h3 className="text-sm font-bold text-text mb-3">So'nggi yuklashlar</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted">
              <th className="pb-2 pr-3 font-medium">Vaqt</th>
              <th className="pb-2 pr-3 font-medium">Ilova</th>
              <th className="pb-2 pr-3 font-medium">IP</th>
              <th className="pb-2 font-medium">Davlat</th>
            </tr>
          </thead>
          <tbody>
            {downloads.recent.map((r, i) => (
              <tr key={i} className="border-t border-line/60 text-text">
                <td className="py-1.5 pr-3 whitespace-nowrap">{time(r.t)}</td>
                <td className="py-1.5 pr-3">{r.title}</td>
                <td className="py-1.5 pr-3 font-mono">{r.ip}</td>
                <td className="py-1.5">{r.cc || "—"}</td>
              </tr>
            ))}
            {downloads.recent.length === 0 && (
              <tr><td colSpan={4} className="py-2 text-muted">Hali yuklash yo'q</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <h3 className="text-sm font-bold text-text mb-3">So'nggi tashrifchilar</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted">
              <th className="pb-2 pr-3 font-medium">Vaqt</th>
              <th className="pb-2 pr-3 font-medium">IP</th>
              <th className="pb-2 pr-3 font-medium">Davlat</th>
              <th className="pb-2 pr-3 font-medium">Sahifa</th>
              <th className="pb-2 pr-3 font-medium">Qurilma</th>
              <th className="pb-2 font-medium">Manba</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((r, i) => (
              <tr key={i} className="border-t border-line/60 text-text">
                <td className="py-1.5 pr-3 whitespace-nowrap">
                  {r.online && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />}
                  {time(r.t)}
                </td>
                <td className="py-1.5 pr-3 font-mono">{r.ip}</td>
                <td className="py-1.5 pr-3">{r.cc || "—"}</td>
                <td className="py-1.5 pr-3 font-mono">{r.path}</td>
                <td className="py-1.5 pr-3 whitespace-nowrap">{r.device} · {r.browser} · {r.os}</td>
                <td className="py-1.5 text-muted">{r.ref || "to'g'ridan-to'g'ri"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------- Ilovalar ----------

const blankApp = () => ({
  id: `adm-${Date.now().toString(36)}`,
  title: "",
  description: "",
  section: "kattabaza",
  categories: [],
  file_url: "",
  file_type: "",
  size_mb: "",
  version: "",
  preview_url: "",
  locked: false,
  hidden: false,
});

function AppEditor({ app, isCustom, onSave, onCancel }) {
  const [f, setF] = useState({ ...app, categories: (app.categories || []).join(", ") });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    onSave({ ...f, categories: f.categories.split(",").map((s) => s.trim()).filter(Boolean) });
  };
  return (
    <form onSubmit={submit} className={`${card} flex flex-col gap-3 border-primary/50`}>
      <h3 className="text-sm font-bold text-text">{isCustom ? (app.title ? "Ilovani tahrirlash" : "Yangi ilova") : `Tahrirlash: ${app.title}`}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Nomi"><input className={input} value={f.title} onChange={set("title")} required /></Field>
        <Field label="Yuklash havolasi">
          <input className={input} value={f.file_url} onChange={set("file_url")} placeholder="https://…" required={isCustom} />
        </Field>
        <Field label="Bo'lim">
          <select className={input} value={f.section || "kattabaza"} onChange={set("section")}>
            {APP_SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.id}</option>)}
          </select>
        </Field>
        <Field label="Kategoriyalar (vergul bilan)"><input className={input} value={f.categories} onChange={set("categories")} placeholder="windows, vpn" /></Field>
        <Field label="Versiya"><input className={input} value={f.version || ""} onChange={set("version")} /></Field>
        <Field label="Hajmi (MB)"><input className={input} value={f.size_mb || ""} onChange={set("size_mb")} /></Field>
        {isCustom && <Field label="Fayl turi (EXE, APK, ISO…)"><input className={input} value={f.file_type || ""} onChange={set("file_type")} /></Field>}
        <Field label="Rasm havolasi (ixtiyoriy)"><input className={input} value={f.preview_url || ""} onChange={set("preview_url")} /></Field>
      </div>
      <Field label="Tavsif"><textarea rows={3} className={input} value={f.description || ""} onChange={set("description")} /></Field>
      {isCustom && <Toggle on={f.locked} onChange={(v) => setF({ ...f, locked: v })} label="Yuklashda parol so'ralsin" />}
      <div className="flex gap-2">
        <button className={btnPrimary}>Saqlash</button>
        <button type="button" onClick={onCancel} className={btn}>Bekor qilish</button>
      </div>
    </form>
  );
}

function AppsTab({ site, setSite, stats }) {
  const [sheetApps, setSheetApps] = useState([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // { app, custom }

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => setSheetApps(d.materials || []))
      .catch(() => {});
  }, []);

  const counts = useMemo(() => new Map(stats.downloads.apps.map((a) => [a.id, a])), [stats]);
  const customIds = new Set(site.customApps.map((a) => a.id));

  const rows = useMemo(() => {
    const all = [
      ...sheetApps.map((a) => ({ ...a, origin: "jadval" })),
      ...EXTRA_APPS.map((a) => ({ ...a, origin: "katalog" })),
      ...site.customApps.map((a) => ({ ...a, origin: "qo'shilgan" })),
    ];
    const needle = q.trim().toLowerCase();
    return all
      .filter((a) => !needle || a.title.toLowerCase().includes(needle))
      .map((a) => ({
        ...a,
        shown: customIds.has(a.id) ? !a.hidden : !site.overrides[a.id]?.hidden,
        edited: !!site.overrides[a.id] && Object.keys(site.overrides[a.id]).some((k) => k !== "hidden"),
        dl: counts.get(a.id) || { all: 0, period: 0 },
      }))
      .sort((a, b) => b.dl.all - a.dl.all || a.title.localeCompare(b.title));
  }, [sheetApps, site, q, counts]);

  const toggleHidden = (a) => {
    if (customIds.has(a.id)) {
      setSite({ ...site, customApps: site.customApps.map((c) => (c.id === a.id ? { ...c, hidden: !c.hidden } : c)) });
    } else {
      const o = { ...(site.overrides[a.id] || {}) };
      o.hidden ? delete o.hidden : (o.hidden = true);
      setSite({ ...site, overrides: { ...site.overrides, [a.id]: o } });
    }
  };

  const save = (f) => {
    if (editing.custom) {
      const exists = customIds.has(f.id);
      setSite({ ...site, customApps: exists ? site.customApps.map((c) => (c.id === f.id ? f : c)) : [f, ...site.customApps] });
    } else {
      const o = { hidden: site.overrides[f.id]?.hidden };
      for (const k of ["title", "description", "file_url", "section", "version", "size_mb", "preview_url"]) o[k] = f[k] || "";
      o.categories = f.categories;
      setSite({ ...site, overrides: { ...site.overrides, [f.id]: o } });
    }
    setEditing(null);
  };

  const remove = (a) => {
    if (!confirm(`"${a.title}" butunlay o'chirilsinmi?`)) return;
    setSite({ ...site, customApps: site.customApps.filter((c) => c.id !== a.id) });
  };

  const reset = (a) => {
    const { [a.id]: _, ...rest } = site.overrides;
    setSite({ ...site, overrides: rest });
  };

  if (editing) return <AppEditor app={editing.app} isCustom={editing.custom} onSave={save} onCancel={() => setEditing(null)} />;

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input className={`${input} max-w-xs`} placeholder="Qidirish…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-xs text-muted">{rows.length} ta ilova</span>
        <button className={`${btnPrimary} ml-auto`} onClick={() => setEditing({ app: blankApp(), custom: true })}>+ Yangi ilova</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted">
              <th className="pb-2 pr-3 font-medium">Ilova</th>
              <th className="pb-2 pr-3 font-medium">Bo'lim</th>
              <th className="pb-2 pr-3 font-medium text-right">Yuklash (davr / jami)</th>
              <th className="pb-2 font-medium text-right">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className={`border-t border-line/60 ${a.shown ? "text-text" : "text-muted opacity-60"}`}>
                <td className="py-1.5 pr-3">
                  <div className="font-semibold">{a.title} {a.edited && <span className="text-[10px] text-primary">· o'zgartirilgan</span>}</div>
                  <div className="text-[10px] text-muted">{a.origin}</div>
                </td>
                <td className="py-1.5 pr-3">{a.section || "kattabaza"}</td>
                <td className="py-1.5 pr-3 text-right font-mono">{fmt(a.dl.period)} / {fmt(a.dl.all)}</td>
                <td className="py-1.5 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <button className={btn} onClick={() => setEditing({ app: { ...a, ...(site.overrides[a.id] || {}) }, custom: customIds.has(a.id) })}>Tahrirlash</button>
                    <button className={btn} onClick={() => toggleHidden(a)}>{a.shown ? "Yashirish" : "Ko'rsatish"}</button>
                    {customIds.has(a.id) ? (
                      <button className={btn} onClick={() => remove(a)}>O'chirish</button>
                    ) : (
                      a.edited && <button className={btn} onClick={() => reset(a)}>Asliga</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Sahifalar ----------

function PagesTab({ site, setSite, stats }) {
  const setSvc = (id, patch) => {
    const next = { ...(site.services[id] || {}), ...patch };
    setSite({ ...site, services: { ...site.services, [id]: next } });
  };
  const views = new Map(stats.pages.map((p) => [p.name, p.count]));
  return (
    <div className="flex flex-col gap-3">
      <div className={card}>
        <h3 className="text-sm font-bold text-text mb-3">Servis sahifalari</h3>
        <div className="flex flex-col divide-y divide-line/60">
          {SERVICES_ALL.map((s) => {
            const o = site.services[s.id] || {};
            return (
              <div key={s.id} className="py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
                <div className="min-w-[8rem]">
                  <div className="text-sm font-semibold text-text">/{s.id}</div>
                  <div className="text-[11px] text-muted">{fmt(views.get("/" + s.id))} ko'rish · {s.domain}</div>
                </div>
                <Toggle on={!o.hidden} onChange={(v) => setSvc(s.id, { hidden: !v })} label="Saytda ko'rinsin" />
                <Toggle on={(o.status || s.status) === "live"} onChange={(v) => setSvc(s.id, { status: v ? "live" : "soon" })} label="Ishlayapti (aks holda «tez orada»)" />
                <Toggle on={o.home ?? s.home} onChange={(v) => setSvc(s.id, { home: v })} label="Bosh sahifada" />
              </div>
            );
          })}
        </div>
      </div>
      <Bars title="Barcha sahifalar bo'yicha ko'rishlar" rows={stats.pages} />
    </div>
  );
}

// ---------- Sozlamalar ----------

function SettingsTab({ site, setSite, me, token }) {
  const exportCsv = async () => {
    const res = await fetch("/api/admin/export", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: "visits.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };
  const ips = site.ignoreIps.join(", ");
  return (
    <div className="flex flex-col gap-3">
      <div className={`${card} flex flex-col gap-3`}>
        <h3 className="text-sm font-bold text-text">E'lon (saytning tepasida chiqadi)</h3>
        <Toggle on={site.banner.on} onChange={(v) => setSite({ ...site, banner: { ...site.banner, on: v } })} label="Yoqilgan" />
        <input className={input} placeholder="Masalan: Yangi dasturlar qo'shildi!" value={site.banner.text} onChange={(e) => setSite({ ...site, banner: { ...site.banner, text: e.target.value } })} />
      </div>
      <div className={`${card} flex flex-col gap-3`}>
        <h3 className="text-sm font-bold text-text">Texnik ish rejimi</h3>
        <p className="text-xs text-muted">Yoqilsa, sayt o'rniga faqat xabar ko'rinadi. /admin ishlayveradi.</p>
        <Toggle on={site.maintenance.on} onChange={(v) => setSite({ ...site, maintenance: { ...site.maintenance, on: v } })} label="Yoqilgan" />
        <input className={input} placeholder="Saytda texnik ishlar olib borilmoqda." value={site.maintenance.text} onChange={(e) => setSite({ ...site, maintenance: { ...site.maintenance, text: e.target.value } })} />
      </div>
      <div className={`${card} flex flex-col gap-3`}>
        <h3 className="text-sm font-bold text-text">Statistikada hisobga olinmaydigan IP lar</h3>
        <p className="text-xs text-muted">O'zingizning tashriflaringiz statistikani buzmasligi uchun. Sizning IP: <span className="font-mono text-text">{me}</span></p>
        <input className={input} value={ips} onChange={(e) => setSite({ ...site, ignoreIps: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="1.2.3.4, 5.6.7.8" />
        {me && !site.ignoreIps.includes(me) && (
          <button className={`${btn} self-start`} onClick={() => setSite({ ...site, ignoreIps: [...site.ignoreIps, me] })}>Mening IP'imni qo'shish</button>
        )}
      </div>
      <div className={`${card} flex flex-col gap-3`}>
        <h3 className="text-sm font-bold text-text">Ma'lumotni yuklab olish</h3>
        <button className={`${btn} self-start`} onClick={exportCsv}>Tashriflar (CSV)</button>
      </div>
    </div>
  );
}

// ---------- Asosiy ----------

export default function AdminPanel() {
  const [token, setToken] = useState(() => {
    try {
      return window.sessionStorage.getItem(tokenKey) || "";
    } catch {
      return "";
    }
  });
  const [tab, setTab] = useState("stats");
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [site, setSite] = useState(null);
  const [me, setMe] = useState("");
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");

  const saveToken = (v) => {
    setToken(v);
    try {
      v ? window.sessionStorage.setItem(tokenKey, v) : window.sessionStorage.removeItem(tokenKey);
    } catch {}
  };

  const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/stats?days=${days}`, { headers: auth });
      if (res.status === 401) return saveToken("");
      setStats(await res.json());
    } catch {
      setMsg("Yuklab bo'lmadi");
    }
  }, [token, days, auth]);

  useEffect(() => {
    loadStats();
    if (!token) return;
    const id = setInterval(loadStats, 15_000);
    return () => clearInterval(id);
  }, [loadStats, token]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/site", { headers: auth })
      .then((r) => (r.status === 401 ? saveToken("") : r.json()))
      .then((d) => {
        if (d?.site) {
          setSite(d.site);
          setMe(d.me);
        }
      })
      .catch(() => {});
  }, [token, auth]);

  const edit = (next) => {
    setSite(next);
    setDirty(true);
    setMsg("");
  };

  const publish = async () => {
    setMsg("Saqlanmoqda…");
    try {
      const res = await fetch("/api/admin/site", {
        method: "PUT",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(site),
      });
      if (!res.ok) throw new Error();
      setSite((await res.json()).site);
      setDirty(false);
      setMsg("Saqlandi ✓ — sayt keyingi yangilanishda o'zgaradi");
    } catch {
      setMsg("Saqlab bo'lmadi");
    }
  };

  if (!token) return <Login onToken={saveToken} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold tracking-tight text-text">Admin panel</h1>
        <div className="flex items-center gap-2">
          {tab === "stats" &&
            RANGES.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${days === d ? "bg-primary text-on-primary border-primary" : "border-line text-muted hover:text-primary"}`}
              >
                {d === 1 ? "Bugun" : `${d} kun`}
              </button>
            ))}
          <button onClick={() => saveToken("")} className={btn}>Chiqish</button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-line">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3.5 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors ${tab === id ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {(dirty || msg) && (
        <div className="sticky top-2 z-20 flex items-center gap-3 rounded-lg border border-primary/50 bg-surface backdrop-blur-md px-4 py-2.5">
          <span className="text-sm text-text flex-1">{dirty ? "Saqlanmagan o'zgarishlar bor" : msg}</span>
          {dirty && <button className={btnPrimary} onClick={publish}>Saqlash</button>}
          {dirty && msg && <span className="text-xs text-muted">{msg}</span>}
        </div>
      )}

      {!stats || !site ? (
        <div className="text-sm text-muted">Yuklanmoqda…</div>
      ) : (
        <>
          {tab === "stats" && <StatsTab data={stats} days={days} />}
          {tab === "apps" && <AppsTab site={site} setSite={edit} stats={stats} />}
          {tab === "pages" && <PagesTab site={site} setSite={edit} stats={stats} />}
          {tab === "settings" && <SettingsTab site={site} setSite={edit} me={me} token={token} />}
        </>
      )}
    </div>
  );
}
