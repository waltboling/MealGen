import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { createLinkedTasteProfileAction } from "@/features/onboarding/actions";
import { TasteProfileFields } from "@/features/onboarding/taste-profile-fields";
import { getCurrentUserOrRedirect } from "@/lib/auth/user";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

type OnboardingProfilePageProps = {
  searchParams: Promise<{
    joined?: string;
  }>;
};

export default async function OnboardingProfilePage({
  searchParams
}: OnboardingProfilePageProps) {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const [params, user] = await Promise.all([
    searchParams,
    getCurrentUserOrRedirect()
  ]);
  const membership = await prisma.householdMembership.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    include: { household: true },
    orderBy: { createdAt: "asc" }
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const existingProfile = await prisma.householdMember.findFirst({
    where: {
      householdId: membership.householdId,
      linkedUserId: user.id,
      profileType: "USER_LINKED",
      active: true
    }
  });

  if (existingProfile) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Create your taste profile"
        description="This helps the household plan meals around your preferences, allergies, and spice level."
      />

      {params.joined ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          You joined {membership.household.name}. Add your taste profile to
          finish setup.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-5" />
            Your profile
          </CardTitle>
          <CardDescription>
            Full members manage their own profile. Household admins can see it,
            but they cannot edit it for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createLinkedTasteProfileAction} className="space-y-5">
            <TasteProfileFields defaultName={user.name ?? user.email} />
            <Button type="submit">Finish setup</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
