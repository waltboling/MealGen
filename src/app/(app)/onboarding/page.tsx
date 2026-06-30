import Link from "next/link";
import { redirect } from "next/navigation";
import { Home, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { createHouseholdOnboardingAction } from "@/features/onboarding/actions";
import { TasteProfileFields } from "@/features/onboarding/taste-profile-fields";
import { getCurrentUserOrRedirect, getPostAuthRedirect } from "@/lib/auth/user";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const user = await getCurrentUserOrRedirect();
  const destination = await getPostAuthRedirect(user.id);

  if (destination !== "/onboarding") {
    redirect(destination);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Choose your household path"
        description="Start a new household, or join an existing household with an invite code."
      />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="size-5" />
              Create household
            </CardTitle>
            <CardDescription>
              Start a shared planning space and create your own taste profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createHouseholdOnboardingAction} className="space-y-5">
              <Label className="space-y-2 text-sm font-medium">
                <span>Household name</span>
                <Input
                  name="householdName"
                  placeholder="The Boling Household"
                  required
                />
              </Label>
              <TasteProfileFields defaultName={user.name ?? user.email} />
              <Button type="submit">Create household</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              Join household
            </CardTitle>
            <CardDescription>
              Already invited? Accept the invite before creating your taste profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/onboarding/join" className="space-y-4">
              <Label className="space-y-2 text-sm font-medium">
                <span>Invite code</span>
                <Input
                  name="code"
                  placeholder="AB12CD34"
                  autoCapitalize="characters"
                  required
                />
              </Label>
              <Button type="submit" variant="outline">
                Continue
              </Button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              Invite links open this join flow automatically.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Signed in with the wrong account?{" "}
              <Link href="/login" className="font-medium text-primary">
                Go back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
