import { useCallback, useEffect, useState } from "react";

const card = "rounded-lg border border-line bg-surface/30 backdrop-blur-md p-4";
const RANGES = [1, 7, 30, 90];
const tokenKey = "kb-admin-token";

const fmt = (n) => Number(n || 0).toLocaleString("ru-RU");
const time = (t) =>
  new Date(t).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

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

function Chart({ series }) {
  const max = Math.max(1, ...series.map((s) => s.views));
  return (
    <div className={card}>
      <h3 className="text-sm font-bold text-text mb-3">
        Kunlar bo'yicha <span className="font-normal text-muted text-xs">· ustun — ko'rishlar, nuqta — tashrifchilar</span>
      </h3>
      <div className="flex items-end gap-px h-36">
        {series.map((s) => (
          <div key={s.date} className="flex-1 min-w-0 h-full flex flex-col justify-end group relative" title={`${s.date}: ${s.views} ko'rish, ${s.visitors} tashrifchi`}>
            <div className="w-full rounded-t bg-primary/70 group-hover:bg-primary" style={{ height: `${(s.views / max) * 100}%`, minHeight: s.views ? 2 : 0 }} />
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
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Parol"
        className="px-3 py-2 rounded-md border border-line bg-transparent text-sm text-text outline-none focus:border-primary"
      />
      {error && <div className="text-xs text-red-500">{error}</div>}
      <button className="px-3.5 py-2 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors">
        Kirish
      </button>
    </form>
  );
}

export default function AdminPanel() {
  const [token, setToken] = useState(() => {
    try {
      return window.sessionStorage.getItem(tokenKey) || "";
    } catch {
      return "";
    }
  });
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const saveToken = (v) => {
    setToken(v);
    try {
      v ? window.sessionStorage.setItem(tokenKey, v) : window.sessionStorage.removeItem(tokenKey);
    } catch {}
  };

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/stats?days=${days}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) return saveToken("");
      setData(await res.json());
      setError("");
    } catch {
      setError("Yuklab bo'lmadi");
    }
  }, [token, days]);

  useEffect(() => {
    load();
    if (!token) return;
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [load, token]);

  if (!token) return <Login onToken={saveToken} />;

  const totals = data?.totals;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold tracking-tight text-text">Admin panel</h1>
        <div className="flex items-center gap-2">
          {RANGES.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                days === d ? "bg-primary text-on-primary border-primary" : "border-line text-muted hover:text-primary"
              }`}
            >
              {d === 1 ? "Bugun" : `${d} kun`}
            </button>
          ))}
          <button onClick={() => saveToken("")} className="px-2.5 py-1 rounded-md text-xs border border-line text-muted hover:text-primary">
            Chiqish
          </button>
        </div>
      </div>
      {error && <div className="text-xs text-red-500">{error}</div>}
      {!data ? (
        <div className="text-sm text-muted">Yuklanmoqda…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Hozir saytda" value={totals.online} hint="so'nggi 5 daqiqa" accent />
            <Stat label="Bugun" value={totals.visitorsToday} hint={`${fmt(totals.viewsToday)} ko'rish`} />
            <Stat label={`${days} kun: tashrifchi`} value={totals.visitors} />
            <Stat label={`${days} kun: ko'rish`} value={totals.views} hint={`jami: ${fmt(totals.allTime)}`} />
          </div>

          <Chart series={data.series} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Bars title="Mashhur sahifalar" rows={data.pages} />
            <Bars title="Davlatlar" rows={data.countries} />
            <Bars title="Qurilma" rows={data.devices} />
            <Bars title="Brauzer" rows={data.browsers} />
            <Bars title="Tizim" rows={data.systems} />
            <Bars title="Qayerdan kelgan" rows={data.referrers} />
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
      )}
    </div>
  );
}
