"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { inviteStudentToPortalAction } from "../actions";
import { KeyRound } from "lucide-react";

export function InviteButton({ studentId }: { studentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      // On success this server action redirects to the ?created=1 banner, so
      // we only ever handle the error case back here.
      const res = await inviteStudentToPortalAction(studentId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-sm text-danger">{error}</span>}
      <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
        <KeyRound className="h-4 w-4" />
        {isPending ? "Creating..." : "Send portal login"}
      </Button>
    </div>
  );
}
