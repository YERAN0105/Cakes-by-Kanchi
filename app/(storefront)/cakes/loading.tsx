import { Container } from "@/components/shared/Container";
import { ProductGridSkeleton } from "@/components/storefront/products/ProductCardSkeleton";

export default function CakesLoading() {
  return (
    <>
      <div className="py-14 bg-cream-50 border-b border-border text-center animate-pulse">
        <div className="h-3 w-24 bg-blush/40 rounded mx-auto mb-3" />
        <div className="h-8 w-48 bg-blush/40 rounded mx-auto" />
        <div className="ornament-line mt-4" />
      </div>
      <Container className="py-10 lg:py-14">
        <div className="flex gap-8 lg:gap-10">
          <div className="hidden lg:block w-56 xl:w-64 shrink-0">
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-blush/30 rounded" />
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <ProductGridSkeleton count={12} />
          </div>
        </div>
      </Container>
    </>
  );
}
