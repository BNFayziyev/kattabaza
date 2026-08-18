import { useState } from "react";
import {
  analyzeUrlDeep,
  checkDomain,
  checkEmailDns,
  checkEmailSyntax,
} from "../lib/checker";
import { getCheckerText, renderNote } from "../lib/checkerI18n";

const LEVEL_STYLE = {
  good: "text-success",
  info: "text-muted",
  warn: "text-primary",
  error: "text-danger",
};
const LEVEL_ICON = { good: "✓", info: "·", warn: "!", error: "✕" };

function Note({ note, tc }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className={`font-bold shrink-0 w-4 text-center ${LEVEL_STYLE[note.level] || "text-muted"}`}>
        {LEVEL_ICON[note.level] || "·"}
      </span>
      <span className="text-text break-words">{renderNote(note, tc)}</span>
    </li>
  );
}

function Records({ title, items, tc }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-md border border-line bg-bg p-2.5">
      <div className="text-[11px] uppercase tracking-wide text-muted mb-1">{title}</div>
      <ul className="space-y-0.5">
        {items.slice(0, 6).map((v, i) => (
          <li key={i} className="text-xs font-mono text-text break-all">{v}</li>
        ))}
        {items.length > 6 && <li className="text-xs text-muted">{tc.rec.more(items.length - 6)}</li>}
      </ul>
    </div>
  );
}

/** Label + value row used across the deep sections */
function Row({ label, value, mono = true, danger = false }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-2 text-xs py-0.5">
      <span className="text-muted shrink-0 w-32">{label}</span>
      <span className={`${mono ? "font-mono" : ""} break-all ${danger ? "text-danger font-semibold" : "text-text"}`}>
        {value}
      </span>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-md border border-line bg-bg p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted mb-1.5">{title}</div>
      {children}
    </div>
  );
}

const TONES = {
  ok: "border-success/40 bg-success/10 text-success",
  warn: "border-primary/40 bg-primary-soft text-primary",
  bad: "border-danger/40 bg-danger/10 text-danger",
};

function Verdict({ tone, title, subtitle }) {
  return (
    <div className={`rounded-lg border p-3 ${TONES[tone] || TONES.warn}`}>
      <div className="text-sm font-bold">{title}</div>
      {subtitle && <div className="text-xs mt-0.5 opacity-80">{subtitle}</div>}
    </div>
  );
}

const VERDICT_TONE = {
  clean: "ok", minor: "ok", suspicious: "warn", dangerous: "bad", unknown: "bad",
};

const fmtDate = (iso) => {
  if (!iso) return null;
  try { return new Date(iso).toISOString().slice(0, 10); } catch { return iso; }
};

