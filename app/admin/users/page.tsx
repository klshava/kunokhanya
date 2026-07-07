import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateUserForm } from "./create-user-form";
import { RevokeAccessButton } from "./revoke-access-button";
import type { UserRole } from "@/lib/database.types";

const ROLE_BADGE: Record<UserRole, "brand" | "success" | "neutral"> = {
  admin: "brand",
  registrar: "success",
  facilitator: "neutral",
  student: "neutral",
};

export default async function ManageUsersPage() {
  const role = await getCurrentRole();
  if (role !== "admin") redirect("/admin");

  const supabase = await createClient();

  const { data: allStaff } = await supabase.from("staff").select("*").order("last_name");

  const { data: staffProfiles } = await supabase
    .from("profiles")
    .select("id, role, email, full_name, linked_staff_id")
    .not("linked_staff_id", "is", null)
    .order("full_name");

  const linkedIds = new Set((staffProfiles ?? []).map((p) => p.linked_staff_id));
  const unlinkedStaff = (allStaff ?? []).filter((s) => !linkedIds.has(s.staff_id));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Manage users"
        description="Grant staff members a login and a role, or revoke access."
        backHref="/admin"
      />

      <Card className="mb-6 p-5">
        <h3 className="mb-4 text-[15px] font-semibold text-ink">Grant access</h3>
        <CreateUserForm unlinkedStaff={unlinkedStaff} />
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Login</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(staffProfiles ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-ink-soft">
                    No staff logins yet. Grant access to a staff member above.
                  </td>
                </tr>
              )}
              {(staffProfiles ?? []).map((p) => (
                <tr key={p.id} className="border-b border-border-soft last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{p.full_name ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft">{p.email ?? "-"}</td>
                  <td className="px-5 py-3">
                    <Badge variant={ROLE_BADGE[p.role]} className="capitalize">
                      {p.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <RevokeAccessButton profileId={p.id} name={p.full_name ?? "this user"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
