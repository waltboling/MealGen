import Link from "next/link";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { DesktopNavLinks } from "@/components/layout/nav-links";

export function AppNav() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border bg-card px-5 py-6 lg:flex lg:flex-col">
      <Link href="/dashboard" className="mb-8 block">
        <div className="text-lg font-semibold">MealGen</div>
        <div className="text-sm text-muted-foreground">Weekly meals, gently handled.</div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        <DesktopNavLinks />
      </nav>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Sign out
        </Button>
      </form>
    </aside>
  );
}
