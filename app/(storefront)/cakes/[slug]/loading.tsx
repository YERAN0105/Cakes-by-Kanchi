import { Container } from "@/components/shared/Container";

export default function ProductDetailLoading() {
  return (
    <Container className="py-6 lg:py-10">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-6 animate-pulse">
        {[80, 60, 100, 150].map((w, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className={`h-3 bg-blush/30 rounded`} style={{ width: w }} />
            {i < 3 && <span className="h-3 w-3 bg-blush/20 rounded" />}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14">
        {/* Gallery skeleton */}
        <div className="space-y-3 animate-pulse">
          <div className="aspect-square rounded-2xl bg-blush/30" />
          <div className="flex gap-2.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-16 h-16 rounded-lg bg-blush/20" />
            ))}
          </div>
        </div>

        {/* Info skeleton */}
        <div className="space-y-4 animate-pulse">
          <div className="h-3 w-24 bg-wine/20 rounded" />
          <div className="h-8 w-3/4 bg-blush/40 rounded" />
          <div className="h-7 w-1/3 bg-wine/20 rounded" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-blush/20 rounded" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 w-28 bg-blush/30 rounded-lg" />
            ))}
          </div>
          <div className="h-12 bg-wine/10 rounded-lg" />
        </div>
      </div>
    </Container>
  );
}
