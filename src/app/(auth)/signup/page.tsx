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
    mode?: string;
  }>;
};

function getSignupErrorMessage(error?: string, message?: string) {
  if (error === "config") {
    return message ?? "The app is missing required environment configuration.";
  }

  if (error === "invalid") {
    return "Something in the form is incomplete. Check each field and try again.";
  }

  if (error === "missing-name") {
    return "Enter your name so your household can identify your profile.";
  }

  if (error === "invalid-email") {
    return "Enter a valid email address, like name@example.com.";
  }

  if (error === "short-password") {
    return "Use a password with at least 6 characters.";
  }

  if (error === "missing-invite-code") {
    return "Enter the household invite code from your invite link or from the person who invited you.";
  }

  if (error === "email-in-use") {
    return "An account already exists for that email. Sign in instead, or reset your password if you cannot access it.";
  }

  if (error === "signup-failed") {
    return "We could not create the account. Check the email and password, then try again.";
  }

  return "Something went wrong creating the account. Check the form and try again.";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const envStatus = getEnvironmentStatus();
  const isJoining = Boolean(params.inviteCode) || params.mode === "join";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {isJoining ? "Create account to join" : "Create your household"}
        </CardTitle>
        <CardDescription>
          {envStatus.ok && envStatus.mode === "demo"
            ? "Local demo mode is active. Create account opens the demo household."
            : isJoining
              ? "Use your invited email address, confirm your email, then accept the household invite."
              : "Create an account, confirm your email, then set up your household and taste profile."}
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
        {envStatus.ok && envStatus.mode !== "demo" ? (
          <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            After signup, check your inbox and confirm your email before signing
            in and finishing setup.
          </div>
        ) : null}
        {params.error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {getSignupErrorMessage(params.error, params.message)}
          </div>
        ) : null}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
          <Button asChild variant={!isJoining ? "default" : "ghost"} size="sm">
            <Link href="/signup">Create household</Link>
          </Button>
          <Button asChild variant={isJoining ? "default" : "ghost"} size="sm">
            <Link href="/signup?mode=join">Join household</Link>
          </Button>
        </div>

        <form action={signUpAction} autoComplete="on" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          {isJoining ? (
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Household invite code</Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                defaultValue={params.inviteCode ?? ""}
                placeholder="AB12CD34"
                autoCapitalize="characters"
                autoComplete="off"
                required
              />
            </div>
          ) : null}
          <Button type="submit" className="w-full">
            {isJoining ? "Create account and join" : "Create account"}
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
