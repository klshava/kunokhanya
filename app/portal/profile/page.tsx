import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export default async function PortalProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("linked_student_id")
    .eq("id", user!.id)
    .single();

  if (!profile?.linked_student_id) {
    return (
      <div>
        <PageHeader title="My profile" backHref="/portal" />
        <p className="text-sm text-ink-soft">
          Your account is not yet linked to a student record. Please contact the academy office.
        </p>
      </div>
    );
  }

  const { data: student } = await supabase
    .from("students")
    .select("*, courses(course_name)")
    .eq("student_id", profile.linked_student_id)
    .single();

  if (!student) {
    return (
      <div>
        <PageHeader title="My profile" backHref="/portal" />
        <p className="text-sm text-ink-soft">We could not find your student record. Please contact the academy office.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My profile" backHref="/portal" />

      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-4 p-6 text-sm">
          <div>
            <p className="text-ink-faint">Full name</p>
            <p className="font-medium text-ink">{student.full_name}</p>
          </div>
          <div>
            <p className="text-ink-faint">Student number</p>
            <p className="font-medium text-ink">{student.student_number ?? "-"}</p>
          </div>
          <div>
            <p className="text-ink-faint">Course</p>
            <p className="font-medium text-ink">{(student.courses as any)?.course_name ?? "-"}</p>
          </div>
          <div>
            <p className="text-ink-faint">Status</p>
            <p className="font-medium capitalize text-ink">{student.status}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-[15px] font-semibold text-ink">Contact details</h3>
          <ContactForm student={student} />
        </CardContent>
      </Card>
    </div>
  );
}
