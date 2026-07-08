import { createClient } from "@/lib/supabase/server";
import { LauncherTile } from "@/components/admin/LauncherTile";
import { User, Receipt, GraduationCap, Award } from "lucide-react";

export default async function PortalHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("linked_student_id")
    .eq("id", user!.id)
    .single();

  const { data: student } = profile?.linked_student_id
    ? await supabase.from("students").select("full_name, status").eq("student_id", profile.linked_student_id).single()
    : { data: null };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome{student?.full_name ? `, ${student.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">What would you like to do?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <LauncherTile
          href="/portal/profile"
          label="My profile"
          description="Update your contact details"
          icon={User}
          tint="brand"
        />
        <LauncherTile
          href="/portal/fees"
          label="Fee statement"
          description="View your balance and payments"
          icon={Receipt}
          tint="amber"
        />
        <LauncherTile
          href="/portal/results"
          label="Results"
          description="View your assessment results"
          icon={GraduationCap}
          tint="emerald"
        />
        {student?.status === "completed" && profile?.linked_student_id && (
          <LauncherTile
            href={`/certificate/${profile.linked_student_id}`}
            label="Certificate"
            description="View and print your certificate"
            icon={Award}
            tint="violet"
          />
        )}
      </div>
    </div>
  );
}
