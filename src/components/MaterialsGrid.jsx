import MaterialCard from "./MaterialCard";

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-md bg-surface-hover shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 w-3/4 rounded bg-surface-hover" />
          <div className="h-2.5 w-1/2 rounded bg-surface-hover" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 flex-1 rounded-md bg-surface-hover" />
        <div className="h-9 w-9 rounded-md bg-surface-hover" />
      </div>
    </div>
  );
}

export default function MaterialsGrid({ t, materials, loading, emptyMessage, onOpen }) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        aria-busy="true"
        aria-label={t.loading}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-16 text-muted text-sm rounded-lg border border-dashed border-line">
        {emptyMessage || t.noMaterials}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {materials.map((item) => (
        <MaterialCard key={item.id} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}
