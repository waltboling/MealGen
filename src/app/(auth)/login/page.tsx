import Link from "next/link";
import { signInAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getEnvironmentStatus } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    inviteCode?: string;
    status?: string;
    email?: string;
  }>;
};

function getLoginErrorMessage(error?: string, message?: string) {
  if (error === "config") {
    return message ?? "The app is missing required environment configuration.";
  }

  if (error === "invalid") {
    return "Enter your email and password to sign in.";
  }

  if (error === "invalid-email") {
    return "Enter a valid email address, like name@example.com.";
  }

  if (error === "short-password") {
    return "Passwords are at least 6 characters. Check that the full password was entered.";
  }

  if (error === "invalid-credentials") {
    return "That email and password combination did not work. Check for typos, or use “Reset it” if you forgot your password.";
  }

  if (error === "email-not-confirmed") {
    return "That account exists, but the email has not been confirmed yet. Check your inbox for the confirmation email.";
  }

  return "Please check your email and password.";
}

function getLoginStatusMessage(status?: string, email?: string) {
  if (status === "check-email") {
    return email
      ? `Check ${email} to confirm your account, then sign in.`
      : "Check your email to confirm your account, then sign in.";
  }

  if (status === "password-updated") {
    return "Your password was updated. Sign in with the new password.";
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const envStatus = getEnvironmentStatus();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          {envStatus.ok && envStatus.mode === "demo"
            ? "Local demo mode is active. Sign in opens the demo household."
            : "Sign in to plan the week."}
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
            <p>{getLoginErrorMessage(params.error, params.message)}</p>
            {params.error === "email-not-confirmed" ? (
              <Link
                href={`/resend-confirmation${params.email ? `?email=${encodeURIComponent(params.email)}` : ""}`}
                className="mt-2 inline-block font-medium text-destructive underline-offset-4 hover:underline"
              >
                Resend confirmation email
              </Link>
            ) : null}
          </div>
        ) : null}
        {getLoginStatusMessage(params.status, params.email) ? (
          <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            {getLoginStatusMessage(params.status, params.email)}
          </div>
        ) : null}
        <form action={signInAction} autoComplete="on" className="space-y-4">
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
              autoComplete="current-password"
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
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <div className="mt-5 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Have a household code but no account yet?{" "}
          <Link
            href={
              params.inviteCode
                ? `/signup?inviteCode=${encodeURIComponent(params.inviteCode)}`
                : "/signup?mode=join"
            }
            className="font-medium text-primary"
          >
            Create an account to join
          </Link>
          .
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Forgot your password?{" "}
          <Link href="/forgot-password" className="font-medium text-primary">
            Reset it
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-medium text-primary">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
