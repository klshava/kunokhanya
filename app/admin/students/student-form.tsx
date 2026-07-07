"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { validateSAId } from "@/lib/sa-id";
import type { Course, Student } from "@/lib/database.types";
import type { FormActionState } from "./actions";
import { suggestStudentNumberAction } from "./actions";

const initialState: FormActionState = {};

export function StudentForm({
  courses,
  student,
  suggestedStudentNumber,
  action,
  submitLabel,
}: {
  courses: Course[];
  student?: Student;
  suggestedStudentNumber?: string;
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);
  const [idNumber, setIdNumber] = useState(student?.id_number ?? "");
  const [idHint, setIdHint] = useState<string | null>(null);
  const [dob, setDob] = useState(student?.date_of_birth ?? "");
  const [gender, setGender] = useState(student?.gender ?? "");
  const [intakeMonth, setIntakeMonth] = useState(student?.intake_month ?? "");
  const [enrollmentDate, setEnrollmentDate] = useState(
    student?.enrollment_date ?? new Date().toISOString().slice(0, 10)
  );
  const [studentNumber, setStudentNumber] = useState(suggestedStudentNumber ?? "");
  const [studentNumberEdited, setStudentNumberEdited] = useState(false);
  const enrollmentYear = enrollmentDate.slice(0, 4);

  useEffect(() => {
    if (student || studentNumberEdited || !/^\d{4}$/.test(enrollmentYear)) return;
    let cancelled = false;
    suggestStudentNumberAction(enrollmentYear).then((num) => {
      if (!cancelled) setStudentNumber(num);
    });
    return () => {
      cancelled = true;
    };
  }, [enrollmentYear, studentNumberEdited, student]);

  function handleIdBlur() {
    if (/^\d{13}$/.test(idNumber)) {
      const result = validateSAId(idNumber);
      if (result.valid) {
        setDob(result.dateOfBirth ?? dob);
        setGender(result.gender ?? gender);
        setIdHint("Looks like a valid SA ID. Date of birth and gender filled in automatically.");
      } else {
        setIdHint(result.reason ?? "This does not look like a valid SA ID number.");
      }
    } else {
      setIdHint(null);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="full_name" required className="sm:col-span-2">
          <Input id="full_name" name="full_name" defaultValue={student?.full_name} required />
        </FormField>

        <FormField
          label="ID / passport number"
          htmlFor="id_number"
          required
          hint={idHint ?? "13-digit SA ID numbers are checked automatically."}
        >
          <Input
            id="id_number"
            name="id_number"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            onBlur={handleIdBlur}
            required
          />
        </FormField>

        <FormField label="Date of birth" htmlFor="date_of_birth">
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            value={dob ?? ""}
            onChange={(e) => setDob(e.target.value)}
          />
        </FormField>

        <FormField label="Gender" htmlFor="gender">
          <Select name="gender" value={gender ?? undefined} onValueChange={setGender}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Contact number" htmlFor="contact_number" required>

          <Input id="contact_number" name="contact_number" defaultValue={student?.contact_number ?? ""} required />
        </FormField>

        <FormField label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={student?.email ?? ""} />
        </FormField>

        <FormField label="Physical address" htmlFor="physical_address" className="sm:col-span-2">
          <Textarea
            id="physical_address"
            name="physical_address"
            defaultValue={student?.physical_address ?? ""}
            rows={2}
          />
        </FormField>

        <FormField label="Emergency contact name" htmlFor="emergency_contact_name">
          <Input
            id="emergency_contact_name"
            name="emergency_contact_name"
            defaultValue={student?.emergency_contact_name ?? ""}
          />
        </FormField>

        <FormField label="Emergency contact number" htmlFor="emergency_contact_number">
          <Input
            id="emergency_contact_number"
            name="emergency_contact_number"
            defaultValue={student?.emergency_contact_number ?? ""}
          />
        </FormField>
      </section>

      <section className="grid grid-cols-1 gap-5 border-t border-border-soft pt-6 sm:grid-cols-2">
        {!student && (
          <FormField
            label="Student number"
            htmlFor="student_number"
            required
            hint="Auto-suggested based on the next available number for the enrollment year. Editable if needed."
          >
            <Input
              id="student_number"
              name="student_number"
              value={studentNumber}
              onChange={(e) => {
                setStudentNumber(e.target.value);
                setStudentNumberEdited(true);
              }}
              required
            />
          </FormField>
        )}

        <FormField label="Course" htmlFor="course_id" required>
          <Select name="course_id" defaultValue={student?.course_id ?? undefined}>
            <SelectTrigger id="course_id">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.course_id} value={c.course_id}>
                  {c.course_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Study mode" htmlFor="study_mode" required>
          <Select name="study_mode" defaultValue={student?.study_mode ?? "full-time"}>
            <SelectTrigger id="study_mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full time</SelectItem>
              <SelectItem value="part-time">Part time</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Start date" htmlFor="enrollment_date" required>
          <Input
            id="enrollment_date"
            name="enrollment_date"
            type="date"
            value={enrollmentDate}
            onChange={(e) => setEnrollmentDate(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Intake month" htmlFor="intake_month">
          <Select
            name="intake_month"
            value={intakeMonth}
            onValueChange={(v) => setIntakeMonth(v === "unset" ? "" : v)}
          >
            <SelectTrigger id="intake_month">
              <SelectValue placeholder="Select intake month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">Not set</SelectItem>
              {[
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December",
              ].map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Status" htmlFor="status" required>
          <Select name="status" defaultValue={student?.status ?? "active"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Source" htmlFor="source">
          <Select name="source" defaultValue={student?.source ?? "walk-in"}>
            <SelectTrigger id="source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">Walk-in</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="wordpress">WordPress lead</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <div className="flex items-center gap-2.5 pt-6">
          <Checkbox
            id="registration_fee_paid"
            name="registration_fee_paid"
            defaultChecked={student?.registration_fee_paid ?? false}
          />
          <Label htmlFor="registration_fee_paid">Registration fee paid</Label>
        </div>
      </section>

      {state.error && (
        <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-xl bg-success-soft px-3.5 py-2.5 text-sm text-success">Saved.</p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
