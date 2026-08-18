import { useEffect } from "react";
import KeysPanel from "./KeysPanel";

export default function KeysModal({ open, onClose, t }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm border-0 cursor-default"
        aria-label={t.close}
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[85vh] bg-surface border border-line rounded-t-lg sm:rounded-lg shadow-popover flex flex-col overflow-hidden animate-fade-in-up">
        <div className="p-4 flex flex-col min-h-0 flex-1">
          <KeysPanel t={t} showHeaderClose onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
