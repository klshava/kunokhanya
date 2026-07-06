import {
  UserPlus,
  Search,
  Receipt,
  BookOpen,
  BarChart3,
  Inbox,
  Users,
} from "lucide-react";
import { LauncherTile } from "@/components/admin/LauncherTile";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">What would you like to do?</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <LauncherTile
          href="/admin/students/new"
          label="Register Student"
          description="Add a new student record"
          icon={UserPlus}
          tint="brand"
        />
        <LauncherTile
          href="/admin/students"
          label="Look Up Student"
          description="Search and manage records"
          icon={Search}
          tint="blue"
        />
        <LauncherTile
          href="/admin/students?tab=fees"
          label="Fee Statements"
          description="View balances and payments"
          icon={Receipt}
          tint="amber"
        />
        <LauncherTile
          href="/admin/courses"
          label="Course Management"
          description="Programmes and fee structures"
          icon={BookOpen}
          tint="violet"
        />
        <LauncherTile
          href="/admin/reports"
          label="Reports"
          description="Enrollment and revenue summary"
          icon={BarChart3}
          tint="emerald"
        />
        <LauncherTile
          href="/admin/leads"
          label="Import Leads"
          description="Review website enquiries"
          icon={Inbox}
          tint="rose"
        />
        <LauncherTile
          href="/admin/staff"
          label="Staff Records"
          description="Manage staff information"
          icon={Users}
          tint="slate"
        />
      </div>
    </div>
  );
}
