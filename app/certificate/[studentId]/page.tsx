import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/currency";
import { PrintButton } from "./print-button";

export default async function CertificatePrintPage({
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

  const isStaff = profile?.role === "admin" || profile?.role === "registrar" || profile?.role === "facilitator";
  const isOwnRecord = profile?.linked_student_id === studentId;

  if (!isStaff && !isOwnRecord) {
    redirect(profile?.role === "student" ? "/portal" : "/admin");
  }

  const { data: student } = await supabase
    .from("students")
    .select("full_name, student_number, status, courses(course_name)")
    .eq("student_id", studentId)
    .single();

  if (!student) notFound();

  if (student.status !== "completed") {
    return (
      <div className="mx-auto max-w-lg px-8 py-16 text-center text-ink">
        <h1 className="text-lg font-semibold">Certificate not yet available</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {student.full_name} has not been marked as completed yet. A certificate becomes available here once
          their status changes to "Completed".
        </p>
      </div>
    );
  }

  const { data: results } = await supabase
    .from("results")
    .select("module_name, outcome, assessed_date")
    .eq("student_id", studentId)
    .order("assessed_date", { ascending: true });

  const course = student.courses as any;
  const competentResults = (results ?? []).filter((r) => r.outcome === "competent");

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

      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-brand-700">Certificate of Completion</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Certificate no. CERT-{student.student_number ?? studentId.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <div className="mb-8 text-center text-sm">
        <p className="text-ink-soft">This is to certify that</p>
        <p className="mt-2 text-xl font-semibold">{student.full_name}</p>
        <p className="mt-1 text-ink-soft">
          Student number: <span className="font-medium text-ink">{student.student_number ?? "-"}</span>
        </p>
        <p className="mt-4 text-ink-soft">has successfully completed the programme</p>
        <p className="mt-2 text-lg font-semibold">{course?.course_name ?? "-"}</p>
      </div>

      {competentResults.length > 0 && (
        <>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Modules / unit standards
          </h3>
          <table className="mb-8 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft">
                <th className="py-2 font-medium">Module</th>
                <th className="py-2 text-right font-medium">Date assessed</th>
              </tr>
            </thead>
            <tbody>
              {competentResults.map((r, i) => (
                <tr key={i} className="border-b border-border-soft">
                  <td className="py-2">{r.module_name}</td>
                  <td className="py-2 text-right">{formatDate(r.assessed_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p className="text-xs text-ink-faint">Issued on {formatDate(new Date().toISOString())}.</p>

      <p className="mt-6 text-center text-sm font-bold tracking-wide">QUALITY IN STYLE!</p>
    </div>
  );
}
