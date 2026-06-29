import { redirect } from "next/navigation";
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

export default async function AppLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const envStatus = getEnvironmentStatus();

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
        <AppNav />
        <main className="min-w-0 flex-1 px-5 py-6 pb-24 sm:px-8 lg:px-10 lg:pb-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex justify-end lg:hidden">
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
      <AppNav />
      <main className="min-w-0 flex-1 px-5 py-6 pb-24 sm:px-8 lg:px-10 lg:pb-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex justify-end lg:hidden">
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
