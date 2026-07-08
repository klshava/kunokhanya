"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button variant="brand" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      Print / save as PDF
    </Button>
  );
}
