"use client";

import { useActionState, useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { addResultAction, type AddResultState } from "./actions";
import { Plus } from "lucide-react";

const initialState: AddResultState = {};

export function AddResultDialog({
  studentId,
  courseId,
  studentName,
  existingModules,
}: {
  studentId: string;
  courseId: string;
  studentName: string;
  existingModules: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addResultAction, initialState);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  const datalistId = `modules-${studentId}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Add result
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add result for {studentName}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="student_id" value={studentId} />
          <input type="hidden" name="course_id" value={courseId} />

          <FormField label="Module / unit standard" htmlFor="module_name" required>
            <Input id="module_name" name="module_name" list={datalistId} required autoComplete="off" />
            <datalist id={datalistId}>
              {existingModules.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </FormField>

          <FormField label="Outcome" htmlFor="outcome" required>
            <Select name="outcome" defaultValue="competent">
              <SelectTrigger id="outcome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="competent">Competent</SelectItem>
                <SelectItem value="not_yet_competent">Not Yet Competent</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Date assessed" htmlFor="assessed_date" required>
            <Input
              id="assessed_date"
              name="assessed_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </FormField>

          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={2} placeholder="Optional -- e.g. re-assessment date" />
          </FormField>

          {state.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={pending}>
              {pending ? "Saving..." : "Save result"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
