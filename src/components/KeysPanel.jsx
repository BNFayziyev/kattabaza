import { useState } from "react";
import { supabase, getClientId } from "../lib/supabase";

/**
 * XAVFSIZLIK — nima o'zgardi:
 *
 * ESKI: kalitlar sahifa ochilishi bilan brauzerga yuklanardi va parol
 *       (`getTashkentPassword()`) faqat UI da yashirardi. Ya'ni DevTools →
 *       Network yoki ochiq Google Sheet URL orqali hamma kalitni ko'rish
 *       mumkin edi. Parol algoritmi ham JS bundle ichida edi.
 *
 * YANGI: brauzerda hech qanday kalit yo'q. Parol SERVERDA (Postgres,
 *        bcrypt) tekshiriladi va kalitlar faqat to'g'ri paroldan keyin
 *        `unlock_keys` RPC javobida keladi. Brute-force throttle serverda.
 */
export default function KeysPanel({ t, showHeaderClose, onClose }) {
  const [helpAdminOpen, setHelpAdminOpen] = useState(false);
  const [keysPassword, setKeysPassword] = useState("");
  const [isKeysUnlocked, setIsKeysUnlocked] = useState(false);
  const [keysPasswordError, setKeysPasswordError] = useState("");
  const [keyCopyState, setKeyCopyState] = useState("");
  const [keyRecords, setKeyRecords] = useState([]);
  const [busy, setBusy] = useState(false);

  const unlockKeys = async () => {
    const entered = keysPassword.trim();
    if (!entered || busy) return;

    setBusy(true);
    setKeysPasswordError("");

    const { data, error } = await supabase.rpc("unlock_keys", {
      p_password: entered,
      p_client: getClientId(),
    });

    setBusy(false);

    if (error) {
      setKeysPasswordError(t.networkError ?? "Ulanishda xato. Qayta urinib ko'ring.");
      return;
    }

    if (!data?.ok) {
      setIsKeysUnlocked(false);
      setKeyRecords([]);
      if (data?.reason === "too_many_attempts") {
        setKeysPasswordError(
          t.tooManyAttempts ??
            `Juda ko'p urinish. ${data.retry_after_minutes} daqiqadan keyin qayta urining.`
        );
      } else {
        const left = data?.attempts_left;
        setKeysPasswordError(
          (t.wrongPassword ?? "Parol xato") +
            (typeof left === "number" ? ` — ${left} urinish qoldi` : "")
        );
      }
      return;
    }

    setKeyRecords(data.keys ?? []);
    setIsKeysUnlocked(true);
    setKeysPassword("");           // parolni xotirada saqlamaymiz
  };

  const lock = () => {
    setIsKeysUnlocked(false);
    setKeyRecords([]);             // kalitlarni xotiradan tozalaymiz
    setKeysPassword("");
    setKeysPasswordError("");
  };

  const copyKey = async (value, id) => {
    if (!isKeysUnlocked || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setKeyCopyState(id);
      setTimeout(() => setKeyCopyState(""), 1200);
    } catch (err) {
      console.error("Key copy failed", err);
    }
  };

  return (
    <div className="flex flex-col gap-3 min-h-0 flex-1">
      {showHeaderClose && (
        <div className="flex justify-between items-center shrink-0">
          <span className="text-sm font-bold text-text">{t.contactPanel}</span>
          <button
            type="button"
            className="text-sm text-muted px-2 py-1 rounded-lg hover:bg-surface-hover"
            onClick={onClose}
          >
            {t.close}
          </button>
        </div>
      )}

      <div className="rounded-lg border border-line bg-surface-hover p-4 flex flex-col items-center gap-3 shrink-0">
        <img
          src="https://github.com/BNFayziyev.png"
          alt="Profile"
          className="w-14 h-14 rounded-full object-cover border-2 border-surface"
        />
        {!helpAdminOpen ? (
          <button
            type="button"
            onClick={() => setHelpAdminOpen(true)}
            className="w-full px-4 py-2.5 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors"
          >
            {t.helpAdmin}
          </button>
        ) : (
          <div className="w-full space-y-3 text-left">
            <div className="text-sm font-bold text-text">+998995267403</div>
            <div className="text-xs text-muted">@BNFayziyev</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <a href="tel:+998995267403" className="px-2.5 py-1 rounded-md bg-text text-bg font-semibold">
                Call
              </a>
              <a
                href="https://t.me/BNFayziyev"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-semibold"
              >
                Telegram
              </a>
              <a
                href="https://instagram.com/BNFayziyev"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-pink-600 text-white font-semibold"
              >
                Instagram
              </a>
            </div>
            <button
              type="button"
              onClick={() => setHelpAdminOpen(false)}
              className="text-xs text-muted underline"
            >
              {t.hideDetails}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-line bg-surface p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-text">{t.keysAccess}</span>
          {isKeysUnlocked && (
            <button
              type="button"
              onClick={lock}
              className="text-xs text-muted underline hover:text-text"
            >
              {t.lock ?? "Yopish"}
            </button>
          )}
        </div>

        {!isKeysUnlocked && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              unlockKeys();
            }}
          >
            <input
              type="password"
              autoComplete="off"
              value={keysPassword}
              onChange={(e) => {
                setKeysPassword(e.target.value);
                setKeysPasswordError("");
              }}
              placeholder={t.enterPassword}
              className="flex-1 border border-line bg-bg rounded-md px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={busy || !keysPassword.trim()}
              className="px-3 py-2 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {busy ? "…" : t.open}
            </button>
          </form>
        )}

        {keysPasswordError && <p className="text-xs text-danger mt-2">{keysPasswordError}</p>}
        {isKeysUnlocked && !keysPasswordError && (
          <p className="text-xs text-success mt-2">{t.confirmed}</p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1 space-y-2 scrollbar-thin">
        {!isKeysUnlocked ? (
          <div className="text-xs text-muted px-1">{t.lockedHint}</div>
        ) : keyRecords.length === 0 ? (
          <div className="text-xs text-muted px-1">{t.keysEmpty}</div>
        ) : (
          keyRecords.map((row) => (
            <div key={row.id} className="rounded-lg border border-line bg-surface p-3">
              <div className="space-y-1">
                <div className="text-[11px] uppercase text-muted">Domain</div>
                <div className="text-sm font-semibold text-text break-all">
                  {row.domain || "—"}
                </div>
                <div className="text-[11px] uppercase text-muted mt-2">Key Name</div>
                <div className="text-sm font-medium text-text break-all">
                  {row.label || "—"}
                </div>
                <div className="text-[11px] uppercase text-muted mt-2">Key</div>
                <button
                  type="button"
                  onClick={() => copyKey(row.secret, row.id)}
                  className="w-full text-left text-sm font-mono rounded-md px-2 py-1 border border-primary/30 bg-primary-soft hover:opacity-90 text-primary break-all"
                >
                  {row.secret}
                </button>
              </div>
              {keyCopyState === row.id && (
                <div className="text-xs text-success mt-2">{t.copied}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
