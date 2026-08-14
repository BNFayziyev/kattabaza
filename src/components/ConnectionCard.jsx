import { useState } from "react";
import { countryFlagUrl, getCountryName } from "../lib/helpers";
import IpDetailsModal from "./IpDetailsModal";

export default function ConnectionCard({ t, ipInfo, copiedIp, onCopy }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const locationLabel =
    [ipInfo.city, getCountryName(ipInfo.countryName || ipInfo.countryCode)]
      .filter(Boolean)
      .join(", ") || t.unknown;

  return (
    <div className="w-full sm:max-w-2xl rounded-lg border border-line bg-surface/30 backdrop-blur-md shadow-popover p-5 sm:p-6 flex items-center gap-4 sm:gap-5">
      {ipInfo.countryCode ? (
        <img
          src={countryFlagUrl(ipInfo.countryCode)}
          alt={`${ipInfo.countryCode} flag`}
          className="w-16 h-12 sm:w-20 sm:h-14 rounded-md object-cover border border-line shadow-md shrink-0"
        />
      ) : (
        <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-md bg-surface-hover shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base text-muted truncate">
            {ipInfo.loading ? t.checking : locationLabel}
          </span>
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="shrink-0 w-5 h-5 rounded-full bg-surface-hover hover:bg-line/60 text-text text-xs font-bold flex items-center justify-center transition-colors"
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
            onClick={() => onCopy(ipInfo.ipv4 || ipInfo.ipv6, "main")}
            aria-label={t.copy}
            title={t.copy}
            className="shrink-0 w-8 h-8 rounded-md bg-surface-hover hover:bg-line/60 text-text text-sm flex items-center justify-center transition-colors"
          >
            {copiedIp === "main" ? "✓" : "⧉"}
          </button>
          <button
            type="button"
            onClick={ipInfo.refresh}
            aria-label={t.refresh}
            title={t.refresh}
            className="shrink-0 w-8 h-8 rounded-md bg-surface-hover hover:bg-line/60 text-text text-sm flex items-center justify-center transition-colors"
          >
            ↻
          </button>
        </div>

        <div className="text-xs sm:text-sm text-muted mt-1 truncate">
          {t.ipv6}: {ipInfo.ipv6 || t.unknown}
          {ipInfo.org ? ` · ${ipInfo.org}` : ""}
        </div>
      </div>

      <IpDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} t={t} ipInfo={ipInfo} />
    </div>
  );
}
