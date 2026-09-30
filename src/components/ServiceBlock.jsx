import { serviceUrl, slideUrl } from "../lib/site";
import Carousel from "./Carousel";
import Icon from "./Icon";

export default function ServiceBlock({ t, service, theme }) {
  const text = t.svc[service.id];
  const live = service.status === "live";
  // Rasm sayt mavzusiga mos: kunduzgida oq, tungida qora platforma ko'rinishi
  const slides = service.slides.map((id, i) => ({
    src: slideUrl(id, theme),
    caption: text.slides[i] || "",
  }));

  return (
    <section className="min-w-0 h-full rounded-lg border border-line bg-surface/30 backdrop-blur-md hover:border-primary/40 transition-colors p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
          <Icon name={service.icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-text truncate">{text.name}</h2>
          <div className="text-xs text-muted truncate">{service.domain}</div>
        </div>
        {live ? (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/15 text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {t.live}
          </span>
        ) : (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-hover text-muted border border-line">
            {t.comingSoon}
          </span>
        )}
      </div>

      <Carousel slides={slides} label={text.name} />

      <p className="text-sm text-muted flex-1">{text.desc}</p>

      {live ? (
        <a
          href={serviceUrl(service)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-surface/30 backdrop-blur-md border border-primary text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
        >
          {t.openService} {service.domain}
          <Icon name="external" size={14} />
        </a>
      ) : (
        <span className="flex items-center justify-center px-3 py-2 rounded-md border border-line text-muted text-xs font-semibold">
          {t.comingSoon}
        </span>
      )}
    </section>
  );
}
