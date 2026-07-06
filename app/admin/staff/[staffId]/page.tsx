import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StaffForm } from "../staff-form";
import { updateStaffAction } from "../actions";

export default async function StaffDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { staffId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: staff } = await supabase.from("staff").select("*").eq("staff_id", staffId).single();

  if (!staff) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={[staff.title, staff.first_name, staff.last_name].filter(Boolean).join(" ")}
        backHref="/admin/staff"
        backLabel="Staff records"
      />
      {sp.created === "1" && (
        <div className="mb-6 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
          Staff member added successfully.
        </div>
      )}
      <Card>
        <CardContent className="p-6 sm:p-8">
          <StaffForm staff={staff} action={updateStaffAction.bind(null, staffId)} submitLabel="Save changes" />
        </CardContent>
      </Card>
    </div>
  );
}
