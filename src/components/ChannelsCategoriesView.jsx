export default function ChannelsCategoriesView({
  t,
  channels,
  popularCategories,
  selectedChannel,
  onSelectChannel,
  onSelectCategory,
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-sm font-bold text-text mb-3">{t.channels}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {channels.map((ch) => (
            <button
              type="button"
              key={ch.channel_ID}
              onClick={() => onSelectChannel(ch)}
              className="text-left rounded-lg border border-line bg-surface/30 backdrop-blur-md hover:border-primary/40 transition-colors px-4 py-3.5 flex items-center gap-3"
            >
              <span className="w-8 h-8 rounded-md bg-primary-soft text-primary flex items-center justify-center text-sm shrink-0">
                📢
              </span>
              <span className="text-sm font-semibold text-text truncate">{ch.Name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-text mb-3">{t.popularCategories}</h2>
        <div className="flex flex-wrap gap-2">
          {popularCategories.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => onSelectCategory(cat, selectedChannel)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface/30 backdrop-blur-md border border-line text-text hover:bg-primary hover:text-on-primary hover:border-primary transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
