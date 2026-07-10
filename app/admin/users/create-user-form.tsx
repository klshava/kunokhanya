"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createStaffLoginAction, type CreateUserState } from "./actions";
import { NewUserBanner } from "./new-user-banner";
import type { Staff } from "@/lib/database.types";

const initialState: CreateUserState = {};

export function CreateUserForm({ unlinkedStaff }: { unlinkedStaff: Staff[] }) {
  const [state, formAction, pending] = useActionState(createStaffLoginAction, initialState);

  if (state.success && state.loginEmail && state.password) {
    return (
      <NewUserBanner
        staffName={state.staffName ?? ""}
        loginEmail={state.loginEmail}
        password={state.password}
        emailed={!!state.emailed}
        phoneNumber={state.phoneNumber}
        moodleUsername={state.moodleUsername}
        moodleLoginUrl={state.moodleLoginUrl}
      />
    );
  }

  if (unlinkedStaff.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Every staff record already has a login. Add a new person under Staff Records first, then come back here to
        grant them access.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
      <FormField label="Staff member" htmlFor="staff_id" required className="min-w-[220px] flex-1">
        <Select name="staff_id">
          <SelectTrigger id="staff_id">
            <SelectValue placeholder="Select a staff member" />
          </SelectTrigger>
          <SelectContent>
            {unlinkedStaff.map((s) => (
              <SelectItem key={s.staff_id} value={s.staff_id}>
                {[s.title, s.first_name, s.last_name].filter(Boolean).join(" ")}
                {s.position ? ` -- ${s.position}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Role" htmlFor="role" required className="min-w-[180px]">
        <Select name="role" defaultValue="registrar">
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="registrar">Registrar</SelectItem>
            <SelectItem value="facilitator">Facilitator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      {state.error && <p className="w-full rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{state.error}</p>}

      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Creating..." : "Grant access"}
      </Button>
    </form>
  );
}
