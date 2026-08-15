import { useState } from "react";
import { countryFlagUrl, getCountryName } from "../lib/helpers";
import IpDetailsModal from "./IpDetailsModal";

const FLAG_MASK =
  "linear-gradient(to right, black 0%, black 30%, transparent 82%)";

export default function ConnectionCard({ t, ipInfo, copiedIp, onCopy }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const locationLabel =
    [ipInfo.city, getCountryName(ipInfo.countryName || ipInfo.countryCode)]
      .filter(Boolean)
      .join(", ") || t.unknown;

  const openDetails = () => setDetailsOpen(true);
  const stop = (e) => e.stopPropagation();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDetails()}
      className="relative w-full sm:max-w-2xl rounded-lg border border-line bg-surface/30 backdrop-blur-md shadow-popover overflow-hidden cursor-pointer hover:border-primary/40 transition-colors"
    >
      {ipInfo.countryCode && (
        <img
          src={countryFlagUrl(ipInfo.countryCode)}
          alt=""
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-44 sm:w-64 h-full object-cover pointer-events-none"
          style={{ WebkitMaskImage: FLAG_MASK, maskImage: FLAG_MASK }}
        />
      )}

      <div className="relative z-10 flex items-center gap-4 sm:gap-5 p-5 sm:p-6 pl-24 sm:pl-32">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-semibold text-text truncate">
              {ipInfo.loading ? t.checking : locationLabel}
            </span>
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                openDetails();
              }}
              className="shrink-0 w-6 h-6 rounded-full bg-surface border border-line shadow-sm hover:bg-surface-hover text-text text-xs font-bold flex items-center justify-center transition-colors"
              title={t.ipDetails}
              aria-label={t.ipDetails}
            >
              i
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text font-mono break-all leading-tight">
              {ipInfo.loading ? t.checking : ipInfo.ipv4 || ipInfo.ipv6 || t.unknown}
            </div>
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onCopy(ipInfo.ipv4 || ipInfo.ipv6, "main");
              }}
              aria-label={t.copy}
              title={t.copy}
              className="shrink-0 w-9 h-9 rounded-md bg-surface border border-line shadow-sm hover:bg-surface-hover text-text text-base flex items-center justify-center transition-colors"
            >
              {copiedIp === "main" ? "✓" : "⧉"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                ipInfo.refresh();
              }}
              aria-label={t.refresh}
              title={t.refresh}
              className="shrink-0 w-9 h-9 rounded-md bg-primary text-on-primary shadow-sm hover:bg-primary-hover text-base flex items-center justify-center transition-colors"
            >
              ↻
            </button>
          </div>

          <div className="text-xs sm:text-sm text-muted mt-1 truncate">
            {t.ipv6}: {ipInfo.ipv6 || t.unknown}
            {ipInfo.org ? ` · ${ipInfo.org}` : ""}
          </div>
        </div>
      </div>

      <div onClick={stop}>
        <IpDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} t={t} ipInfo={ipInfo} />
      </div>
    </div>
  );
}
