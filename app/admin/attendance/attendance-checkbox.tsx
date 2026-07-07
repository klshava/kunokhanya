"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleAttendanceAction } from "./actions";

export function AttendanceCheckbox({
  studentId,
  date,
  initialPresent,
}: {
  studentId: string;
  date: string;
  initialPresent: boolean;
}) {
  const [present, setPresent] = useState(initialPresent);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    const previous = present;
    setPresent(checked);
    setFailed(false);
    startTransition(async () => {
      const result = await toggleAttendanceAction(studentId, date, checked);
      if (result.error) {
        setPresent(previous);
        setFailed(true);
      }
    });
  }

  return (
    <div className="flex justify-center" title={failed ? "Could not save -- try again" : undefined}>
      <Checkbox
        checked={present}
        onCheckedChange={(checked) => handleChange(checked === true)}
        disabled={isPending}
        aria-label={`Present on ${date}`}
        className={failed ? "border-danger" : undefined}
      />
    </div>
  );
}
