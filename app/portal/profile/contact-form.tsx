"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { updateMyContactAction } from "@/app/admin/students/actions";
import type { FormActionState } from "@/app/admin/students/actions";
import type { Student } from "@/lib/database.types";

const initialState: FormActionState = {};

export function ContactForm({ student }: { student: Student }) {
  const [state, formAction, pending] = useActionState(updateMyContactAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField label="Contact number" htmlFor="contact_number" required>
        <Input id="contact_number" name="contact_number" defaultValue={student.contact_number ?? ""} required />
      </FormField>
      <FormField label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" defaultValue={student.email ?? ""} />
      </FormField>
      <FormField label="Physical address" htmlFor="physical_address">
        <Textarea id="physical_address" name="physical_address" defaultValue={student.physical_address ?? ""} rows={2} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Emergency contact name" htmlFor="emergency_contact_name">
          <Input
            id="emergency_contact_name"
            name="emergency_contact_name"
            defaultValue={student.emergency_contact_name ?? ""}
          />
        </FormField>
        <FormField label="Emergency contact number" htmlFor="emergency_contact_number">
          <Input
            id="emergency_contact_number"
            name="emergency_contact_number"
            defaultValue={student.emergency_contact_number ?? ""}
          />
        </FormField>
      </div>

      {state.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state.success && <p className="rounded-xl bg-success-soft px-3 py-2 text-sm text-success">Saved.</p>}

      <div className="flex justify-end">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
