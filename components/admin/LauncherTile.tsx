import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tints = {
  brand: "from-brand-500 to-brand-700",
  blue: "from-sky-500 to-sky-700",
  violet: "from-violet-500 to-violet-700",
  amber: "from-amber-500 to-amber-600",
  rose: "from-rose-500 to-rose-600",
  emerald: "from-emerald-500 to-emerald-700",
  slate: "from-slate-500 to-slate-700",
} as const;

export function LauncherTile({
  href,
  label,
  description,
  icon: Icon,
  tint = "brand",
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  tint?: keyof typeof tints;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-3xl border border-border-soft bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-soft transition-transform duration-200 group-hover:scale-105",
          tints[tint]
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={2} />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">{label}</h3>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{description}</p>
      </div>
    </Link>
  );
}
