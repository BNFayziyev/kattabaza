import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Rasm karuseli: o'zi aylanadi, sichqoncha ustida to'xtaydi,
 * surish (swipe) va klaviatura strelkalari bilan boshqariladi.
 */
export default function Carousel({ slides, label, interval = 5000 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(null);
  const count = slides.length;

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2 || reducedMotion()) return;
    const id = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, interval);
    return () => clearInterval(id);
  }, [paused, count, interval]);

  if (!count) return null;

  return (
    <div className="min-w-0">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(index + 1);
          if (e.key === "ArrowLeft") go(index - 1);
        }}
        onPointerDown={(e) => {
          startX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
        className="group relative aspect-video select-none overflow-hidden rounded-md border border-line bg-black outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <img
              key={s.src}
              src={s.src}
              alt={s.caption}
              draggable="false"
              loading={i === 0 ? "eager" : "lazy"}
              aria-hidden={i !== index}
              className="h-full w-full shrink-0 object-cover"
            />
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity [@media(hover:none)]:opacity-80"
            >
              <Icon name="chevronLeft" size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity [@media(hover:none)]:opacity-80"
            >
              <Icon name="chevronRight" size={18} strokeWidth={2.2} />
            </button>
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${i + 1} / ${count}`}
                  aria-current={i === index}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-primary" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <p className="mt-2 min-h-[2.5rem] text-xs text-muted leading-snug" aria-live="polite">
        {slides[index].caption}
      </p>
    </div>
  );
}
