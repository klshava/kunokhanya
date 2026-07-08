import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
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

  const role = await getCurrentRole();
  const isFacilitator = role === "facilitator";
  const canEdit = !isFacilitator;
  const justCreated = sp.created === "1" && canEdit;
  const emailed = sp.emailed === "1";

  const supabase = await createClient();

  // Facilitators have no RLS access to the base students table (or payments)
  // at all -- they read from students_directory, which never has financial
  // columns, and payments are never fetched for them in the first place.
  const { data: student } = isFacilitator
    ? await supabase.from("students_directory").select("*").eq("student_id", studentId).single()
    : await supabase.from("students").select("*, courses(*)").eq("student_id", studentId).single();

  if (!student) {
    notFound();
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("course_name");

  const { data: payments } = isFacilitator
    ? { data: [] }
    : await supabase.from("payments").select("*").eq("student_id", studentId).order("payment_date", { ascending: false });

  const { data: profile } = isFacilitator
    ? { data: null }
    : await supabase.from("profiles").select("id, email").eq("linked_student_id", studentId).maybeSingle();

  // results RLS grants full access to any staff role (admin/registrar/
  // facilitator alike), unlike students/payments -- no branching needed.
  const { data: results } = await supabase
    .from("results")
    .select("*")
    .eq("student_id", studentId)
    .order("assessed_date", { ascending: false });

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
        results={results ?? []}
        hasPortalAccount={!!profile}
        canSeeFinance={!isFacilitator}
        canEdit={canEdit}
      />
    </div>
  );
}
