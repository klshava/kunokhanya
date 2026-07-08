import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatZAR, formatDate } from "@/lib/currency";
import { PrintButton } from "./print-button";

export default async function FeeStatementPrintPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, linked_student_id")
    .eq("id", user.id)
    .single();

  // Fee statements are financial info -- admin and registrar both have full
  // financial visibility, facilitator does not (matches the RLS model).
  const canSeeFinance = profile?.role === "admin" || profile?.role === "registrar";
  const isOwnRecord = profile?.linked_student_id === studentId;

  if (!canSeeFinance && !isOwnRecord) {
    redirect(profile?.role === "student" ? "/portal" : "/admin");
  }

  const { data: student } = await supabase
    .from("students")
    .select("*, courses(*)")
    .eq("student_id", studentId)
    .single();

  if (!student) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .order("payment_date", { ascending: true });

  const course = student.courses as any;
  const registrationFee = Number(student.registration_fee_override ?? course?.registration_fee ?? 0);
  const totalFee = Number(student.total_fee_override ?? course?.total_fee ?? 0);
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalFee - totalPaid;

  return (
    <div className="mx-auto max-w-2xl bg-white px-8 py-10 text-ink">
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      <div className="mb-8 flex items-start justify-between border-b border-border-soft pb-6">
        <div className="text-sm text-ink-soft">
          <p>30 Von Brandis &amp; Cnr Main Streets</p>
          <p>Blooms Building</p>
          <p>Johannesburg CBD</p>
          <p className="mt-1">Tel: (011) 331 0205 / 082 3469 676</p>
          <p>Email: kunokukhanya@safrica.com</p>
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold tracking-tight">KUNOKHANYA TRAINING ACADEMY</h1>
          <Image src="/logo.png" alt="Kunokhanya Training Academy" width={72} height={75} className="mx-auto my-2" />
          <p className="text-xs text-ink-soft">HWSETA Reg: HW591PA166719</p>
          <p className="text-xs text-ink-soft">QCTO Number: 07-QCTO/SDP130623135748</p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between text-sm">
        <h2 className="font-semibold uppercase tracking-wide">Fee statement</h2>
        <p className="text-ink-soft">
          <span className="font-semibold">Date: </span>
          {formatDate(new Date().toISOString())}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-ink-faint">Student</p>
          <p className="font-medium">{student.full_name}</p>
        </div>
        <div>
          <p className="text-ink-faint">Student number</p>
          <p className="font-medium">{student.student_number ?? "-"}</p>
        </div>
        <div>
          <p className="text-ink-faint">Course</p>
          <p className="font-medium">{course?.course_name ?? "-"}</p>
        </div>
        <div>
          <p className="text-ink-faint">Study mode</p>
          <p className="font-medium capitalize">{student.study_mode}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl border border-border-soft p-5 text-sm sm:grid-cols-4">
        <div>
          <p className="text-ink-faint">Registration fee</p>
          <p className="font-semibold">{formatZAR(registrationFee)}</p>
        </div>
        <div>
          <p className="text-ink-faint">Monthly fee</p>
          <p className="font-semibold">{formatZAR(course?.monthly_fee)}</p>
        </div>
        <div>
          <p className="text-ink-faint">Total fee</p>
          <p className="font-semibold">{formatZAR(totalFee)}</p>
        </div>
        <div>
          <p className="text-ink-faint">Balance outstanding</p>
          <p className="font-semibold">{formatZAR(balance)}</p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">Payment history</h2>
      <table className="mb-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-soft">
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 font-medium">Method</th>
            <th className="py-2 font-medium">Receipt no.</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(payments ?? []).map((p) => (
            <tr key={p.payment_id} className="border-b border-border-soft">
              <td className="py-2">{formatDate(p.payment_date)}</td>
              <td className="py-2">{p.payment_method ?? "-"}</td>
              <td className="py-2">{p.receipt_number ?? "-"}</td>
              <td className="py-2 text-right">{formatZAR(p.amount)}</td>
            </tr>
          ))}
          {(payments ?? []).length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-center text-ink-faint">
                No payments recorded
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="pt-3 text-right font-semibold">
              Total paid
            </td>
            <td className="pt-3 text-right font-semibold">{formatZAR(totalPaid)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="text-xs text-ink-faint">
        This statement was generated on {formatDate(new Date().toISOString())}. For queries, contact the academy
        office.
      </p>

      <div className="mx-auto mt-6 max-w-sm rounded-xl border border-brand-600/40 px-5 py-3 text-center text-sm">
        <p className="font-semibold underline">BANKING DETAILS</p>
        <p>Account Holder: Kunokhanya Trading and Projects</p>
        <p>FNB Account Number: 62553253784</p>
        <p>Reference: Your Name and Surname</p>
      </div>

      <p className="mt-6 text-center text-sm font-bold tracking-wide">QUALITY IN STYLE!</p>
    </div>
  );
}
