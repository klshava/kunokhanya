"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { MessageCircle, GraduationCap, Mail } from "lucide-react";
import { whatsAppLink } from "@/lib/phone";
import { bulkMarkCompletedAction, bulkSendFeeRemindersAction } from "./bulk-actions";

const statusVariant = {
  active: "success",
  completed: "brand",
  withdrawn: "neutral",
} as const;

type StudentRow = {
  student_id: string;
  student_number: string | null;
  full_name: string;
  id_number: string | null;
  contact_number: string | null;
  study_mode: string;
  status: string;
  courses?: { course_name: string; duration_months: number | null } | null;
  course_name?: string | null;
  payments_made?: number;
};

/** "5/13" progress -- 12-month course + 1 registration-fee payment = 13 total. */
function paymentsFraction(s: StudentRow): string {
  const durationMonths = s.courses?.duration_months;
  if (durationMonths == null) return "-";
  return `${s.payments_made ?? 0}/${durationMonths + 1}`;
}

export function StudentsTable({
  students,
  error,
  canBulkAct,
  canSeeFinance,
}: {
  students: StudentRow[];
  error: string | null;
  canBulkAct: boolean;
  canSeeFinance: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [completeOpen, setCompleteOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const allSelected = students.length > 0 && students.every((s) => selected.has(s.student_id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s.student_id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleMarkCompleted() {
    const ids = Array.from(selected);
    startTransition(async () => {
      const result = await bulkMarkCompletedAction(ids);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: `Marked ${result.count} student${result.count === 1 ? "" : "s"} as completed.` });
        setSelected(new Set());
      }
      setCompleteOpen(false);
    });
  }

  function handleSendReminders() {
    const ids = Array.from(selected);
    startTransition(async () => {
      const result = await bulkSendFeeRemindersAction(ids);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        const parts = [`Sent ${result.sent} reminder${result.sent === 1 ? "" : "s"}`];
        if (result.skippedNoBalance) parts.push(`${result.skippedNoBalance} skipped (no balance owing)`);
        if (result.skippedNoEmail) parts.push(`${result.skippedNoEmail} skipped (no email on file)`);
        if (result.failed) parts.push(`${result.failed} failed to send`);
        setMessage({ type: "success", text: `${parts.join(" · ")}.` });
        setSelected(new Set());
      }
      setReminderOpen(false);
    });
  }

  return (
    <div>
      {message && (
        <div
          className={`mb-4 rounded-xl px-3.5 py-2.5 text-sm ${
            message.type === "error" ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
          }`}
        >
          {message.text}
        </div>
      )}

      {canBulkAct && selected.size > 0 && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-sm font-medium text-ink">{selected.size} selected</span>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompleteOpen(true)}>
              <GraduationCap className="h-4 w-4" />
              Mark as completed
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReminderOpen(true)}>
              <Mail className="h-4 w-4" />
              Send fee reminders
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                {canBulkAct && (
                  <th className="w-10 px-5 py-3">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                  </th>
                )}
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Student no.</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">{canSeeFinance ? "Payments" : "Mode"}</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-danger">
                    Could not load students: {error}
                  </td>
                </tr>
              )}
              {!error && students.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-ink-soft">
                    No students match your search.{" "}
                    {canBulkAct ? (
                      <>
                        Try adjusting the filters, or{" "}
                        <Link href="/admin/students/new" className="text-brand-600 underline">
                          register a new student
                        </Link>
                        .
                      </>
                    ) : (
                      "Try adjusting the filters."
                    )}
                  </td>
                </tr>
              )}
              {students.map((s) => (
                <tr
                  key={s.student_id}
                  className="border-b border-border-soft last:border-0 hover:bg-background/60"
                >
                  {canBulkAct && (
                    <td className="px-5 py-3">
                      <Checkbox
                        checked={selected.has(s.student_id)}
                        onCheckedChange={() => toggleOne(s.student_id)}
                        aria-label={`Select ${s.full_name}`}
                      />
                    </td>
                  )}
                  <td className="px-5 py-3">
                    <Link href={`/admin/students/${s.student_id}`} className="font-medium text-ink hover:text-brand-600">
                      {s.full_name}
                    </Link>
                    <p className="text-xs text-ink-faint">{s.id_number}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{s.student_number ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft">{s.courses?.course_name ?? s.course_name ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {canSeeFinance ? paymentsFraction(s) : <span className="capitalize">{s.study_mode}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant[s.status as keyof typeof statusVariant] ?? "neutral"} className="capitalize">
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {s.contact_number ? (
                      <a
                        href={whatsAppLink(s.contact_number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-brand-600"
                        title="Message on WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {s.contact_number}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark {selected.size} student{selected.size === 1 ? "" : "s"} as completed?</DialogTitle>
            <DialogDescription>
              This updates their status to "Completed". You can change it back individually later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="brand" disabled={isPending} onClick={handleMarkCompleted}>
              {isPending ? "Updating..." : "Mark as completed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send fee reminders to {selected.size} student{selected.size === 1 ? "" : "s"}?</DialogTitle>
            <DialogDescription>
              Emails each student their actual outstanding balance and banking details. Students with no balance
              owing or no email on file are automatically skipped.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReminderOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="brand" disabled={isPending} onClick={handleSendReminders}>
              {isPending ? "Sending..." : "Send reminders"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
