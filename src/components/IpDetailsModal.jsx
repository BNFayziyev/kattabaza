import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function IpDetailsModal({ open, onClose, t, ipInfo }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const rows = [
    ["IPv4", ipInfo.ipv4 || "—"],
    ["IPv6", ipInfo.ipv6 || "—"],
    ["City", ipInfo.city || "—"],
    ["Region", ipInfo.region || "—"],
    ["Country", [ipInfo.countryName, ipInfo.countryCode].filter(Boolean).join(" · ") || "—"],
    ["Postal code", ipInfo.postal || "—"],
    [
      "Coordinates",
      ipInfo.latitude != null && ipInfo.longitude != null
        ? `${ipInfo.latitude}, ${ipInfo.longitude}`
        : "—",
    ],
    ["Timezone", ipInfo.timezone || "—"],
    ["UTC offset", ipInfo.utcOffset || "—"],
    ["ISP / Org", ipInfo.org || "—"],
    ["ASN", ipInfo.asn || "—"],
    ["Calling code", ipInfo.callingCode || "—"],
    ["Currency", [ipInfo.currency, ipInfo.currencyName].filter(Boolean).join(" · ") || "—"],
    ["Languages", ipInfo.languages || "—"],
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm border-0 cursor-default"
        aria-label={t.close}
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[85vh] bg-surface/40 backdrop-blur-md border border-line rounded-lg shadow-popover flex flex-col overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center px-4 py-3 border-b border-line shrink-0">
          <span className="text-sm font-bold text-text">{t.ipDetails}</span>
          <button
            type="button"
            className="text-sm text-muted px-2 py-1 rounded-md hover:bg-surface-hover"
            onClick={onClose}
          >
            {t.close}
          </button>
        </div>

        <div className="overflow-auto scrollbar-thin px-4 py-2">
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <td className="py-2.5 pr-3 text-muted whitespace-nowrap align-top">{label}</td>
                  <td className="py-2.5 font-mono text-text text-right break-all">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body
  );
}
