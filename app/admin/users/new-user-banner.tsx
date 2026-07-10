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
  moodleUsername,
  moodleLoginUrl,
}: {
  staffName: string;
  loginEmail: string;
  password: string;
  emailed: boolean;
  phoneNumber?: string | null;
  /** Only set when a matching Moodle account was actually created. */
  moodleUsername?: string | null;
  moodleLoginUrl?: string | null;
}) {
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
  const hasMoodle = !!(moodleUsername && moodleLoginUrl);
  const message =
    `Hi ${staffName}, you've been granted access to the Kunokhanya admin system. Your logins (same password for both):\n\n` +
    `Student Central (admin system)\nLogin: ${loginEmail}\nPassword: ${password}\nLink: ${loginUrl}` +
    (hasMoodle
      ? `\n\nMoodle (course material)\nLogin: ${moodleUsername}\nPassword: ${password}\nLink: ${moodleLoginUrl}`
      : "");

  return (
    <div className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
      <p className="font-medium">
        {hasMoodle ? "Logins are ready" : "Login is ready"}. Share these details with {staffName}:
      </p>

      <div className="mt-2 rounded-lg bg-white/50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Student Central (admin system)</p>
        <p className="mt-0.5 text-ink">
          Login: <span className="font-semibold">{loginEmail}</span> &middot; Password:{" "}
          <span className="font-semibold">{password}</span>
        </p>
      </div>

      {hasMoodle && (
        <div className="mt-2 rounded-lg bg-white/50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Moodle (course material)</p>
          <p className="mt-0.5 text-ink">
            Login: <span className="font-semibold">{moodleUsername}</span> &middot; Password:{" "}
            <span className="font-semibold">{password}</span>
          </p>
        </div>
      )}

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
