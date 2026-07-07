import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/shared/TopBar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  const STAFF_ROLES = ["admin", "registrar", "facilitator"];
  if (!STAFF_ROLES.includes(profile.role)) {
    redirect("/portal");
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar homeHref="/admin" userLabel={profile.full_name ?? profile.email} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
