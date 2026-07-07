"use client";

import { Button } from "@/components/ui/button";
import { whatsAppLink } from "@/lib/phone";
import { MessageCircle, Mail, CheckCircle2 } from "lucide-react";

export function NewLoginBanner({
  fullName,
  loginEmail,
  password,
  contactNumber,
  emailAddress,
  emailed,
}: {
  fullName: string;
  loginEmail: string;
  password: string;
  contactNumber: string | null;
  emailAddress: string | null;
  emailed: boolean;
}) {
  const studentNumber = loginEmail.split("@")[0].toUpperCase();
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";

  const message =
    `Hi ${fullName}, welcome to Kunokhanya Training Academy! ` +
    `Your student portal login:\nStudent number: ${studentNumber}\nPassword: ${password}\n` +
    `Login here: ${loginUrl}`;

  return (
    <div className="mb-6 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
      <p className="font-medium">Portal login is ready. Share these details with the student:</p>
      <p className="mt-1 text-ink">
        Login: <span className="font-semibold">{studentNumber}</span> &middot; Password:{" "}
        <span className="font-semibold">{password}</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {emailAddress ? (
          emailed ? (
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Emailed to {emailAddress}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <Mail className="h-4 w-4" />
              Could not email {emailAddress} automatically -- share the details above manually.
            </span>
          )
        ) : null}

        {contactNumber && (
          <a href={whatsAppLink(contactNumber, message)} target="_blank" rel="noopener noreferrer">
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
