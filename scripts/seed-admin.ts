/**
 * Seed an admin user.
 *
 * Usage:
 *   ADMIN_SEED_EMAIL=admin@cakery.lk ADMIN_SEED_PASSWORD=YourStrongPass123 npx tsx scripts/seed-admin.ts
 *
 * Or set those values in .env.local and run:
 *   npm run seed-admin
 */
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_SEED_EMAIL;
const adminPassword = process.env.ADMIN_SEED_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error("❌  Missing ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD");
  console.error("   Set them in .env.local or pass as environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function seedAdmin() {
  console.log(`\n🎂  Seeding admin user: ${adminEmail}\n`);

  // Check if user already exists in auth
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email === adminEmail);

  let userId: string;

  if (existing) {
    console.log("ℹ️   Auth user already exists — using existing account.");
    userId = existing.id;
  } else {
    // Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail!,
      password: adminPassword,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error("❌  Failed to create auth user:", error?.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("✅  Auth user created:", userId);
  }

  // Upsert users table row with admin role
  const { error: profileError } = await supabase.from("users").upsert(
    {
      id: userId,
      email: adminEmail!,
      name: "Admin",
      role: "admin",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("❌  Failed to upsert users profile:", profileError.message);
    process.exit(1);
  }

  console.log("✅  Admin role set in users table.");
  console.log("\n🎉  Done! You can now log in at /login with:");
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}\n`);
}

seedAdmin().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
