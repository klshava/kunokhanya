import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!error && profile) {
      redirect(profile.role === "admin" ? "/admin" : "/portal");
    }

    // No matching profile row: this account can't reach /admin or /portal
    // (both redirect back here), so sign out and show the login form again
    // rather than bouncing forever.
    await supabase.auth.signOut();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-rise-in">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Kunokhanya Training Academy</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Sign in to your account</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-ink-faint">
          Students: use the email and password given to you by the academy office.
        </p>
      </div>
    </div>
  );
}
