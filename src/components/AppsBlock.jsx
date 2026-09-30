import { getFileType } from "../lib/helpers";
import Icon from "./Icon";

const PREVIEW_COUNT = 6;

function AppRow({ item, onOpen }) {
  const fileType = getFileType(item);
  const title = item.title ? item.title.replace(/\.[^/.]+$/, "") : "";

  return (
    <li className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-hover/60 transition-colors">
      {item.preview_url ? (
        <img src={item.preview_url} alt="" className="w-9 h-9 rounded-md object-cover border border-line shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-md bg-primary-soft text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
          {fileType.slice(0, 4)}
        </div>
      )}
      <button
        type="button"
        onClick={() => onOpen(item.post_link)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="text-sm font-semibold text-text hover:text-primary transition-colors truncate">{title}</div>
        <div className="text-[11px] font-mono text-muted truncate">
          {fileType}
          {item.size_mb ? ` · ${item.size_mb} MB` : ""}
        </div>
      </button>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => (item.file_url ? onOpen(item.file_url) : onOpen(item.post_link))}
          aria-label={`Download ${title}`}
          title="Download"
          className="w-8 h-8 rounded-md border border-primary text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
        >
          <Icon name="download" size={15} strokeWidth={2} />
        </button>
        {item.file_url && (
          <button
            type="button"
            onClick={() => onOpen(item.post_link)}
            aria-label="Open in Telegram"
            title="Telegram"
            className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <img src="/pic/icontg128.png" className="w-4 h-4" alt="" />
          </button>
        )}
      </div>
    </li>
  );
}

// Bosh sahifadagi "Ilovalar" bloki — ro'yxatning boshidagi materiallar (jadval tartibida)
export default function AppsBlock({ t, materials, loading, popularCategories, onOpen, onViewAll, onSelectCategory }) {
  const latest = materials.slice(0, PREVIEW_COUNT);

  return (
    <section className="min-w-0 h-full rounded-lg border border-line bg-surface/30 backdrop-blur-md hover:border-primary/40 transition-colors p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
          <Icon name="box" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-text">{t.apps}</h2>
          <div className="text-xs text-muted">
            {loading ? t.loading : `${materials.length} ${t.appsCount}`}
          </div>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          {t.viewAll}
          <Icon name="arrowRight" size={14} />
        </button>
      </div>

      <div className="flex-1">
        {loading ? (
          <ul className="space-y-2" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
                <div className="w-9 h-9 rounded-md bg-surface-hover" />
                <div className="h-3 flex-1 rounded bg-surface-hover" />
              </li>
            ))}
          </ul>
        ) : latest.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm rounded-lg border border-dashed border-line">
            {t.noMaterials}
          </div>
        ) : (
          <ul className="-mx-1">
            {latest.map((item) => (
              <AppRow key={item.id} item={item} onOpen={onOpen} />
            ))}
          </ul>
        )}
      </div>

      {popularCategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-line">
          {popularCategories.slice(0, 8).map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-surface/30 backdrop-blur-md border border-line text-text hover:bg-primary hover:text-on-primary hover:border-primary transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
