import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StudentForm } from "../student-form";
import { createStudentAction } from "../actions";

export default async function NewStudentPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("course_name");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Register new student"
        description="Capture a new student's details and enroll them in a course."
        backHref="/admin"
      />
      <Card>
        <CardContent className="p-6 sm:p-8">
          <StudentForm
            courses={courses ?? []}
            action={createStudentAction}
            submitLabel="Register student"
          />
        </CardContent>
      </Card>
    </div>
  );
}
