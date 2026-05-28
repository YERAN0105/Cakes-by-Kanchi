import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      id, slug, name, base_price,
      categories ( name ),
      product_images ( url, is_primary ),
      product_sizes ( price )
    `)
    .eq("is_published", true)
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .order("is_featured", { ascending: false })
    .limit(6);

  if (error) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }

  type SearchRow = {
    id: string;
    slug: string;
    name: string;
    base_price: string;
    categories: { name: string } | null;
    product_images: { url: string; is_primary: boolean }[];
    product_sizes: { price: string }[];
  };

  const results = ((data ?? []) as unknown as SearchRow[]).map((p) => {
    const sizes = p.product_sizes ?? [];
    const images = p.product_images ?? [];
    const minPrice = sizes.length > 0
      ? Math.min(...sizes.map((s) => parseFloat(s.price)))
      : parseFloat(p.base_price);
    const primaryImg = images.find((i) => i.is_primary)?.url ?? images[0]?.url ?? null;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.categories?.name ?? null,
      minPrice,
      imageUrl: primaryImg,
    };
  });

  return NextResponse.json({ results });
}
