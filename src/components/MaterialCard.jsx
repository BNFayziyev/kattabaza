import { getFileType } from "../lib/helpers";

export default function MaterialCard({ item, onOpen }) {
  const fileType = getFileType(item);
  const title = item.title ? item.title.replace(/\.[^/.]+$/, "") : "";

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
            onClick={() => onOpen(item.post_link)}
            className="text-sm font-semibold text-text hover:text-primary transition-colors text-left break-words"
          >
            {title}
          </button>
          {item.description && (
            <p className="text-xs text-muted line-clamp-2 mt-0.5">{item.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-hover text-text border border-line">
          {fileType}
        </span>
        {item.size_mb && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-muted border border-line">
            {item.size_mb} MB
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto pt-1">
        <button
          type="button"
          onClick={() => (item.file_url ? onOpen(item.file_url) : onOpen(item.post_link))}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-surface/30 backdrop-blur-md border border-primary text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
        >
          Download
        </button>
        {item.file_url && (
          <button
            type="button"
            onClick={() => onOpen(item.post_link)}
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
