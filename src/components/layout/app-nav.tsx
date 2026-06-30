import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { DesktopNavLinks } from "@/components/layout/nav-links";

type AppNavProps = {
  userName?: string | null;
  userEmail?: string | null;
};

function initialsFor(value?: string | null) {
  const source = value?.trim();

  if (!source) {
    return "ME";
  }

  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppNav({ userName, userEmail }: AppNavProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border bg-card px-5 py-6 lg:flex lg:flex-col">
      <Link href="/dashboard" className="mb-8 block">
        <Image
          src="/brand/mealgen-logo.png"
          alt="MealGen"
          width={170}
          height={85}
          priority
          className="h-auto w-40"
        />
        <div className="text-sm text-muted-foreground">Weekly meals, gently handled.</div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        <DesktopNavLinks />
      </nav>

      <Link
        href="/household#my-profile"
        className="mb-3 flex items-center gap-3 rounded-md border border-border bg-background px-3 py-3 text-sm transition-colors hover:border-primary/50"
      >
        <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initialsFor(userName ?? userEmail)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium">
            {userName ?? "My profile"}
          </span>
          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <UserRound className="size-3" />
            Taste profile
          </span>
        </span>
      </Link>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Sign out
        </Button>
      </form>
    </aside>
  );
}
