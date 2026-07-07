import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { DetailTabs } from "./detail-tabs";
import { NewLoginBanner } from "./new-login-banner";
import { studentLoginEmail, deriveStudentPassword } from "@/lib/students";

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { studentId } = await params;
  const sp = await searchParams;
  const justCreated = sp.created === "1";
  const emailed = sp.emailed === "1";

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*, courses(*)")
    .eq("student_id", studentId)
    .single();

  if (!student) {
    notFound();
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("course_name");

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .order("payment_date", { ascending: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("linked_student_id", studentId)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={student.full_name} description={student.student_number ?? undefined} backHref="/admin/students" backLabel="Student lookup" />

      {justCreated && student.student_number && (
        <NewLoginBanner
          fullName={student.full_name}
          loginEmail={studentLoginEmail(student.student_number)}
          password={deriveStudentPassword(student.full_name)}
          contactNumber={student.contact_number}
          emailAddress={student.email}
          emailed={emailed}
        />
      )}

      <DetailTabs
        student={student as any}
        courses={courses ?? []}
        payments={payments ?? []}
        hasPortalAccount={!!profile}
      />
    </div>
  );
}
