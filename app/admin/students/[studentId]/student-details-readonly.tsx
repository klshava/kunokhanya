import { formatDate } from "@/lib/currency";

/**
 * Read-only view of a student's non-financial details, for facilitators.
 * Deliberately takes the exact same field set as students_directory -- there
 * is no financial field in scope here to accidentally render.
 */
export function StudentDetailsReadonly({
  student,
}: {
  student: {
    full_name: string;
    id_number: string | null;
    date_of_birth: string | null;
    gender: string | null;
    contact_number: string | null;
    email: string | null;
    physical_address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_number: string | null;
    course_name?: string | null;
    study_mode: string;
    enrollment_date: string;
    status: string;
    intake_month: string | null;
  };
}) {
  const fields: { label: string; value: string | null }[] = [
    { label: "Full name", value: student.full_name },
    { label: "ID / passport number", value: student.id_number },
    { label: "Date of birth", value: student.date_of_birth ? formatDate(student.date_of_birth) : null },
    { label: "Gender", value: student.gender },
    { label: "Contact number", value: student.contact_number },
    { label: "Email", value: student.email },
    { label: "Physical address", value: student.physical_address },
    { label: "Emergency contact name", value: student.emergency_contact_name },
    { label: "Emergency contact number", value: student.emergency_contact_number },
    { label: "Course", value: student.course_name ?? null },
    { label: "Study mode", value: student.study_mode },
    { label: "Start date", value: formatDate(student.enrollment_date) },
    { label: "Status", value: student.status },
    { label: "Intake month", value: student.intake_month },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-ink-faint">{label}</p>
          <p className="mt-0.5 text-sm text-ink capitalize">{value || "-"}</p>
        </div>
      ))}
    </div>
  );
}
