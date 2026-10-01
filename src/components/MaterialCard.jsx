import { useState } from "react";
import { displayTitle, getFileType, telegramLink } from "../lib/helpers";

export default function MaterialCard({ t, lang, item, onOpen }) {
  // Qo'shimcha katalogdagi dasturlarda bir nechta versiya bo'ladi (til, bit, yil)
  const versions = item.versions || [];
  const [picked, setPicked] = useState(0);
  const current = versions[picked];

  const fileType = current?.type || getFileType(item);
  const title = displayTitle(item);
  const description = item.descriptions?.[lang] || item.description;
  const size = current ? current.size : item.size_mb ? `${item.size_mb} MB` : "";
  const downloadUrl = current?.url || item.file_url || item.post_link;
  const tgLink = telegramLink(item);

  return (
    <div className="rounded-lg border border-line bg-surface/30 backdrop-blur-md hover:border-primary/40 transition-colors p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {item.preview_url ? (
          <img
            src={item.preview_url}
            alt=""
            className="w-11 h-11 rounded-md object-cover border border-line shrink-0"
          />
        ) : (
          <div className="w-11 h-11 rounded-md bg-primary-soft text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
            {fileType.slice(0, 4)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpen(item.post_link || downloadUrl)}
            className="text-sm font-semibold text-text hover:text-primary transition-colors text-left break-words"
          >
            {title}
          </button>
          {description && (
            <p className="text-xs text-muted line-clamp-2 mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {versions.length > 1 && (
        <div className="flex flex-wrap gap-1" role="group" aria-label={t.versions}>
          {versions.map((v, i) => (
            <button
              type="button"
              key={v.label}
              onClick={() => setPicked(i)}
              aria-pressed={i === picked}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors ${
                i === picked
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface/30 text-text border-line hover:border-primary/60"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-hover text-text border border-line">
          {fileType}
        </span>
        {versions.length === 1 && current.label && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted border border-line">
            {current.label}
          </span>
        )}
        {size && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted border border-line">
            {size}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-1">
        <button
          type="button"
          onClick={() => onOpen(downloadUrl)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-surface/30 backdrop-blur-md border border-primary text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
        >
          {fileType === "WEB" ? t.website : t.download}
        </button>
        {tgLink && (
          <button
            type="button"
            onClick={() => onOpen(tgLink)}
            title="Telegram"
            aria-label="Open in Telegram"
            className="flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <img src="/pic/icontg128.png" className="w-4 h-4" alt="" />
          </button>
        )}
      </div>
    </div>
  );
}
