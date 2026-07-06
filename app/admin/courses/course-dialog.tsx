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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Course } from "@/lib/database.types";
import type { FormActionState } from "../students/actions";
import { Plus, Pencil } from "lucide-react";

const initialState: FormActionState = {};

export function CourseDialog({
  course,
  action,
}: {
  course?: Course;
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
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
        {course ? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        ) : (
          <Button variant="brand">
            <Plus className="h-4 w-4" />
            Add course
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? "Edit course" : "Add a course"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <FormField label="Course name" htmlFor="course_name" required>
            <Input id="course_name" name="course_name" defaultValue={course?.course_name} required />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration (months)" htmlFor="duration_months">
              <Input
                id="duration_months"
                name="duration_months"
                type="number"
                min="1"
                defaultValue={course?.duration_months ?? undefined}
              />
            </FormField>
            <FormField label="Study mode" htmlFor="study_mode">
              <Select name="study_mode" defaultValue={course?.study_mode ?? "full-time"}>
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

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Registration fee" htmlFor="registration_fee" required>
              <Input
                id="registration_fee"
                name="registration_fee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={course?.registration_fee ?? 0}
                required
              />
            </FormField>
            <FormField label="Monthly fee" htmlFor="monthly_fee" required>
              <Input
                id="monthly_fee"
                name="monthly_fee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={course?.monthly_fee ?? 0}
                required
              />
            </FormField>
            <FormField label="Total fee" htmlFor="total_fee" required>
              <Input
                id="total_fee"
                name="total_fee"
                type="number"
                step="0.01"
                min="0"
                defaultValue={course?.total_fee ?? 0}
                required
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2.5">
            <Checkbox id="is_active" name="is_active" defaultChecked={course?.is_active ?? true} />
            <Label htmlFor="is_active">Active (visible when registering new students)</Label>
          </div>

          {state.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={pending}>
              {pending ? "Saving..." : course ? "Save changes" : "Add course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
