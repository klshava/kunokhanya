"use client";

import { useActionState } from "react";
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
import type { Staff } from "@/lib/database.types";
import type { FormActionState } from "../students/actions";

const initialState: FormActionState = {};

export function StaffForm({
  staff,
  action,
  submitLabel,
}: {
  staff?: Staff;
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField label="Title" htmlFor="title">
          <Input id="title" name="title" defaultValue={staff?.title ?? ""} placeholder="Mr, Mrs, Dr..." />
        </FormField>
        <FormField label="Position" htmlFor="position">
          <Input id="position" name="position" defaultValue={staff?.position ?? ""} />
        </FormField>

        <FormField label="First name" htmlFor="first_name" required>
          <Input id="first_name" name="first_name" defaultValue={staff?.first_name} required />
        </FormField>
        <FormField label="Last name" htmlFor="last_name" required>
          <Input id="last_name" name="last_name" defaultValue={staff?.last_name} required />
        </FormField>

        <FormField label="Phone number" htmlFor="phone_number">
          <Input id="phone_number" name="phone_number" defaultValue={staff?.phone_number ?? ""} />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={staff?.email ?? ""} />
        </FormField>

        <FormField label="ID / passport number" htmlFor="id_number">
          <Input id="id_number" name="id_number" defaultValue={staff?.id_number ?? ""} />
        </FormField>
        <FormField label="Nationality" htmlFor="nationality">
          <Input id="nationality" name="nationality" defaultValue={staff?.nationality ?? ""} />
        </FormField>

        <FormField label="Date of birth" htmlFor="date_of_birth">
          <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={staff?.date_of_birth ?? ""} />
        </FormField>
        <FormField label="Gender" htmlFor="gender">
          <Select name="gender" defaultValue={staff?.gender ?? undefined}>
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

        <FormField label="Home language" htmlFor="home_language">
          <Input id="home_language" name="home_language" defaultValue={staff?.home_language ?? ""} />
        </FormField>

        <FormField label="Address" htmlFor="address" className="sm:col-span-2">
          <Textarea id="address" name="address" defaultValue={staff?.address ?? ""} rows={2} />
        </FormField>

        <FormField label="Next of kin name" htmlFor="next_of_kin_name">
          <Input id="next_of_kin_name" name="next_of_kin_name" defaultValue={staff?.next_of_kin_name ?? ""} />
        </FormField>
        <FormField label="Next of kin number" htmlFor="next_of_kin_number">
          <Input
            id="next_of_kin_number"
            name="next_of_kin_number"
            defaultValue={staff?.next_of_kin_number ?? ""}
          />
        </FormField>

        <div className="flex items-center gap-2.5 pt-2">
          <Checkbox id="is_active" name="is_active" defaultChecked={staff?.is_active ?? true} />
          <Label htmlFor="is_active">Currently employed</Label>
        </div>
      </section>

      {state.error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}
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
