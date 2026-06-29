import Link from "next/link";
import { signUpAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getEnvironmentStatus } from "@/lib/env";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    inviteCode?: string;
  }>;
};

function getSignupErrorMessage(error?: string, message?: string) {
  if (error === "config") {
    return message ?? "The app is missing required environment configuration.";
  }

  if (error === "invalid") {
    return "Please check the form and try again.";
  }

  if (error === "auth") {
    return "We could not create the account. The email may already be in use.";
  }

  return "Please check the form and try again.";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const envStatus = getEnvironmentStatus();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your household</CardTitle>
        <CardDescription>
          {envStatus.ok && envStatus.mode === "demo"
            ? "Local demo mode is active. Create account opens the demo household."
            : "Start with an account, then invite the meal planning crew."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!envStatus.ok ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {envStatus.error}
          </div>
        ) : null}
        {envStatus.ok && envStatus.mode === "demo" ? (
          <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            Demo mode does not create a Supabase account and is disabled for
            production deployments.
          </div>
        ) : null}
        {params.error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {getSignupErrorMessage(params.error, params.message)}
          </div>
        ) : null}
        <form action={signUpAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Household invite code</Label>
            <Input
              id="inviteCode"
              name="inviteCode"
              defaultValue={params.inviteCode ?? ""}
              placeholder="Optional"
              autoCapitalize="characters"
            />
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
