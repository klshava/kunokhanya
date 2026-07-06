"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { addPaymentAction, type FormActionState } from "../actions";
import { Plus } from "lucide-react";

const initialState: FormActionState = {};

export function AddPaymentDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = addPaymentAction.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
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
        <Button variant="brand" size="sm">
          <Plus className="h-4 w-4" />
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>This is added to the student's payment history immediately.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount (ZAR)" htmlFor="amount" required>
              <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
            </FormField>
            <FormField label="Payment date" htmlFor="payment_date" required>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </FormField>
          </div>
          <FormField label="Payment method" htmlFor="payment_method">
            <Input id="payment_method" name="payment_method" placeholder="Cash, EFT, card..." />
          </FormField>
          <FormField label="Receipt number" htmlFor="receipt_number">
            <Input id="receipt_number" name="receipt_number" />
          </FormField>
          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={2} />
          </FormField>

          {state.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={pending}>
              {pending ? "Saving..." : "Save payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
