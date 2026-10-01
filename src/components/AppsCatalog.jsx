import Icon from "./Icon";
import MaterialsGrid from "./MaterialsGrid";
import { APP_SECTIONS, sectionOf } from "../lib/appCatalog";

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="w-9 h-9 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-text">{title}</h2>
        <div className="text-xs text-muted">{subtitle}</div>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
        active
          ? "bg-primary text-on-primary border-primary"
          : "bg-surface/30 backdrop-blur-md border-line text-text hover:bg-primary hover:text-on-primary hover:border-primary"
      }`}
    >
      {icon && <Icon name={icon} size={13} />}
      {label}
      <span className="opacity-60">{count}</span>
    </button>
  );
}

// /apps va /apps/<bo'lim>: "Hammasi" — bizning ilovalar tepada, keyin qolgan bo'limlar;
// bo'lim tanlansa — faqat o'sha bo'lim. Filtr chap menyuda, kichik ekranda esa shu yerda ham.
export default function AppsCatalog({ t, lang, materials, loading, section, emptyMessage, onSelectSection, onOpen }) {
  const groups = APP_SECTIONS.map((s) => ({
    ...s,
    items: materials.filter((m) => sectionOf(m) === s.id),
  }));
  const nonEmpty = groups.filter((g) => g.items.length > 0);
  const shown = section ? groups.filter((g) => g.id === section && g.items.length > 0) : nonEmpty;

  return (
    <div className="flex flex-col gap-6">
      <div className="lg:hidden flex flex-wrap gap-1.5">
        <FilterChip active={!section} onClick={() => onSelectSection(null)} label={t.all} count={materials.length} />
        {nonEmpty.map((g) => (
          <FilterChip
            key={g.id}
            active={section === g.id}
            onClick={() => onSelectSection(g.id)}
            icon={g.icon}
            label={t.appSections[g.id]}
            count={g.items.length}
          />
        ))}
      </div>

      {loading ? (
        <MaterialsGrid t={t} lang={lang} materials={[]} loading onOpen={onOpen} />
      ) : shown.length === 0 ? (
        <MaterialsGrid t={t} lang={lang} materials={[]} emptyMessage={emptyMessage} onOpen={onOpen} />
      ) : (
        shown.map((g) => (
          // content-visibility: ekrandan tashqaridagi bo'limlar chizilmaydi —
          // 100+ ta backdrop-blur karta telefonda ham silliq aylansin
          <section key={g.id} className="[content-visibility:auto] [contain-intrinsic-size:auto_900px]">
            <SectionHeader
              icon={g.icon}
              title={t.appSections[g.id]}
              subtitle={`${g.items.length} ${t.appsCount}`}
            />
            <MaterialsGrid t={t} lang={lang} materials={g.items} onOpen={onOpen} />
          </section>
        ))
      )}
    </div>
  );
}
