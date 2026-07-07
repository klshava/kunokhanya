import Image from "next/image";
import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function TopBar({
  homeHref,
  userLabel,
}: {
  homeHref: string;
  userLabel?: string | null;
}) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-border-soft bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Kunokhanya Training Academy" width={32} height={33} />
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Kunokhanya Training Academy
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {userLabel && <span className="hidden text-sm text-ink-soft sm:inline">{userLabel}</span>}
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
