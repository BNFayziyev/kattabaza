import ServiceBlock from "./ServiceBlock";
import Icon from "./Icon";

// kattabaza.uz/time, /treyler, /med — servis haqida sahifa.
// Google shu sahifalarni KattaBaza bo'limi sifatida ko'rsatadi.
export default function ServicePage({ t, service, theme }) {
  const text = t.svc[service.id];
  const live = service.status === "live";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-start">
      <ServiceBlock t={t} service={service} theme={theme} as="h1" />

      {live && text.slides.length > 0 && (
        <section className="rounded-lg border border-line bg-surface/30 backdrop-blur-md p-4">
          <h2 className="text-sm font-bold text-text mb-3">{t.features}</h2>
          <ul className="flex flex-col gap-2.5">
            {text.slides.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm text-muted">
                <span className="mt-0.5 text-primary shrink-0">
                  <Icon name="check" size={16} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