export default function CheckerPanel({ lang = "en" }) {
  const tc = getCheckerText(lang);
  // Link is the primary tool -> first tab and the default
  const [tab, setTab] = useState("url");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const tabs = [
    { key: "url", icon: "🔗", label: tc.tabUrl, ph: tc.phUrl },
    { key: "email", icon: "✉️", label: tc.tabEmail, ph: tc.phEmail },
    { key: "domain", icon: "🌐", label: tc.tabDomain, ph: tc.phDomain },
  ];
  const active = tabs.find((x) => x.key === tab);

  const switchTab = (key) => { setTab(key); setResult(null); setValue(""); };

  const run = async (e) => {
    e?.preventDefault();
    const input = value.trim();
    if (!input || busy) return;
    setBusy(true);
    setResult(null);
    try {
      if (tab === "url") {
        setResult({ type: "url", data: await analyzeUrlDeep(input) });
      } else if (tab === "email") {
        const syntax = checkEmailSyntax(input);
        const dns = syntax.domain ? await checkEmailDns(syntax.domain) : null;
        setResult({ type: "email", syntax, dns });
      } else {
        setResult({ type: "domain", data: await checkDomain(input) });
      }
    } finally {
      setBusy(false);
    }
  };

  const r = result?.type === "url" ? result.data : null;
  const d = r?.deep;

  return (
    <section className="rounded-lg border border-line bg-surface/30 backdrop-blur-md p-4 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-text">{tc.title}</h2>
        <p className="text-xs text-muted mt-0.5">{tc.subtitle}</p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => switchTab(x.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              tab === x.key ? "bg-primary text-on-primary" : "bg-surface-hover text-muted hover:text-text"
            }`}
          >
            <span className="mr-1.5" aria-hidden="true">{x.icon}</span>
            {x.label}
          </button>
        ))}
      </div>

      <form onSubmit={run} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={active.ph}
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          className="flex-1 min-w-0 border border-line bg-bg rounded-md px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50 shrink-0"
        >
          {busy ? "…" : tc.check}
        </button>
      </form>

      {busy && tab === "url" && (
        <div className="text-xs text-muted animate-pulse">{tc.deep.deepRunning}</div>
      )}

      {/* ================= LINK (deep) ================= */}
      {r && (
        <div className="flex flex-col gap-3">
          {!r.valid ? (
            <Verdict tone="bad" title={tc.verdict.unknown} />
          ) : (
            <>
              <Verdict
                tone={VERDICT_TONE[r.verdict]}
                title={tc.verdict[r.verdict]}
                subtitle={`${tc.riskScore}: ${r.risk} / 100 · ${r.host}`}
              />

              <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    r.risk >= 60 ? "bg-danger" : r.risk >= 30 ? "bg-primary" : "bg-success"
                  }`}
                  style={{ width: `${Math.max(3, r.risk)}%` }}
                />
              </div>

              <ul className="space-y-1.5">
                {r.notes.map((n, i) => <Note key={i} note={n} tc={tc} />)}
              </ul>

              {d && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {/* --- Address breakdown --- */}
                  <Panel title={tc.deep.anatomy}>
                    <Row label={tc.deep.scheme} value={d.anatomy.scheme} />
                    <Row label={tc.deep.subdomain} value={d.anatomy.subdomain} />
                    <Row label={tc.deep.registrable} value={d.anatomy.registrable} danger={Boolean(r.impersonation)} />
                    <Row label={tc.deep.tld} value={`.${d.anatomy.tld}`} />
                    <Row label={tc.deep.port} value={d.anatomy.port} />
                    <Row label={tc.deep.path} value={d.anatomy.path} />
                    <Row label={tc.deep.fragment} value={d.anatomy.fragment} />
                  </Panel>

                  {/* --- Registration / age --- */}
                  <Panel title={tc.deep.whois}>
                    {d.rdap?.found ? (
                      <>
                        <Row label={tc.deep.created} value={fmtDate(d.rdap.created)} />
                        <Row
                          label={tc.deep.age}
                          value={d.rdap.ageDays != null ? tc.deep.days(d.rdap.ageDays) : null}
                          danger={d.rdap.ageDays != null && d.rdap.ageDays < 90}
                        />
                        <Row label={tc.deep.expires} value={fmtDate(d.rdap.expires)} />
                        <Row label={tc.deep.updated} value={fmtDate(d.rdap.updated)} />
                        <Row label={tc.deep.registrar} value={d.rdap.registrar} mono={false} />
                        <Row label={tc.deep.status} value={(d.rdap.statuses || []).slice(0, 3).join(", ")} mono={false} />
                      </>
                    ) : (
                      <div className="text-xs text-muted">{tc.deep.noData}</div>
                    )}
                  </Panel>

                  {/* --- Hosting --- */}
                  <Panel title={tc.deep.hosting}>
                    {d.dns.A.map((ip, i) => <Row key={i} label="IP" value={ip} />)}
                    {d.hosting.map((h, i) => <Row key={i} label="PTR" value={h} />)}
                    {d.dns.A.length === 0 && d.hosting.length === 0 && (
                      <div className="text-xs text-muted">{tc.deep.noData}</div>
                    )}
                  </Panel>

                  {/* --- DNS --- */}
                  <Panel title={tc.deep.dnsRecords}>
                    <Row label={tc.deep.cname} value={d.dns.CNAME.join(", ")} />
                    <Row label="NS" value={d.dns.NS.slice(0, 3).join(", ")} />
                    <Row label="MX" value={d.dns.MX.slice(0, 2).join(", ")} />
                    <Row label={tc.deep.caa} value={d.dns.CAA.slice(0, 2).join(", ")} />
                    <Row label="DNSSEC" value={d.dns.dnssec ? tc.deep.dnssecOn : tc.deep.dnssecOff} mono={false} />
                  </Panel>

                  {/* --- Query params --- */}
                  {d.anatomy.params.length > 0 && (
                    <Panel title={tc.deep.params}>
                      {d.anatomy.params.map((p, i) => (
                        <Row key={i} label={p.key} value={p.value} />
                      ))}
                    </Panel>
                  )}

                  {/* --- Embedded links --- */}
                  {d.redirects.length > 0 && (
                    <Panel title={tc.deep.redirects}>
                      {d.redirects.map((x, i) => (
                        <Row
                          key={i}
                          label={x.param}
                          value={`${x.host} (${x.risk}/100)`}
                          danger={x.risk >= 30}
                        />
                      ))}
                    </Panel>
                  )}
                </div>
              )}

              <p className="text-[11px] text-muted leading-relaxed">{tc.urlFooter}</p>
            </>
          )}
        </div>
      )}

      {/* ================= EMAIL ================= */}
      {result?.type === "email" && (
        <div className="flex flex-col gap-3">
          <Verdict
            tone={result.syntax.ok && result.dns?.reachable ? "ok" : result.syntax.ok ? "warn" : "bad"}
            title={
              !result.syntax.ok ? tc.emailFormatBad
                : result.dns?.reachable ? tc.emailValid
                : result.dns?.reachable === false ? tc.emailNoMail
                : tc.emailNoDns
            }
            subtitle={
              result.dns?.reachable ? tc.emailFoundVia(result.dns.via)
                : result.dns?.code ? renderNote({ code: result.dns.code }, tc) : null
            }
          />
          {result.syntax.notes.length > 0 && (
            <ul className="space-y-1.5">
              {result.syntax.notes.map((n, i) => <Note key={i} note={n} tc={tc} />)}
            </ul>
          )}
          <Records title={tc.rec.mx} items={result.dns?.records} tc={tc} />
          <p className="text-[11px] text-muted leading-relaxed">{tc.emailFooter}</p>
        </div>
      )}

      {/* ================= DOMAIN ================= */}
      {result?.type === "domain" && (
        <div className="flex flex-col gap-3">
          {!result.data.valid ? (
            <Verdict tone="bad" title={tc.domainInvalid} />
          ) : (
            <>
              <Verdict
                tone={result.data.impersonation ? "bad" : result.data.registered ? "ok" : "warn"}
                title={result.data.registered ? tc.domainActive : tc.domainEmpty}
                subtitle={result.data.domain}
              />
              {result.data.notes.length > 0 && (
                <ul className="space-y-1.5">
                  {result.data.notes.map((n, i) => <Note key={i} note={n} tc={tc} />)}
                </ul>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <Records title={tc.rec.a} items={result.data.records.A} tc={tc} />
                <Records title={tc.rec.aaaa} items={result.data.records.AAAA} tc={tc} />
                <Records title={tc.rec.mx} items={result.data.records.MX} tc={tc} />
                <Records title={tc.rec.ns} items={result.data.records.NS} tc={tc} />
              </div>
              {(result.data.spf || result.data.dmarc) && (
                <div className="rounded-md border border-line bg-bg p-2.5 space-y-1">
                  {result.data.spf && (
                    <div className="text-xs font-mono text-text break-all">
                      <span className="text-muted">SPF: </span>{result.data.spf}
                    </div>
                  )}
                  {result.data.dmarc && (
                    <div className="text-xs font-mono text-text break-all">
                      <span className="text-muted">DMARC: </span>{result.data.dmarc}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
