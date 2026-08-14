export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2 bg-surface border border-line rounded-md px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
      <span className="text-muted" aria-hidden="true">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full outline-none bg-transparent text-sm text-text placeholder:text-muted"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear"
          className="text-muted hover:text-text text-sm px-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}
