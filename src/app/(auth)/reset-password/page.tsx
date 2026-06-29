import Link from "next/link";
import { updatePasswordAction } from "@/features/auth/actions";
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

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

function getUpdatePasswordError(error?: string, message?: string) {
  if (error === "config") {
    return message ?? "The app is missing required environment configuration.";
  }

  if (error === "invalid") {
    return "Enter matching passwords with at least 6 characters.";
  }

  if (error === "update") {
    return "This reset link may have expired. Request a new password reset link.";
  }

  return "Something went wrong. Try again.";
}

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const envStatus = getEnvironmentStatus();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>
          Enter a new password for your MealGen account.
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
            {getUpdatePasswordError(params.error, params.message)}
          </div>
        ) : null}
        <form
          action={updatePasswordAction}
          autoComplete="on"
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Update password
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Need a new link?{" "}
          <Link href="/forgot-password" className="font-medium text-primary">
            Request another reset
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
