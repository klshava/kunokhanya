"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginFormSchema } from "@/lib/validations";

export interface AuthActionState {
  error?: string;
}

// Students log in with their student number (e.g. "KTA170007") rather than an
// email address. Supabase Auth still requires an email-shaped identifier, so
// student accounts are created as "<student number>@STUDENT_LOGIN_DOMAIN" and
// we translate a bare (no "@") login input into that address here. Anything
// already containing "@" (staff/admin accounts) is passed through unchanged.
const STUDENT_LOGIN_DOMAIN = "kunokhanya.co.za";

function resolveLoginEmail(identifier: string) {
  const trimmed = identifier.trim();
  return trimmed.includes("@") ? trimmed : `${trimmed.toLowerCase()}@${STUDENT_LOGIN_DOMAIN}`;
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: resolveLoginEmail(parsed.data.email),
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Incorrect email or password" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Something went wrong signing you in. Please try again." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: "Your account isn't fully set up yet. Please contact the office." };
  }

  redirect(profile.role === "admin" ? "/admin" : "/portal");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
