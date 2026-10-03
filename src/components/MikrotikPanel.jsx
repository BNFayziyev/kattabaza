import { useEffect, useMemo, useState } from "react";
import {
  COUNTRIES,
  DEFAULT_FORM,
  FILE_NAME,
  LEASE_TIMES,
  MODELS,
  PORT_COUNTS,
  SECRET_FIELDS,
  SFP_NAMES,
  TIMEZONES,
  autoPool,
  buildConfig,
  parsePrefix,
  portsOf,
  prefixToMask,
} from "../lib/mikrotik";
import { FAQ, getMikrotikText } from "../lib/mikrotikI18n";
import Icon from "./Icon";

// Forma brauzerda eslab qolinadi (parollarsiz) — sahifani yangilasa ham yo'qolmasin
const STORE = "kb-mikrotik";

function loadForm() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORE) || "null");
    if (!saved || typeof saved !== "object") return DEFAULT_FORM;
    const form = { ...DEFAULT_FORM, ...saved };
    SECRET_FIELDS.forEach((k) => (form[k] = ""));
    return form;
  } catch {
    return DEFAULT_FORM;
  }
}

function saveForm(form) {
  try {
    const copy = { ...form };
    SECRET_FIELDS.forEach((k) => delete copy[k]);
    window.localStorage.setItem(STORE, JSON.stringify(copy));
  } catch {
    // saqlab bo'lmasa (yashirin rejim) — shunchaki eslab qolmaymiz
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ kichik qismlar

/** `kod` va **qalin** belgilarini chizadi */
function Rich({ text }) {
  const parts = String(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`") && p.length > 1) {
      return (
        <code key={i} className="px-1 py-px rounded bg-surface-hover border border-line font-mono text-[0.85em] break-all">
          {p.slice(1, -1)}
        </code>
      );
    }
    if (p.startsWith("**") && p.endsWith("**") && p.length > 3) {
      return (
        <strong key={i} className="font-semibold text-text">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

// "/ip address print" kabi bir qatorli buyruqlar menyu yo'li emas — ular shu so'zlar bilan tugaydi
const VERBS = /\s(print|once|follow|install|upgrade|reboot|flush|check-for-updates)$/;

/** RouterOS kodi: menyu yo'li — to'q sariq, izoh — kulrang */
function CodeLine({ line }) {
  const s = line.trim();
  if (s.startsWith("#")) return <span className="text-muted">{line}</span>;
  if (/^\/[a-z -]+$/.test(s) && !VERBS.test(s)) return <span className="text-primary font-semibold">{line}</span>;
  return <span>{line}</span>;
}

function CodeBlock({ code, tm }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    if (await copyToClipboard(code)) {
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    }
  };
  const lines = code.split("\n");
  return (
    <div className="relative">
      <pre className="rounded-md border border-line bg-bg py-2.5 pl-3 pr-11 text-[12px] leading-relaxed font-mono text-text overflow-x-auto scrollbar-thin">
        {lines.map((l, i) => (
          <span key={i}>
            <CodeLine line={l} />
            {i < lines.length - 1 ? "\n" : ""}
          </span>
        ))}
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={tm.copy}
        title={done ? tm.copied : tm.copy}
        className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
          done ? "bg-success/15 text-success" : "bg-surface-hover text-muted hover:text-text"
        }`}
      >
        <Icon name={done ? "check" : "copy"} size={14} />
      </button>
    </div>
  );
}

function Group({ icon, title, children, className = "" }) {
  return (
    <div className={`rounded-md border border-line bg-bg p-3 flex flex-col gap-3 min-w-0 ${className}`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        <Icon name={icon} size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <span className="text-xs text-muted truncate">
        {label}
        {hint && <span className="opacity-70"> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls = (bad, mono) =>
  `w-full min-w-0 border ${bad ? "border-danger" : "border-line"} bg-surface rounded-md px-2.5 py-1.5 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30 ${
    mono ? "font-mono" : ""
  }`;

function Segmented({ value, options, onChange }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 ${
            value === o.value ? "bg-primary text-on-primary" : "bg-surface-hover text-muted hover:text-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-start gap-2.5 text-left w-full">
      <span className={`mt-0.5 relative w-8 h-[18px] rounded-full shrink-0 transition-colors ${checked ? "bg-primary" : "bg-line"}`}>
        <span
          className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-3.5" : ""
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-text">{label}</span>
        {hint && <span className="block text-[11px] text-muted">{hint}</span>}
      </span>
    </button>
  );
}

function SecretInput({ value, onChange, bad, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="new-password"
        spellCheck="false"
        className={`${inputCls(bad, true)} pr-9`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide" : "Show"}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded flex items-center justify-center text-muted hover:text-text"
      >
        <Icon name={show ? "eyeOff" : "eye"} size={15} />
      </button>
    </span>
  );
}

// ------------------------------------------------------------------ forma

function SetupForm({ form, setForm, invalid, tm }) {
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const bind = (k) => ({ value: form[k], onChange: (e) => update(k, e.target.value) });
  const bad = (k) => invalid.has(k);
  const ports = portsOf(form);
  const v7 = form.version === "v7";

  // Portlar ro'yxati o'zgarsa WAN porti mavjud bo'lib qolsin
  const fixPorts = (f) => {
    const list = portsOf(f);
    return { ...f, wanPort: list.includes(f.wanPort) ? f.wanPort : list[0], lanExclude: f.lanExclude.filter((p) => list.includes(p)) };
  };

  const setModel = (id) => {
    const m = MODELS.find((x) => x.id === id);
    setForm((f) =>
      fixPorts({
        ...f,
        model: id,
        ...(id === "custom"
          ? {}
          : {
              ports: m.ports,
              sfp: m.sfp,
              wifi: Boolean(m.wifi),
              wifiDriver: m.wifi || f.wifiDriver,
              version: m.v7 ? "v7" : f.version,
            }),
      })
    );
  };

  const setPorts = (patch) => setForm((f) => fixPorts({ ...f, ...patch, model: "custom" }));

  const toggleLan = (p) =>
    setForm((f) => ({
      ...f,
      lanExclude: f.lanExclude.includes(p) ? f.lanExclude.filter((x) => x !== p) : [...f.lanExclude, p],
    }));

  const staticPrefix = parsePrefix(form.staticMask);
  const pool = autoPool(form.lanIp, Number(form.lanPrefix));

  const setFwd = (i, k, v) =>
    setForm((f) => ({ ...f, forwards: f.forwards.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addFwd = () =>
    setForm((f) => ({ ...f, forwards: [...f.forwards, { name: "", proto: "tcp", ext: "", ip: "", int: "" }] }));
  const delFwd = (i) => setForm((f) => ({ ...f, forwards: f.forwards.filter((_, j) => j !== i) }));

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* ---------------- Router */}
      <Group icon="router" title={tm.gRouter}>
        <div className="grid grid-cols-2 gap-2">
          <Field label={tm.model} className="col-span-2">
            <select value={form.model} onChange={(e) => setModel(e.target.value)} className={inputCls(false)}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || tm.modelCustom}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tm.ports}>
            <select value={form.ports} onChange={(e) => setPorts({ ports: Number(e.target.value) })} className={inputCls(false)}>
              {PORT_COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tm.sfp}>
            <select value={form.sfp} onChange={(e) => setPorts({ sfp: e.target.value })} className={inputCls(false, true)}>
              {SFP_NAMES.map((s) => (
                <option key={s} value={s}>
                  {s || tm.none}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">{tm.version}</span>
          <Segmented
            value={form.version}
            onChange={(v) => update("version", v)}
            options={[
              { value: "v7", label: "RouterOS v7" },
              { value: "v6", label: "RouterOS v6" },
            ]}
          />
          <span className="text-[11px] text-muted">{tm.versionHint}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label={tm.identity}>
            <input {...bind("identity")} className={inputCls(false)} spellCheck="false" />
          </Field>
          <Field label={tm.timezone}>
            <select {...bind("timezone")} className={inputCls(false)}>
              {TIMEZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Group>

      {/* ---------------- WAN */}
      <Group icon="globe" title={tm.gWan}>
        <Field label={tm.wanPort}>
          <select value={form.wanPort} onChange={(e) => update("wanPort", e.target.value)} className={inputCls(false, true)}>
            {ports.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">{tm.wanType}</span>
          <Segmented
            value={form.wanType}
            onChange={(v) => update("wanType", v)}
            options={[
              { value: "dhcp", label: tm.typeDhcp },
              { value: "static", label: tm.typeStatic },
              { value: "pppoe", label: tm.typePppoe },
            ]}
          />
        </div>

        {form.wanType === "static" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label={tm.ip}>
              <input {...bind("staticIp")} placeholder="203.0.113.10" className={inputCls(bad("staticIp"), true)} spellCheck="false" />
            </Field>
            <Field label={tm.mask} hint={staticPrefix ? `/${staticPrefix} = ${prefixToMask(staticPrefix)}` : null}>
              <input {...bind("staticMask")} placeholder="255.255.255.0" className={inputCls(bad("staticMask"), true)} spellCheck="false" />
            </Field>
            <Field label={tm.gateway} className="col-span-2">
              <input {...bind("staticGw")} placeholder="203.0.113.1" className={inputCls(bad("staticGw"), true)} spellCheck="false" />
            </Field>
          </div>
        )}

        {form.wanType === "pppoe" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label={tm.pppoeUser}>
              <input {...bind("pppoeUser")} className={inputCls(bad("pppoeUser"), true)} spellCheck="false" autoComplete="off" />
            </Field>
            <Field label={tm.pppoePass}>
              <SecretInput value={form.pppoePass} onChange={(v) => update("pppoePass", v)} bad={bad("pppoePass")} />
            </Field>
            <Field label={tm.pppoeService} hint={tm.optional}>
              <input {...bind("pppoeService")} className={inputCls(false, true)} spellCheck="false" />
            </Field>
            <Field label={tm.pppoeMtu} hint={tm.optional}>
              <input {...bind("pppoeMtu")} placeholder={tm.auto} inputMode="numeric" className={inputCls(bad("pppoeMtu"), true)} />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Field label={tm.vlan} hint={tm.optional}>
            <input {...bind("wanVlan")} placeholder="—" inputMode="numeric" className={inputCls(bad("wanVlan"), true)} />
          </Field>
          <Field label={tm.mac} hint={tm.optional}>
            <input {...bind("wanMac")} placeholder="AA:BB:CC:DD:EE:FF" className={inputCls(bad("wanMac"), true)} spellCheck="false" />
          </Field>
        </div>
        <p className="text-[11px] text-muted -mt-1.5">
          VLAN — {tm.vlanHint}; MAC — {tm.macHint}.
        </p>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">{tm.dnsMode}</span>
          <Segmented
            value={form.wanType === "static" ? "custom" : form.dnsMode}
            onChange={(v) => update("dnsMode", v)}
            options={[
              { value: "isp", label: tm.dnsIsp, disabled: form.wanType === "static" },
              { value: "custom", label: tm.dnsCustom },
            ]}
          />
        </div>
        {(form.dnsMode === "custom" || form.wanType === "static") && (
          <Field label={tm.dnsServers}>
            <input {...bind("dnsServers")} placeholder="1.1.1.1, 8.8.8.8" className={inputCls(bad("dnsServers"), true)} spellCheck="false" />
          </Field>
        )}
      </Group>

      {/* ---------------- LAN */}
      <Group icon="network" title={tm.gLan}>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">{tm.lanPorts}</span>
          <div className="flex gap-1 flex-wrap">
            {ports
              .filter((p) => p !== form.wanPort)
              .map((p) => {
                const on = !form.lanExclude.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleLan(p)}
                    aria-pressed={on}
                    className={`px-2 py-1 rounded-md text-xs font-mono transition-colors inline-flex items-center gap-1 border ${
                      on ? "bg-primary-soft text-primary border-primary/30" : "bg-surface-hover text-muted border-transparent line-through"
                    }`}
                  >
                    {on && <Icon name="check" size={12} strokeWidth={2.4} />}
                    {p}
                  </button>
                );
              })}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1.3fr] gap-2">
          <Field label={tm.lanIp}>
            <input {...bind("lanIp")} placeholder="192.168.88.1" className={inputCls(bad("lanIp"), true)} spellCheck="false" />
          </Field>
          <Field label={tm.lanPrefix}>
            <select value={form.lanPrefix} onChange={(e) => update("lanPrefix", Number(e.target.value))} className={inputCls(false, true)}>
              {Array.from({ length: 15 }, (_, i) => 16 + i).map((p) => (
                <option key={p} value={p}>
                  /{p} · {prefixToMask(p)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Toggle checked={form.dhcpServer} onChange={(v) => update("dhcpServer", v)} label={tm.dhcpServer} />
        {form.dhcpServer && (
          <div className="grid grid-cols-2 gap-2">
            <Field label={tm.poolStart}>
              <input {...bind("poolStart")} placeholder={pool.start} className={inputCls(bad("poolStart"), true)} spellCheck="false" />
            </Field>
            <Field label={tm.poolEnd}>
              <input {...bind("poolEnd")} placeholder={pool.end} className={inputCls(bad("poolEnd"), true)} spellCheck="false" />
            </Field>
            <Field label={tm.leaseTime}>
              <select {...bind("leaseTime")} className={inputCls(false, true)}>
                {LEASE_TIMES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      </Group>

      {/* ---------------- Wi-Fi */}
      <Group icon="wifi" title={tm.gWifi}>
        <Toggle checked={form.wifi} onChange={(v) => update("wifi", v)} label={tm.wifiOn} />
        {form.wifi && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted">{tm.wifiDriver}</span>
              <Segmented
                value={v7 ? form.wifiDriver : "wireless"}
                onChange={(v) => update("wifiDriver", v)}
                options={[
                  { value: "wireless", label: tm.driverWireless },
                  { value: "wifi", label: tm.driverWifi, disabled: !v7 },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={tm.ssid}>
                <input {...bind("ssid")} className={inputCls(bad("ssid"))} spellCheck="false" />
              </Field>
              <Field label={tm.wifiPass}>
                <SecretInput value={form.wifiPass} onChange={(v) => update("wifiPass", v)} bad={bad("wifiPass")} placeholder="8+" />
              </Field>
              <Field label={tm.country}>
                <select {...bind("country")} className={inputCls(false)}>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c ? c[0].toUpperCase() + c.slice(1) : tm.countryDefault}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </>
        )}
      </Group>

      {/* ---------------- Xavfsizlik */}
      <Group icon="shield" title={tm.gSecurity}>
        <Toggle checked={form.firewall} onChange={(v) => update("firewall", v)} label={tm.firewall} hint={tm.firewallHint} />
        <Toggle checked={form.harden} onChange={(v) => update("harden", v)} label={tm.harden} hint={tm.hardenHint} />
        <div className="grid grid-cols-2 gap-2">
          <Field label={tm.adminUser} hint={tm.adminUserHint}>
            <input {...bind("adminUser")} className={inputCls(bad("adminUser"), true)} spellCheck="false" autoComplete="off" />
          </Field>
          <Field label={tm.adminPass}>
            <SecretInput value={form.adminPass} onChange={(v) => update("adminPass", v)} bad={bad("adminPass")} />
          </Field>
        </div>
        <Toggle checked={form.wanWinbox} onChange={(v) => update("wanWinbox", v)} label={tm.wanWinbox} hint={tm.wanWinboxHint} />
        {form.wanWinbox && (
          <Field label={tm.wanWinboxFrom}>
            <input {...bind("wanWinboxFrom")} placeholder="198.51.100.7, 203.0.113.25" className={inputCls(bad("wanWinboxFrom"), true)} spellCheck="false" />
          </Field>
        )}
      </Group>

      {/* ---------------- Qo'shimcha */}
      <Group icon="sliders" title={tm.gExtras}>
        <Toggle checked={form.queue} onChange={(v) => update("queue", v)} label={tm.queue} />
        {form.queue && (
          <div className="grid grid-cols-2 gap-2">
            <Field label={tm.queueDown} hint={tm.mbps}>
              <input {...bind("queueDown")} inputMode="decimal" className={inputCls(bad("queueDown"), true)} />
            </Field>
            <Field label={tm.queueUp} hint={tm.mbps}>
              <input {...bind("queueUp")} inputMode="decimal" className={inputCls(bad("queueUp"), true)} />
            </Field>
          </div>
        )}
        <Toggle checked={form.ddns} onChange={(v) => update("ddns", v)} label={tm.ddns} />
        <Toggle checked={form.ntp} onChange={(v) => update("ntp", v)} label={tm.ntp} />
        <Toggle checked={form.backup} onChange={(v) => update("backup", v)} label={tm.backup} />
      </Group>

      {/* ---------------- Port ochish */}
      <Group icon="link" title={tm.gForwards} className="md:col-span-2">
        {form.forwards.length === 0 && <p className="text-xs text-muted">{tm.fwdEmpty}</p>}
        {form.forwards.map((r, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-[1.2fr_0.9fr_0.8fr_1.3fr_0.8fr_auto] gap-2 items-end">
            <Field label={tm.fwdName}>
              <input value={r.name} onChange={(e) => setFwd(i, "name", e.target.value)} placeholder="camera" className={inputCls(false)} />
            </Field>
            <Field label={tm.fwdProto}>
              <select value={r.proto} onChange={(e) => setFwd(i, "proto", e.target.value)} className={inputCls(false, true)}>
                <option value="tcp">tcp</option>
                <option value="udp">udp</option>
                <option value="both">tcp+udp</option>
              </select>
            </Field>
            <Field label={tm.fwdExt}>
              <input value={r.ext} onChange={(e) => setFwd(i, "ext", e.target.value)} placeholder="8080" inputMode="numeric" className={inputCls(bad(`fwd${i}`), true)} />
            </Field>
            <Field label={tm.fwdIp}>
              <input value={r.ip} onChange={(e) => setFwd(i, "ip", e.target.value)} placeholder="192.168.88.20" className={inputCls(bad(`fwd${i}`), true)} spellCheck="false" />
            </Field>
            <Field label={tm.fwdInt}>
              <input value={r.int} onChange={(e) => setFwd(i, "int", e.target.value)} placeholder={r.ext || "80"} inputMode="numeric" className={inputCls(bad(`fwd${i}`), true)} />
            </Field>
            <button
              type="button"
              onClick={() => delFwd(i)}
              aria-label={tm.remove}
              title={tm.remove}
              className="h-[34px] w-[34px] rounded-md flex items-center justify-center bg-surface-hover text-muted hover:text-danger transition-colors justify-self-end"
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addFwd}
          className="self-start px-3 py-1.5 rounded-md text-xs font-semibold bg-surface-hover text-text hover:bg-line/60 transition-colors inline-flex items-center gap-1.5"
        >
          <Icon name="plus" size={14} />
          {tm.fwdAdd}
        </button>
      </Group>
    </div>
  );
}

// ------------------------------------------------------------------ natija

function Output({ result, tm }) {
  const [view, setView] = useState("terminal");
  const [copiedAll, setCopiedAll] = useState(false);
  const { sections, warnings, script } = result;

  const copyAll = async () => {
    if (await copyToClipboard(script)) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1400);
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([script], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = FILE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const errors = warnings.filter((w) => w.level === "error");
  const notes = warnings.filter((w) => w.level !== "error");
  let n = 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h3 className="text-base font-bold text-text">{tm.outTitle}</h3>
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={copyAll}
            className="px-3 py-1.5 rounded-md text-sm font-semibold bg-surface-hover text-text hover:bg-line/60 transition-colors inline-flex items-center gap-1.5"
          >
            <Icon name={copiedAll ? "check" : "copy"} size={15} />
            {copiedAll ? tm.copied : tm.copyAll}
          </button>
          <button
            type="button"
            onClick={download}
            className="px-3 py-1.5 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors inline-flex items-center gap-1.5"
          >
            <Icon name="download" size={15} />
            {tm.download}
          </button>
        </div>
      </div>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: "terminal", label: tm.viewTerminal },
          { value: "winbox", label: tm.viewWinbox },
        ]}
      />

      {(errors.length > 0 || notes.length > 0) && (
        <div className="flex flex-col gap-2">
          {errors.length > 0 && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 p-3">
              <div className="text-sm font-bold text-danger mb-1">{tm.warnTitle}</div>
              <ul className="space-y-1">
                {errors.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text">
                    <Icon name="x" size={15} strokeWidth={2.2} className="mt-0.5 text-danger" />
                    {w.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {notes.length > 0 && (
            <ul className="rounded-lg border border-primary/40 bg-primary-soft p-3 space-y-1">
              {notes.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text">
                  <Icon name="alert" size={15} strokeWidth={2.2} className="mt-0.5 text-primary" />
                  {w.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ol className="flex flex-col gap-5">
        {sections.map((s) => {
          const num = s.script ? ++n : null;
          // Tayyorgarlik va tekshirish — har ikki ko'rinishda ham qadamlar + buyruqlar
          const showSteps = !s.script || view === "winbox";
          const showCode = !s.script || view === "terminal";
          return (
            <li key={s.id} className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    s.script ? "bg-primary-soft text-primary" : "bg-surface-hover text-muted"
                  }`}
                >
                  {num ?? <Icon name={s.id === "check" ? "check" : "info"} size={14} strokeWidth={2.2} />}
                </span>
                <h4 className="text-sm font-bold text-text">{tm.sec[s.id]}</h4>
                {!s.script && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-hover border border-line text-muted">
                    {tm.notInFile}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted -mt-1 pl-8">{tm.secDesc[s.id]}</p>
              <div className="pl-8 flex flex-col gap-2 min-w-0">
                {showSteps && (
                  <ol className="list-decimal pl-5 space-y-1 text-sm text-text marker:text-muted">
                    {s.steps.map((st, i) => (
                      <li key={i} className="pl-0.5 break-words">
                        <Rich text={st} />
                      </li>
                    ))}
                  </ol>
                )}
                {showCode && <CodeBlock code={s.code} tm={tm} />}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ------------------------------------------------------------------ savol-javob

function Faq({ tm }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ.map((f) => ({ ...f, ...tm.faq[f.id] })).filter(
      (f) => !q || [f.q, f.a, f.n, f.code].filter(Boolean).some((x) => x.toLowerCase().includes(q))
    );
  }, [query, tm]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tm.faqSearch}
          className="w-full border border-line bg-bg rounded-md pl-9 pr-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {items.length === 0 && <p className="text-sm text-muted">{tm.faqEmpty}</p>}
      <div className="flex flex-col gap-1.5">
        {items.map((f) => {
          const isOpen = open === f.id || Boolean(query.trim() && items.length <= 3);
          return (
            <div key={f.id} className="rounded-md border border-line bg-bg">
              <button
                type="button"
                onClick={() => setOpen(open === f.id ? null : f.id)}
                aria-expanded={isOpen}
                className="w-full px-3 py-2.5 flex items-center gap-2.5 text-left"
              >
                <Icon name="help" size={16} className="text-primary" />
                <span className="flex-1 text-sm font-semibold text-text">{f.q}</span>
                <Icon name="chevronDown" size={15} className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pl-9 flex flex-col gap-2 animate-fade-in-up">
                  <p className="text-sm text-text leading-relaxed">
                    <Rich text={f.a} />
                  </p>
                  {f.code && <CodeBlock code={f.code} tm={tm} />}
                  {f.n && (
                    <p className="text-xs text-muted leading-relaxed">
                      <Rich text={f.n} />
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ sahifa

export default function MikrotikPanel({ lang = "en", tab = "setup", onTab }) {
  const tm = getMikrotikText(lang);
  const [form, setForm] = useState(loadForm);

  useEffect(() => saveForm(form), [form]);

  const result = useMemo(() => buildConfig(form, tm), [form, tm]);

  const tabs = [
    { key: "setup", icon: "terminal", label: tm.tabSetup },
    { key: "faq", icon: "help", label: `${tm.tabFaq} · ${FAQ.length}` },
  ];

  return (
    <>
      <section className="rounded-lg border border-line bg-surface/30 backdrop-blur-md p-4 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Icon name="router" size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-text">{tm.title}</h2>
            <p className="text-xs text-muted mt-0.5">{tm.subtitle}</p>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap items-center">
          {tabs.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => onTab?.(x.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${
                tab === x.key ? "bg-primary text-on-primary" : "bg-surface-hover text-muted hover:text-text"
              }`}
            >
              <Icon name={x.icon} size={15} />
              {x.label}
            </button>
          ))}
          {tab === "setup" && (
            <button
              type="button"
              onClick={() => setForm(DEFAULT_FORM)}
              className="ml-auto px-2.5 py-1.5 rounded-md text-xs font-semibold text-muted hover:text-text hover:bg-surface-hover transition-colors inline-flex items-center gap-1.5"
            >
              <Icon name="refresh" size={14} />
              {tm.resetForm}
            </button>
          )}
        </div>

        {tab === "setup" ? (
          <>
            <SetupForm form={form} setForm={setForm} invalid={result.invalid} tm={tm} />
            <p className="text-[11px] text-muted flex items-start gap-1.5">
              <Icon name="info" size={13} className="mt-px" />
              {tm.secretNote}
            </p>
          </>
        ) : (
          <Faq tm={tm} />
        )}
      </section>

      {tab === "setup" && (
        <section className="rounded-lg border border-line bg-surface/30 backdrop-blur-md p-4">
          <Output result={result} tm={tm} />
        </section>
      )}
    </>
  );
}
