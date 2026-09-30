import { useEffect, useRef, useState } from "react";
import { ASSISTANT_USERNAME, telegramChatUrl } from "../lib/site";

/**
 * AI yordamchi. Hozircha xabar Telegramda (@synapse_bo1) ochiladi va
 * yordamchi o'sha yerda javob beradi. Sayt ichidagi chat keyin shu panelga ulanadi.
 */
function PanelContent({ t, onClose }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState([]);
  const listRef = useRef(null);

  const send = (value) => {
    const message = value.trim();
    if (!message) return;
    window.open(telegramChatUrl(message), "_blank", "noopener");
    setSent((list) => [...list, message]);
    setText("");
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 h-16 shrink-0 border-b border-line">
        <span className="relative w-8 h-8 rounded-md bg-primary text-on-primary flex items-center justify-center text-sm shrink-0">
          ✦
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold tracking-tight text-text">{t.aiTitle}</div>
          <a
            href={telegramChatUrl()}
            target="_blank"
            rel="noreferrer"
            className="block text-[11px] text-muted hover:text-primary truncate"
          >
            @{ASSISTANT_USERNAME} · {t.aiSubtitle}
          </a>
        </div>
        {onClose && (
          <button type="button" className="text-sm text-muted px-2 py-1 rounded-md hover:bg-surface-hover" onClick={onClose}>
            {t.close}
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-auto scrollbar-thin px-3 py-4 flex flex-col gap-3">
        <div className="max-w-[88%] rounded-lg rounded-bl-sm border border-line bg-surface/60 px-3 py-2 text-sm text-text leading-relaxed">
          {t.aiHello}
        </div>
        {sent.map((message, i) => (
          <div key={i} className="flex flex-col items-end gap-1">
            <div className="max-w-[88%] rounded-lg rounded-br-sm bg-primary text-on-primary px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message}
            </div>
            <span className="text-[11px] text-muted">✓ {t.aiSent}</span>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-line p-2 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {t.aiPrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => send(p)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface/30 backdrop-blur-md border border-line text-text hover:bg-primary hover:text-on-primary hover:border-primary transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          className="flex items-end gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={1}
            placeholder={t.aiPlaceholder}
            aria-label={t.aiPlaceholder}
            className="flex-1 resize-none max-h-28 border border-line bg-bg rounded-md px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label={t.aiSend}
            className="h-9 px-3 rounded-md text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            ➤
          </button>
        </form>
        <p className="text-[11px] text-muted leading-snug px-0.5">{t.aiNote}</p>
      </div>
    </div>
  );
}

export default function AssistantPanel({ t }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <aside className="hidden xl:flex fixed right-0 top-0 bottom-0 w-80 border-l border-line bg-surface/30 backdrop-blur-md z-30">
        <PanelContent t={t} />
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="xl:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-on-primary text-sm font-semibold shadow-popover hover:bg-primary-hover transition-colors"
      >
        <span aria-hidden="true">✦</span>
        {t.aiAsk}
      </button>

      {open && (
        <div className="xl:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 border-0 cursor-default"
            aria-label={t.close}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[88vw] bg-surface/40 backdrop-blur-md border-l border-line shadow-popover animate-fade-in-up">
            <PanelContent t={t} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
