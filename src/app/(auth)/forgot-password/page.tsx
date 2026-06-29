import Link from "next/link";
import { requestPasswordResetAction } from "@/features/auth/actions";
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
import { getEnvironmentStatus } from "@/lib/env";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    status?: string;
    email?: string;
  }>;
};

function getResetRequestError(error?: string, message?: string) {
  if (error === "config") {
    return message ?? "The app is missing required environment configuration.";
  }

  if (error === "invalid") {
    return "Enter a valid email address.";
  }

  if (error === "reset") {
    return "We could not send a reset email. Try again in a moment.";
  }

  return "Something went wrong. Try again.";
}

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const envStatus = getEnvironmentStatus();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your account email and we will send a password reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!envStatus.ok ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {envStatus.error}
          </div>
        ) : null}
        {params.error ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {getResetRequestError(params.error, params.message)}
          </div>
        ) : null}
        {params.status === "sent" ? (
          <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            {params.email
              ? `Check ${params.email} for a reset link.`
              : "Check your email for a reset link."}
          </div>
        ) : null}
        {params.status === "demo" ? (
          <div className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            Password reset is not available in demo mode.
          </div>
        ) : null}
        <form
          action={requestPasswordResetAction}
          autoComplete="on"
          className="space-y-4"
        >
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
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-primary">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
