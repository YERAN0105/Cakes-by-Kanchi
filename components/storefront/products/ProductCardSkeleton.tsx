export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="aspect-square rounded-xl bg-blush/30 mb-3" />
      <div className="px-0.5 space-y-2">
        <div className="h-3 w-16 bg-blush/30 rounded" />
        <div className="h-4 w-3/4 bg-blush/40 rounded" />
        <div className="h-3.5 w-1/3 bg-wine/15 rounded" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
