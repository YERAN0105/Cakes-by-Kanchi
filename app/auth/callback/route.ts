import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert user profile for first-time Google sign-in
      const admin = createAdminClient();
      const name =
        data.user.user_metadata?.full_name ??
        data.user.user_metadata?.name ??
        data.user.email?.split("@")[0] ??
        "User";

      await admin.from("users").upsert(
        {
          id: data.user.id,
          email: data.user.email!,
          name,
          phone: data.user.user_metadata?.phone ?? null,
          role: "customer",
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      const redirectTo = next.startsWith("/") ? `${origin}${next}` : origin;
      return NextResponse.redirect(redirectTo);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_error`);
}
