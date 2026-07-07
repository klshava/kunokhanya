import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/currency";
import { whatsAppLink } from "@/lib/phone";
import { ConvertLeadDialog } from "./convert-lead-dialog";
import { LeadStatusSelect } from "./lead-status-select";
import { MessageCircle, Inbox, PhoneCall, UserCheck, XCircle } from "lucide-react";
import type { LeadStatus } from "@/lib/database.types";

const PAGE_SIZE = 50;
const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  rejected: "Rejected",
};
const STATUS_ICONS: Record<LeadStatus, typeof Inbox> = {
  new: Inbox,
  contacted: PhoneCall,
  converted: UserCheck,
  rejected: XCircle,
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const role = await getCurrentRole();
  if (role === "facilitator") redirect("/admin");

  const params = await searchParams;
  const course = typeof params.course === "string" ? params.course : "";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1);

  const supabase = await createClient();

  // Distinct course_interested values for the filter dropdown, and a status
  // breakdown for the summary cards below — both need every row's value, so
  // fetch just those columns paginated (the table can exceed the 1,000-row cap).
  const courseValues: string[] = [];
  const statusValues: string[] = [];
  {
    let statusQuery = supabase.from("website_leads").select("course_interested,status");
    if (course) statusQuery = statusQuery.eq("course_interested", course);
    if (from) statusQuery = statusQuery.gte("submitted_at", `${from}T00:00:00`);
    if (to) statusQuery = statusQuery.lte("submitted_at", `${to}T23:59:59`);

    let offset = 0;
    while (true) {
      const { data } = await statusQuery.range(offset, offset + 999);
      const batch = data ?? [];
      courseValues.push(...batch.map((b) => b.course_interested).filter((c): c is string => !!c));
      statusValues.push(...batch.map((b) => b.status));
      if (batch.length < 1000) break;
      offset += 1000;
    }
  }
  const courseOptions = Array.from(new Set(courseValues)).sort();
  const statusCounts = statusValues.reduce(
    (acc, s) => ({ ...acc, [s]: (acc[s as LeadStatus] ?? 0) + 1 }),
    {} as Record<LeadStatus, number>
  );

  let query = supabase.from("website_leads").select("*", { count: "exact" });
  if (course) query = query.eq("course_interested", course);
  if (from) query = query.gte("submitted_at", `${from}T00:00:00`);
  if (to) query = query.lte("submitted_at", `${to}T23:59:59`);
  if (status) query = query.eq("status", status as LeadStatus);
  query = query.order("submitted_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data: leads, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("course_name");

  function pageHref(targetPage: number) {
    const p = new URLSearchParams();
    if (course) p.set("course", course);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (status) p.set("status", status);
    if (targetPage > 1) p.set("page", String(targetPage));
    const qs = p.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  }

  function statusHref(targetStatus: string) {
    const p = new URLSearchParams();
    if (course) p.set("course", course);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (targetStatus && targetStatus !== status) p.set("status", targetStatus);
    const qs = p.toString();
    return qs ? `/admin/leads?${qs}` : "/admin/leads";
  }

  return (
    <div>
      <PageHeader
        title="Website leads"
        description="Enquiries submitted through your WordPress site, ready to review and convert."
        backHref="/admin"
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => {
          const Icon = STATUS_ICONS[s];
          const active = status === s;
          return (
            <Link key={s} href={statusHref(s)}>
              <Card
                className={`p-4 transition-colors ${active ? "ring-2 ring-brand-600" : "hover:bg-background/60"}`}
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-ink-faint">{STATUS_LABELS[s]}</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight text-ink">
                  {statusCounts[s] ?? 0}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mb-6 p-4 sm:p-5">
        <form
          method="get"
          key={`${course}-${status}-${from}-${to}`}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap"
        >
          <select
            name="course"
            defaultValue={course}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="">All courses</option>
            {courseOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="">Any status</option>
            {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            From
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            To
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
            />
          </label>

          <Button type="submit" variant="outline">
            Apply filters
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Course interested</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {leads?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                    No leads match the current filters.
                  </td>
                </tr>
              )}
              {leads?.map((lead) => (
                <tr key={lead.lead_id} className="border-b border-border-soft last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{lead.full_name}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    <div>{lead.email ?? "-"}</div>
                    {lead.contact_number && (
                      <a
                        href={whatsAppLink(lead.contact_number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-ink-faint hover:text-brand-600"
                        title="Message on WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3" />
                        {lead.contact_number}
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{lead.course_interested ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft">{formatDate(lead.submitted_at)}</td>
                  <td className="px-5 py-3">
                    <LeadStatusSelect leadId={lead.lead_id} status={lead.status} />
                  </td>
                  <td className="px-5 py-3">
                    {lead.status !== "converted" && (
                      <ConvertLeadDialog lead={lead} courses={courses ?? []} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border-soft px-5 py-3 text-sm text-ink-soft">
          <span>
            {count ?? 0} lead{count === 1 ? "" : "s"} &middot; page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            ) : (
              <Link href={pageHref(page - 1)}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page >= totalPages ? (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            ) : (
              <Link href={pageHref(page + 1)}>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
