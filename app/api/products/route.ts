import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const category = searchParams.getAll("category");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const flavors = searchParams.getAll("flavor");
  const dietary = searchParams.getAll("dietary");
  const search = searchParams.get("q") ?? undefined;
  const sort = (searchParams.get("sort") as "newest" | "price_asc" | "price_desc" | "popularity" | "rating") ?? "newest";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "12", 10);

  const { products, total } = await getProducts({
    category: category.length > 0 ? category : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    flavors: flavors.length > 0 ? flavors : undefined,
    dietary: dietary.length > 0 ? dietary : undefined,
    search,
    sort,
    page,
    limit: Math.min(limit, 48),
  });

  return NextResponse.json({ products, total });
}
