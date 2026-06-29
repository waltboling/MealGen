"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getEnvironmentStatus, isDemoMode, validateEnvironment } from "@/lib/env";
import { getPostAuthRedirect } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  inviteCode: z.string().trim().optional()
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(1).max(80)
});

const emailSchema = z.object({
  email: z.email()
});

const resetPasswordSchema = z.object({
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords must match.",
  path: ["confirmPassword"]
});

async function getRequestOrigin() {
  const headerStore = await headers();
  return headerStore.get("origin") ?? "http://127.0.0.1:3011";
}

export async function signInAction(formData: FormData) {
  const envStatus = getEnvironmentStatus();

  if (!envStatus.ok) {
    redirect(`/login?error=config&message=${encodeURIComponent(envStatus.error)}`);
  }

  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode")
  });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user) {
    const message = error?.message.toLowerCase() ?? "";

    if (message.includes("email not confirmed")) {
      redirect(
        `/login?error=email-not-confirmed&email=${encodeURIComponent(parsed.data.email)}`
      );
    }

    redirect("/login?error=auth");
  }

  redirect(await getPostAuthRedirect(data.user.id, parsed.data.inviteCode));
}

export async function signUpAction(formData: FormData) {
  const envStatus = getEnvironmentStatus();

  if (!envStatus.ok) {
    redirect(`/signup?error=config&message=${encodeURIComponent(envStatus.error)}`);
  }

  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode")
  });

  if (!parsed.success) {
    redirect("/signup?error=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();
  const inviteCode = parsed.data.inviteCode?.trim();
  const nextPath = inviteCode
    ? `/onboarding/join?code=${encodeURIComponent(inviteCode)}`
    : "/onboarding";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      data: {
        name: parsed.data.name
      }
    }
  });

  if (error) {
    redirect("/signup?error=auth");
  }

  if (!data.user) {
    redirect("/login");
  }

  if (!data.session) {
    redirect(
      `/login?status=check-email&email=${encodeURIComponent(parsed.data.email)}`
    );
  }

  redirect(await getPostAuthRedirect(data.user.id, parsed.data.inviteCode));
}

export async function requestPasswordResetAction(formData: FormData) {
  const envStatus = getEnvironmentStatus();

  if (!envStatus.ok) {
    redirect(
      `/forgot-password?error=config&message=${encodeURIComponent(envStatus.error)}`
    );
  }

  if (isDemoMode()) {
    redirect("/forgot-password?status=demo");
  }

  const parsed = emailSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect("/forgot-password?error=invalid");
  }

  const origin = await getRequestOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`
    }
  );

  if (error) {
    redirect("/forgot-password?error=reset");
  }

  redirect(
    `/forgot-password?status=sent&email=${encodeURIComponent(parsed.data.email)}`
  );
}

export async function resendConfirmationAction(formData: FormData) {
  const envStatus = getEnvironmentStatus();

  if (!envStatus.ok) {
    redirect(
      `/resend-confirmation?error=config&message=${encodeURIComponent(envStatus.error)}`
    );
  }

  if (isDemoMode()) {
    redirect("/resend-confirmation?status=demo");
  }

  const parsed = emailSchema.safeParse({
    email: formData.get("email")
  });

  if (!parsed.success) {
    redirect("/resend-confirmation?error=invalid");
  }

  const origin = await getRequestOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/onboarding")}`
    }
  });

  if (error) {
    redirect("/resend-confirmation?error=resend");
  }

  redirect(
    `/resend-confirmation?status=sent&email=${encodeURIComponent(parsed.data.email)}`
  );
}

export async function updatePasswordAction(formData: FormData) {
  const envStatus = getEnvironmentStatus();

  if (!envStatus.ok) {
    redirect(
      `/reset-password?error=config&message=${encodeURIComponent(envStatus.error)}`
    );
  }

  if (isDemoMode()) {
    redirect("/login");
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    redirect("/reset-password?error=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    redirect("/reset-password?error=update");
  }

  redirect("/login?status=password-updated");
}

export async function signOutAction() {
  validateEnvironment();

  if (isDemoMode()) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
