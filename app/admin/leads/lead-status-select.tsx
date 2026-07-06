"use client";

import { useTransition } from "react";
import { updateLeadStatusAction } from "./actions";
import type { LeadStatus } from "@/lib/database.types";

const options: LeadStatus[] = ["new", "contacted", "converted", "rejected"];

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as LeadStatus;
        startTransition(() => {
          updateLeadStatusAction(leadId, next);
        });
      }}
      className="h-8 rounded-lg border border-border bg-surface px-2 text-xs capitalize text-ink"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
