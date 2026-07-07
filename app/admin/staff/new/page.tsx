import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StaffForm } from "../staff-form";
import { createStaffAction } from "../actions";

export default async function NewStaffPage() {
  const role = await getCurrentRole();
  if (role === "facilitator") redirect("/admin");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add staff member" backHref="/admin/staff" backLabel="Staff records" />
      <Card>
        <CardContent className="p-6 sm:p-8">
          <StaffForm action={createStaffAction} submitLabel="Add staff member" />
        </CardContent>
      </Card>
    </div>
  );
}
