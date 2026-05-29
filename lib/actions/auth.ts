"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";

type ActionResult = { error: string } | { success: true };

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { name, email, password } = parsed.data;
  const phone = parsed.data.phone ? `+94${parsed.data.phone.replace(/^\+94/, "")}` : null;
  const admin = createAdminClient();

  // Create with email_confirm: true so the account is immediately usable.
  // When Resend is configured, swap this for supabase.auth.signUp() + confirmation email flow.
  const { data: adminData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone: phone ?? null },
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("already registered")) {
      return { error: "An account with this email already exists." };
    }
    return { error: createError.message };
  }
  if (!adminData.user) return { error: "Registration failed. Please try again." };

  // Check phone uniqueness before inserting (only when phone is provided)
  if (phone) {
    const { data: existingPhone } = await admin
      .from("users")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (existingPhone) {
      // Roll back the auth user we just created
      await admin.auth.admin.deleteUser(adminData.user.id);
      return { error: "An account with this phone number already exists." };
    }
  }

  // Insert profile row
  const { error: profileError } = await admin.from("users").insert({
    id: adminData.user.id,
    email,
    name,
    phone: phone ?? null,
    role: "customer",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(adminData.user.id);
    if (profileError.message.includes("users_phone_unique")) {
      return { error: "An account with this phone number already exists." };
    }
    if (!profileError.message.includes("duplicate")) {
      return { error: "Failed to create profile. Please contact support." };
    }
  }

  // Sign in immediately so the session is established
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: signInError.message };

  return { success: true };
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes("invalid")) {
      return { error: "Incorrect email or password." };
    }
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Your email isn't confirmed yet. Please contact us or try registering again." };
    }
    return { error: error.message };
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const raw = { email: formData.get("email") };
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) return { error: error.message };
  return { success: true };
}

export async function googleOAuthAction(redirectTo?: string) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    // Google OAuth not configured — return a user-friendly message
    return { error: "Google sign-in is not available yet." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${redirectTo ?? "/"}`,
    },
  });

  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}
