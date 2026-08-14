export default function Footer({ t }) {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-line bg-surface mt-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="KattaBaza" className="w-8 h-8 rounded-lg object-cover" />
            <span className="text-base font-extrabold tracking-tight text-text">KattaBaza</span>
          </div>
          <p className="mt-3 text-sm text-muted max-w-xs">{t.footerTagline}</p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">
            {t.footerNav}
          </div>
          <div className="flex flex-col gap-2 text-sm text-text">
            <span>{t.home}</span>
            <span>{t.categories}</span>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">
            {t.footerContact}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <a href="https://t.me/BNFayziyev" target="_blank" rel="noreferrer" className="text-text hover:text-primary transition-colors">
              Telegram — @BNFayziyev
            </a>
            <a href="tel:+998995267403" className="text-text hover:text-primary transition-colors">
              +998 99 526 74 03
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {year} KattaBaza.uz — {t.footerRights}</span>
        </div>
      </div>
    </footer>
  );
}
