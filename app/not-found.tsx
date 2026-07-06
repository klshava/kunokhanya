import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-soft">
        The page you are looking for does not exist, or you may not have access to it.
      </p>
      <Link href="/">
        <Button variant="brand">Go home</Button>
      </Link>
    </div>
  );
}
