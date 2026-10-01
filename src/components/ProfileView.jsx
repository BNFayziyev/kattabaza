import { useState } from "react";
import { OWNER, SERVICES, serviceUrl } from "../lib/site";
import Icon from "./Icon";

const card = "rounded-lg border border-line bg-surface/30 backdrop-blur-md";

function SectionTitle({ icon, children }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold text-text mb-3">
      <Icon name={icon} className="text-primary" />
      {children}
    </h2>
  );
}

// /profile — sayt egasining profili ("Admin va kalitlar" oynasidan alohida)
export default function ProfileView({ t }) {
  const [copied, setCopied] = useState(false);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(OWNER.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Asosiy karta */}
      <section className={`${card} p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:items-center`}>
        <img
          src={OWNER.avatar}
          alt={OWNER.name}
          className="w-24 h-24 rounded-full object-cover border-2 border-surface ring-2 ring-primary/50 shrink-0 self-center sm:self-auto"
        />
        <div className="min-w-0 flex-1 flex flex-col gap-3 text-center sm:text-left">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-text">{OWNER.name}</h1>
            <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-mono text-muted">@{OWNER.handle}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft text-primary">
                {t.profileRole}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted max-w-xl">{t.profileBio}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            <a
              href={OWNER.telegram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors"
            >
              <Icon name="send" />
              {t.writeTelegram}
            </a>
            <a
              href={`tel:${OWNER.phone}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold bg-surface/30 backdrop-blur-md border border-primary text-primary hover:bg-primary/10 transition-colors"
            >
              <Icon name="call" />
              {t.call}
            </a>
          </div>
        </div>
      </section>

      {/* Aloqa */}
      <section className={`${card} p-4`}>
        <SectionTitle icon="call">{t.contacts}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5">
            <span className="w-9 h-9 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Icon name="call" size={17} />
            </span>
            <a href={`tel:${OWNER.phone}`} className="min-w-0 flex-1">
              <div className="text-[11px] text-muted">{t.phone}</div>
              <div className="text-sm font-semibold font-mono text-text hover:text-primary transition-colors">
                {OWNER.phoneDisplay}
              </div>
            </a>
            <button
              type="button"
              onClick={copyPhone}
              title={t.copyPhone}
              aria-label={t.copyPhone}
              className="w-8 h-8 rounded-md border border-line text-muted hover:text-primary hover:border-primary/60 flex items-center justify-center transition-colors"
            >
              <Icon name={copied ? "check" : "copy"} size={15} />
            </button>
          </div>
          <a
            href={OWNER.telegram}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 hover:border-primary/40 transition-colors"
          >
            <span className="w-9 h-9 rounded-md bg-[#229ED9] text-white flex items-center justify-center shrink-0">
              <Icon name="send" size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-muted">Telegram</div>
              <div className="text-sm font-semibold font-mono text-text truncate">@{OWNER.handle}</div>
            </div>
            <Icon name="external" size={14} className="text-muted" />
          </a>
        </div>
      </section>

      {/* Ijtimoiy tarmoqlar */}
      <section className={`${card} p-4`}>
        <SectionTitle icon="globe">{t.socials}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {OWNER.socials.map((s) => (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 hover:border-primary/40 hover:bg-surface-hover/40 transition-colors"
            >
              <span className={`w-9 h-9 rounded-md ${s.color} text-white flex items-center justify-center shrink-0`}>
                <Icon name={s.icon} size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-text">{s.label}</div>
                <div className="text-[11px] font-mono text-muted truncate">@{s.handle || OWNER.handle}</div>
              </div>
              <Icon name="external" size={14} className="text-muted" />
            </a>
          ))}
        </div>
      </section>

      {/* Loyihalar */}
      <section className={`${card} p-4`}>
        <SectionTitle icon="box">{t.projects}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SERVICES.map((s) => {
            const live = s.status === "live";
            const body = (
              <>
                <span className="w-9 h-9 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Icon name={s.icon} size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text">{t.svc[s.id].name}</div>
                  <div className="text-[11px] font-mono text-muted truncate">{s.domain}</div>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                    live ? "border-success/40 text-success" : "border-line text-muted bg-surface-hover"
                  }`}
                >
                  {live ? t.live : t.soon}
                </span>
              </>
            );
            return live ? (
              <a
                key={s.id}
                href={serviceUrl(s)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 hover:border-primary/40 transition-colors"
              >
                {body}
              </a>
            ) : (
              <div key={s.id} className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 opacity-80">
                {body}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
