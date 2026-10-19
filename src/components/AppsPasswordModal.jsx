import { useEffect, useState } from "react";

// Katalogdagi ilovani yuklashdan oldin parol so'raydi. Parol serverda tekshiriladi.
export default function AppsPasswordModal({ t, open, onClose, onUnlocked }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setError("");
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (busy || !password.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/apps/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) onUnlocked(body.expiresAt);
      else setError(res.status === 429 ? t.tooManyAttempts : res.status === 401 ? t.wrongPassword : t.networkError);
    } catch {
      setError(t.networkError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm border-0 cursor-default"
        aria-label={t.close}
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className="relative w-full sm:max-w-sm bg-surface border border-line rounded-t-lg sm:rounded-lg shadow-popover p-4 flex flex-col gap-3 animate-fade-in-up"
      >
        <h2 className="text-base font-bold text-text">{t.appsPasswordTitle}</h2>
        <p className="text-sm text-muted">{t.appsPasswordHint}</p>
        <div className="flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder={t.enterPassword}
            className="flex-1 border border-line bg-bg rounded-md px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={busy || !password.trim()}
            className="px-3 py-2 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {t.appsPasswordSubmit}
          </button>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </div>
  );
}
