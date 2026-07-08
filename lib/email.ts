import "server-only";
import { Resend } from "resend";
import { formatZAR } from "@/lib/currency";

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared "onboarding@resend.dev" sender only delivers to the
// account owner's own verified address until a custom domain is verified
// in the Resend dashboard. Verify kunokhanya.co.za there, then set
// RESEND_FROM_EMAIL to an address on that domain to email real students.
const FROM = process.env.RESEND_FROM_EMAIL || "Kunokhanya Training Academy <onboarding@resend.dev>";

export async function sendStudentCredentialsEmail({
  to,
  fullName,
  loginEmail,
  password,
  loginUrl,
  moodleUsername,
  moodleLoginUrl,
}: {
  to: string;
  fullName: string;
  loginEmail: string;
  password: string;
  loginUrl: string;
  /** Only set when a matching Moodle account was actually created -- omit to send the Student Central-only email. */
  moodleUsername?: string;
  moodleLoginUrl?: string;
}) {
  const hasMoodle = !!(moodleUsername && moodleLoginUrl);

  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your Kunokhanya Training Academy logins",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0F766E;">Welcome to Kunokhanya Training Academy</h2>
        <p>Hi ${fullName},</p>
        <p>Your account${hasMoodle ? "s are" : " is"} ready. The password below is the same${hasMoodle ? " for both logins" : ""}.</p>

        <h3 style="color: #0F766E; margin-bottom: 4px;">Student Central (fees, results, certificate)</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 8px 0 16px;">
          <tr>
            <td style="padding: 8px 0; color: #6E6E73;">Login (student number)</td>
            <td style="padding: 8px 0; font-weight: 600;">${loginEmail.split("@")[0].toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6E6E73;">Password</td>
            <td style="padding: 8px 0; font-weight: 600;">${password}</td>
          </tr>
        </table>
        <p>
          <a href="${loginUrl}" style="display: inline-block; background: #0F766E; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 600;">
            Go to Student Central
          </a>
        </p>

        ${
          hasMoodle
            ? `
        <h3 style="color: #0F766E; margin: 24px 0 4px;">Moodle (course learning material)</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 8px 0 16px;">
          <tr>
            <td style="padding: 8px 0; color: #6E6E73;">Login (student number)</td>
            <td style="padding: 8px 0; font-weight: 600;">${moodleUsername}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6E6E73;">Password</td>
            <td style="padding: 8px 0; font-weight: 600;">${password}</td>
          </tr>
        </table>
        <p>
          <a href="${moodleLoginUrl}" style="display: inline-block; background: #0F766E; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 600;">
            Go to Moodle
          </a>
        </p>
        `
            : ""
        }

        <p style="color: #6E6E73; font-size: 13px; margin-top: 24px;">
          If you have any trouble logging in, contact the academy office.
        </p>
      </div>
    `,
  });
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  registrar: "Registrar",
  facilitator: "Facilitator",
};

export async function sendStaffCredentialsEmail({
  to,
  fullName,
  loginEmail,
  password,
  role,
  loginUrl,
}: {
  to: string;
  fullName: string;
  loginEmail: string;
  password: string;
  role: string;
  loginUrl: string;
}) {
  const roleLabel = ROLE_LABELS[role] ?? role;
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your Kunokhanya Training Academy admin login",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0F766E;">Welcome to Kunokhanya Training Academy</h2>
        <p>Hi ${fullName},</p>
        <p>You've been granted <strong>${roleLabel}</strong> access to the Kunokhanya admin system. Here are your login details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6E6E73;">Login</td>
            <td style="padding: 8px 0; font-weight: 600;">${loginEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6E6E73;">Password</td>
            <td style="padding: 8px 0; font-weight: 600;">${password}</td>
          </tr>
        </table>
        <p>
          <a href="${loginUrl}" style="display: inline-block; background: #0F766E; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 600;">
            Go to the admin login
          </a>
        </p>
        <p style="color: #6E6E73; font-size: 13px; margin-top: 24px;">
          If you have any trouble logging in, contact the academy office.
        </p>
      </div>
    `,
  });
}

export async function sendFeeReminderEmail({
  to,
  fullName,
  balance,
  loginUrl,
}: {
  to: string;
  fullName: string;
  balance: number;
  loginUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reminder: outstanding fees at Kunokhanya Training Academy",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0F766E;">Kunokhanya Training Academy</h2>
        <p>Hi ${fullName},</p>
        <p>This is a friendly reminder that you currently have an outstanding balance of:</p>
        <p style="font-size: 22px; font-weight: 700; color: #0F766E; margin: 16px 0;">${formatZAR(balance)}</p>
        <p>You can settle this by EFT using the details below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 6px 0; color: #6E6E73;">Account Holder</td>
            <td style="padding: 6px 0; font-weight: 600;">Kunokhanya Trading and Projects</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6E6E73;">FNB Account Number</td>
            <td style="padding: 6px 0; font-weight: 600;">62553253784</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6E6E73;">Reference</td>
            <td style="padding: 6px 0; font-weight: 600;">Your Name and Surname</td>
          </tr>
        </table>
        <p>
          <a href="${loginUrl}" style="display: inline-block; background: #0F766E; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-weight: 600;">
            View your fee statement
          </a>
        </p>
        <p style="color: #6E6E73; font-size: 13px; margin-top: 24px;">
          If you have already paid or believe this is a mistake, contact the academy office.
        </p>
      </div>
    `,
  });
}
