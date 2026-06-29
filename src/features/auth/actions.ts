"use server";

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
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
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

  redirect(await getPostAuthRedirect(data.user.id, parsed.data.inviteCode));
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
