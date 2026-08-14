import { useState } from "react";
import { getKeyRecords, getTashkentPassword } from "../lib/helpers";

const MASKED_KEY = "•••• •••• •••• ••••";
const MASKED_SHORT = "••••••••";

export default function KeysPanel({ t, dbRows, showHeaderClose, onClose }) {
  const [helpAdminOpen, setHelpAdminOpen] = useState(false);
  const [keysPassword, setKeysPassword] = useState("");
  const [isKeysUnlocked, setIsKeysUnlocked] = useState(false);
  const [keysPasswordError, setKeysPasswordError] = useState("");
  const [keyCopyState, setKeyCopyState] = useState("");

  const keyRecords = getKeyRecords(dbRows);

  const unlockKeys = () => {
    const expected = getTashkentPassword();
    const entered = keysPassword.trim();
    if (entered === expected) {
      setIsKeysUnlocked(true);
      setKeysPasswordError("");
    } else {
      setIsKeysUnlocked(false);
      setKeysPasswordError(t.wrongPassword);
    }
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
        <div className="text-sm font-bold text-text mb-2">{t.keysAccess}</div>
        <div className="flex gap-2">
          <input
            type="password"
            value={keysPassword}
            onChange={(e) => {
              setKeysPassword(e.target.value);
              setKeysPasswordError("");
            }}
            placeholder={t.enterPassword}
            className="flex-1 border border-line bg-bg rounded-md px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={unlockKeys}
            className="px-3 py-2 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors"
          >
            {t.open}
          </button>
        </div>
        {keysPasswordError && <p className="text-xs text-danger mt-2">{keysPasswordError}</p>}
        {isKeysUnlocked && !keysPasswordError && (
          <p className="text-xs text-success mt-2">{t.confirmed}</p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1 space-y-2 scrollbar-thin">
        {keyRecords.length === 0 ? (
          <div className="text-xs text-muted px-1">{t.keysEmpty}</div>
        ) : (
          keyRecords.map((row) => (
            <div key={row.id} className="rounded-lg border border-line bg-surface p-3">
              <div className="space-y-1">
                <div className="text-[11px] uppercase text-muted">Domain</div>
                <div className="text-sm font-semibold text-text break-all">
                  {isKeysUnlocked ? row.domain || "—" : MASKED_SHORT}
                </div>
                <div className="text-[11px] uppercase text-muted mt-2">Key Name</div>
                <div className="text-sm font-medium text-text break-all">
                  {isKeysUnlocked ? row.keyName || "—" : MASKED_SHORT}
                </div>
                <div className="text-[11px] uppercase text-muted mt-2">Key</div>
                <button
                  type="button"
                  onClick={() => copyKey(row.keyValue, row.id)}
                  disabled={!isKeysUnlocked}
                  className={`w-full text-left text-sm font-mono rounded-md px-2 py-1 border ${
                    isKeysUnlocked
                      ? "border-primary/30 bg-primary-soft hover:opacity-90 text-primary"
                      : "border-line bg-surface-hover text-muted cursor-default"
                  }`}
                >
                  {isKeysUnlocked ? row.keyValue : MASKED_KEY}
                </button>
              </div>
              {!isKeysUnlocked && <div className="text-[11px] text-muted mt-2">{t.lockedHint}</div>}
              {isKeysUnlocked && keyCopyState === row.id && (
                <div className="text-xs text-success mt-2">{t.copied}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
