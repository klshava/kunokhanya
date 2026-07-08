"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteResultAction } from "./actions";
import type { ResultOutcome } from "@/lib/database.types";

export function ResultChip({
  resultId,
  studentId,
  moduleName,
  outcome,
}: {
  resultId: string;
  studentId: string;
  moduleName: string;
  outcome: ResultOutcome;
}) {
  const [isPending, startTransition] = useTransition();
  const isCompetent = outcome === "competent";

  function handleDelete() {
    if (!confirm(`Remove "${moduleName}" result?`)) return;
    startTransition(() => {
      deleteResultAction(resultId, studentId);
    });
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        isCompetent ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
      }`}
    >
      {moduleName}: {isCompetent ? "Competent" : "Not Yet Competent"}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="ml-0.5 rounded-full hover:opacity-70"
        aria-label={`Remove ${moduleName} result`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
