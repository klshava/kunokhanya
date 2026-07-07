"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { deleteStudentAction } from "../actions";
import { Trash2 } from "lucide-react";

export function DeleteStudentDialog({
  studentId,
  studentName,
  hasPortalAccount,
}: {
  studentId: string;
  studentName: string;
  hasPortalAccount: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = confirmText.trim() === studentName.trim();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteStudentAction(studentId);
      if (result?.error) {
        setError(result.error);
      }
      // On success the action redirects to /admin/students itself.
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setConfirmText("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="danger" size="sm">
          <Trash2 className="h-4 w-4" />
          Delete student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {studentName}?</DialogTitle>
          <DialogDescription>
            This permanently removes the student record and their entire payment history
            {hasPortalAccount ? ", and deletes their portal login" : ""}. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <FormField label={`Type "${studentName}" to confirm`} htmlFor="confirm_name">
          <Input
            id="confirm_name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </FormField>

        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" disabled={!canDelete || isPending} onClick={handleDelete}>
            {isPending ? "Deleting..." : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
