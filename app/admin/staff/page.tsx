import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { whatsAppLink } from "@/lib/phone";
import { UserPlus, MessageCircle } from "lucide-react";

export default async function StaffListPage() {
  const role = await getCurrentRole();
  if (role === "facilitator") redirect("/admin");

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .order("last_name");

  return (
    <div>
      <PageHeader
        title="Staff records"
        description="Everyone currently and previously employed at the academy."
        backHref="/admin"
        actions={
          <Link href="/admin/staff/new">
            <Button variant="brand">
              <UserPlus className="h-4 w-4" />
              Add staff member
            </Button>
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Position</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {staff?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-ink-soft">
                    No staff records yet.
                  </td>
                </tr>
              )}
              {staff?.map((s) => (
                <tr key={s.staff_id} className="border-b border-border-soft last:border-0 hover:bg-background/60">
                  <td className="px-5 py-3">
                    <Link href={`/admin/staff/${s.staff_id}`} className="font-medium text-ink hover:text-brand-600">
                      {[s.title, s.first_name, s.last_name].filter(Boolean).join(" ")}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{s.position ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {s.phone_number ? (
                      <a
                        href={whatsAppLink(s.phone_number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-brand-600"
                        title="Message on WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {s.phone_number}
                      </a>
                    ) : (
                      (s.email ?? "-")
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={s.is_active ? "success" : "neutral"}>
                      {s.is_active ? "Employed" : "Former"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
