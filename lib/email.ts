import "server-only";
import { Resend } from "resend";

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
}: {
  to: string;
  fullName: string;
  loginEmail: string;
  password: string;
  loginUrl: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your Kunokhanya Training Academy student portal login",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0F766E;">Welcome to Kunokhanya Training Academy</h2>
        <p>Hi ${fullName},</p>
        <p>Your student portal account is ready. Here are your login details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
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
            Go to student portal
          </a>
        </p>
        <p style="color: #6E6E73; font-size: 13px; margin-top: 24px;">
          If you have any trouble logging in, contact the academy office.
        </p>
      </div>
    `,
  });
}
