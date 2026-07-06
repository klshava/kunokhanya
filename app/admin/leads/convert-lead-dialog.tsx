"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { convertLeadToStudentAction } from "./actions";
import type { FormActionState } from "../students/actions";
import type { Course } from "@/lib/database.types";
import { UserCheck } from "lucide-react";

const initialState: FormActionState = {};

export function ConvertLeadDialog({
  lead,
  courses,
}: {
  lead: { lead_id: string; full_name: string; email: string | null; contact_number: string | null };
  courses: Course[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(convertLeadToStudentAction, initialState);
  const armedRef = useRef(false);

  useEffect(() => {
    if (state.success && armedRef.current) {
      armedRef.current = false;
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) armedRef.current = true;
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="brand" size="sm">
          <UserCheck className="h-4 w-4" />
          Convert to student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert lead to student</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="lead_id" value={lead.lead_id} />
          <FormField label="Full name" htmlFor="full_name" required>
            <Input id="full_name" name="full_name" defaultValue={lead.full_name} required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" htmlFor="email">
              <Input id="email" name="email" type="email" defaultValue={lead.email ?? ""} />
            </FormField>
            <FormField label="Contact number" htmlFor="contact_number">
              <Input id="contact_number" name="contact_number" defaultValue={lead.contact_number ?? ""} />
            </FormField>
          </div>
          <FormField label="ID / passport number" htmlFor="id_number" required>
            <Input id="id_number" name="id_number" required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Course" htmlFor="course_id" required>
              <Select name="course_id">
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
              <Select name="study_mode" defaultValue="full-time">
                <SelectTrigger id="study_mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full time</SelectItem>
                  <SelectItem value="part-time">Part time</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {state.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={pending}>
              {pending ? "Converting..." : "Create student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
