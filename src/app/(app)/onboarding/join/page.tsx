import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
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
import { acceptHouseholdInviteAction } from "@/features/onboarding/actions";
import { getCurrentUserOrRedirect } from "@/lib/auth/user";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

type JoinHouseholdPageProps = {
  searchParams: Promise<{
    code?: string;
    error?: string;
  }>;
};

export default async function JoinHouseholdPage({
  searchParams
}: JoinHouseholdPageProps) {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const [params, user] = await Promise.all([
    searchParams,
    getCurrentUserOrRedirect()
  ]);
  const inviteCode = params.code ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Join a household"
        description="Accept your invite, then create your own taste profile."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            Household invite
          </CardTitle>
          <CardDescription>
            You are signed in as {user.email}. Invite codes are tied to the
            invited email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.error === "invite" ? (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              That invite code was not found for this email address. Check the
              code or sign in with the email that received the invite.
            </div>
          ) : null}
          <form action={acceptHouseholdInviteAction} className="space-y-4">
            <Label className="space-y-2 text-sm font-medium">
              <span>Invite code</span>
              <Input
                name="inviteCode"
                defaultValue={inviteCode}
                placeholder="AB12CD34"
                autoCapitalize="characters"
                required
              />
            </Label>
            <Button type="submit">Accept invite</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
