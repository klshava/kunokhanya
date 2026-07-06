"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { inviteStudentToPortalAction } from "../actions";
import { Mail } from "lucide-react";

export function InviteButton({ studentId, email }: { studentId: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleClick() {
    startTransition(async () => {
      const result = await inviteStudentToPortalAction(studentId, email);
      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: `Invite sent to ${email}` });
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className={message.type === "error" ? "text-sm text-danger" : "text-sm text-success"}>
          {message.text}
        </span>
      )}
      <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
        <Mail className="h-4 w-4" />
        {isPending ? "Sending..." : "Invite to portal"}
      </Button>
    </div>
  );
}
