import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { getEnvironmentStatus, isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}

function initialsFor(value?: string | null) {
  const source = value?.trim();

  if (!source) {
    return "ME";
  }

  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const envStatus = getEnvironmentStatus();
  const demoUser = {
    name: "Jon",
    email: "jon@example.com"
  };

  if (!envStatus.ok) {
    return (
      <main className="min-h-screen bg-background px-6 py-12">
        <div className="mx-auto max-w-2xl rounded-lg border border-destructive/30 bg-card p-6">
          <h1 className="text-2xl font-semibold">App configuration needed</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {envStatus.error}
          </p>
        </div>
      </main>
    );
  }

  if (isDemoMode()) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppNav userName={demoUser.name} userEmail={demoUser.email} />
        <main className="min-w-0 flex-1 px-5 py-6 pb-24 sm:px-8 lg:px-10 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <Link
                href="/household#my-profile"
                className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              >
                JB
              </Link>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppNav
        userName={user.user_metadata?.name ?? null}
        userEmail={user.email ?? null}
      />
      <main className="min-w-0 flex-1 px-5 py-6 pb-24 sm:px-8 lg:px-10 lg:pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <Link
              href="/household#my-profile"
              className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            >
              {initialsFor(user.user_metadata?.name ?? user.email)}
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
