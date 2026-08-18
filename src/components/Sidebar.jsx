import { useState } from "react";

function NavItem({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
        active ? "bg-primary-soft text-primary" : "text-muted hover:text-text hover:bg-surface-hover"
      }`}
    >
      <span aria-hidden="true" className="w-4 text-center">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function SidebarContent({
  t,
  theme,
  setTheme,
  lang,
  setLang,
  activeTab,
  channels,
  selectedChannel,
  onNavigate,
  onSelectChannel,
  onOpenKeys,
}) {
  return (
    <div className="flex flex-col h-full">
      <button
        type="button"
        onClick={() => onNavigate("home")}
        className="flex items-center gap-2.5 px-3 h-16 shrink-0 border-b border-line"
      >
        <img src="/logo.png" alt="KattaBaza" className="w-8 h-8 rounded-md object-cover" />
        <span className="text-base font-extrabold tracking-tight text-text">KattaBaza</span>
      </button>

      <div className="flex-1 overflow-auto scrollbar-thin px-2 py-3 flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <NavItem active={activeTab === "home"} onClick={() => onNavigate("home")} icon="🏠" label={t.home} />
          <NavItem
            active={activeTab === "categories"}
            onClick={() => onNavigate("categories")}
            icon="📂"
            label={t.categories}
          />
          <NavItem
            active={activeTab === "checker"}
            onClick={() => onNavigate("checker")}
            icon="🛡️"
            label={t.checker}
          />
        </div>

        {channels.length > 0 && (
          <div>
            <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {t.channels}
            </div>
            <div className="flex flex-col gap-0.5">
              {channels.map((ch) => (
                <NavItem
                  key={ch.channel_ID}
                  active={selectedChannel?.channel_ID === ch.channel_ID}
                  onClick={() => onSelectChannel(ch)}
                  icon="📢"
                  label={ch.Name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line p-2 flex flex-col gap-2">
        <NavItem onClick={onOpenKeys} icon="🔑" label={t.contactPanel} />
        <div className="flex items-center gap-1.5 px-1">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex-1 h-8 rounded-md bg-surface-hover text-text text-sm flex items-center justify-center hover:bg-line/60 transition-colors"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`flex-1 h-8 rounded-md text-xs font-semibold transition-colors ${
              lang === "en" ? "bg-primary text-on-primary" : "bg-surface-hover text-muted"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("ru")}
            className={`flex-1 h-8 rounded-md text-xs font-semibold transition-colors ${
              lang === "ru" ? "bg-primary text-on-primary" : "bg-surface-hover text-muted"
            }`}
          >
            RU
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar(props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, onNavigate, onOpenKeys } = props;

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 border-r border-line bg-surface/30 backdrop-blur-md z-30">
        <SidebarContent {...props} />
      </aside>

      <header className="lg:hidden sticky top-0 z-40 w-full h-14 border-b border-line bg-surface/30 backdrop-blur-md flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2"
        >
          <img src="/logo.png" alt="KattaBaza" className="w-7 h-7 rounded-md object-cover" />
          <span className="text-sm font-extrabold tracking-tight text-text">KattaBaza</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenKeys}
            aria-label={t.contactPanel}
            className="w-8 h-8 rounded-md flex items-center justify-center bg-surface-hover text-sm"
          >
            🔑
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            className="w-8 h-8 rounded-md flex items-center justify-center bg-surface-hover text-sm"
          >
            ☰
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 border-0 cursor-default"
            aria-label={t.close}
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-surface/40 backdrop-blur-md border-r border-line shadow-popover animate-fade-in-up">
            <SidebarContent
              {...props}
              onNavigate={(tab) => {
                onNavigate(tab);
                setMobileOpen(false);
              }}
              onSelectChannel={(ch) => {
                props.onSelectChannel(ch);
                setMobileOpen(false);
              }}
              onOpenKeys={() => {
                onOpenKeys();
                setMobileOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
