import { useState } from "react";
import { countryFlagUrl } from "../lib/helpers";

function localTime(tz) {
  if (!tz) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: tz, dateStyle: "medium", timeStyle: "short" }).format(new Date());
  } catch {
    return "";
  }
}

function rowsOf(t, d) {
  const tz = d.timezone || {};
  const c = d.connection || {};
  const coords =
    Number.isFinite(d.latitude) && Number.isFinite(d.longitude) ? `${d.latitude}, ${d.longitude}` : "";
  return [
    [t.fIp, d.ip],
    [t.fType, d.type],
    [t.fResolved, d.resolvedFrom && `${d.resolvedFrom} → ${(d.addresses || []).join(", ")}`],
    [t.fHostname, (d.hostnames || []).join(", ")],
    [t.fCity, d.city],
    [t.fRegion, d.region],
    [t.fCountry, [d.country, d.countryCode].filter(Boolean).join(" · ")],
    [t.fContinent, d.continent || d.continentCode],
    [t.fPostal, d.postal],
    [t.fCoords, coords],
    [t.fTimezone, tz.id && `${tz.id}${tz.utc ? ` (UTC${tz.utc})` : ""}`],
    [t.fLocalTime, localTime(tz.id)],
    [t.fIsp, c.isp],
    [t.fOrg, c.org !== c.isp ? c.org : ""],
    [t.fAsn, c.asn && `AS${c.asn}`],
    [t.fDomain, c.domain],
    [t.fCapital, d.capital],
    [t.fCalling, d.callingCode && `+${d.callingCode}`],
    [t.fEu, typeof d.isEu === "boolean" ? (d.isEu ? t.yes : t.no) : ""],
    [t.fBorders, d.borders && String(d.borders).replaceAll(",", ", ")],
    [t.fCurrency, d.currency],
  ].filter(([, v]) => v !== undefined && v !== null && v !== "");
}

/**
 * Istalgan IP yoki domen bo'yicha to'liq ma'lumot (server: GET /api/ip?q=).
 * Topilgan joy orqa fondagi xaritada ko'rsatiladi (onLocate), yopilganda
 * xarita foydalanuvchining o'z joylashuviga qaytadi.
 */
export default function IpLookup({ t, onLocate }) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const close = () => {
    setData(null);
    onLocate(null);
  };

  const run = async (value) => {
    const q = value.trim();
    if (!q || busy) return;
    setQuery(q);
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/ip?q=${encodeURIComponent(q)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const key = { 400: "lookupInvalid", 404: "lookupNotFound", 429: "lookupRateLimited" }[res.status] || "lookupFailed";
        setError(t[key]);
        close();
        return;
      }
      setData(body);
      if (Number.isFinite(body.latitude) && Number.isFinite(body.longitude)) {
        onLocate({ latitude: body.latitude, longitude: body.longitude, label: `${body.ip} · ${body.city || body.country || ""}` });
      } else {
        onLocate(null);
      }
    } catch {
      setError(t.lookupFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full sm:max-w-2xl flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className="flex items-center gap-2 bg-surface border border-line rounded-md pl-4 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/30 transition-shadow"
      >
        <span className="text-muted" aria-hidden="true">🌐</span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError("");
          }}
          placeholder={t.lookupPlaceholder}
          aria-label={t.lookupTitle}
          autoComplete="off"
          spellCheck="false"
          className="w-full outline-none bg-transparent text-sm text-text placeholder:text-muted font-mono"
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          className="shrink-0 px-3 py-1.5 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {busy ? "…" : t.lookupButton}
        </button>
      </form>

      {error && <p className="text-xs text-danger -mt-1 px-1">{error}</p>}

      {data && (
        <div className="rounded-lg border border-line bg-surface/30 backdrop-blur-md shadow-popover overflow-hidden animate-fade-in-up">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
            {data.countryCode && (
              <img src={countryFlagUrl(data.countryCode)} alt="" className="w-8 h-6 rounded-sm object-cover border border-line shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-text font-mono truncate">{data.ip}</div>
              <div className="text-xs text-muted truncate">
                {data.reserved ? t.lookupReserved : [data.city, data.region, data.country].filter(Boolean).join(", ")}
              </div>
            </div>
            <button type="button" className="text-sm text-muted px-2 py-1 rounded-md hover:bg-surface-hover" onClick={close}>
              {t.close}
            </button>
          </div>
          {!data.reserved && (
            <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
              {rowsOf(t, data).map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 py-2 border-b border-line">
                  <span className="text-sm text-muted whitespace-nowrap">{label}</span>
                  <span className="text-sm font-mono text-text text-right break-all">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
