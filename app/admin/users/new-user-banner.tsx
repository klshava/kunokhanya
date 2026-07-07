"use client";

import { Button } from "@/components/ui/button";
import { whatsAppLink } from "@/lib/phone";
import { MessageCircle, Mail, CheckCircle2 } from "lucide-react";

export function NewUserBanner({
  staffName,
  loginEmail,
  password,
  emailed,
  phoneNumber,
}: {
  staffName: string;
  loginEmail: string;
  password: string;
  emailed: boolean;
  phoneNumber?: string | null;
}) {
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
  const message =
    `Hi ${staffName}, you've been granted access to the Kunokhanya admin system. ` +
    `Your login:\nEmail: ${loginEmail}\nPassword: ${password}\n` +
    `Login here: ${loginUrl}`;

  return (
    <div className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
      <p className="font-medium">Login created. Share these details with {staffName}:</p>
      <p className="mt-1 text-ink">
        Login: <span className="font-semibold">{loginEmail}</span> &middot; Password:{" "}
        <span className="font-semibold">{password}</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {emailed ? (
          <span className="inline-flex items-center gap-1.5 text-ink-soft">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Emailed to {loginEmail}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-ink-soft">
            <Mail className="h-4 w-4" />
            Could not email {loginEmail} automatically -- share the details above manually.
          </span>
        )}

        {phoneNumber && (
          <a href={whatsAppLink(phoneNumber, message)} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" />
              Send login via WhatsApp
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
