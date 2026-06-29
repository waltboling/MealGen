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
  }>;
};

function getLoginErrorMessage(error?: string, message?: string) {
  if (error === "config") {
    return message ?? "The app is missing required environment configuration.";
  }

  if (error === "invalid") {
    return "Please enter a valid email and password.";
  }

  if (error === "auth") {
    return "We could not sign you in with those credentials.";
  }

  return "Please check your email and password.";
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
            {getLoginErrorMessage(params.error, params.message)}
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
            href={`/signup${params.inviteCode ? `?inviteCode=${encodeURIComponent(params.inviteCode)}` : ""}`}
            className="font-medium text-primary"
          >
            Create an account to join
          </Link>
          .
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-medium text-primary">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
